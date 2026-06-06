// POST /api/contact - validate, rate-limit, Turnstile-check, send via Resend.
// Env: RESEND_API_KEY, CONTACT_TO, TURNSTILE_SECRET, STATS (KV).

const ALLOWED_TYPES = ["bug", "feature", "other"];
const TYPE_LABELS = {
  bug: "Bug report",
  feature: "Feature request",
  other: "Other"
};

const RATE_LIMIT = 3;
const RATE_WINDOW_SEC = 3600;   // 1 hour

export async function onRequestPost({ request, env }) {
  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return json({ error: "Invalid content type" }, 415);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid JSON" }, 400); }

  // strip CR/LF from header-bound fields; message keeps its newlines
  const name = sanitizeLine(body?.name, 100);
  const email = sanitizeLine(body?.email, 254);
  const subject = sanitizeLine(body?.subject, 200);
  const message = sanitize(body?.message, 5000);
  const type = String(body?.type || "").trim();
  const honeypot = String(body?.website || "");
  const turnstileToken = String(body?.turnstileToken || "");

  // honeypot: silently accept and drop
  if (honeypot) return json({ ok: true }, 200);

  if (!ALLOWED_TYPES.includes(type)) {
    return json({ error: "Invalid type" }, 400);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Valid email required" }, 400);
  }
  if (!message || message.length < 5) {
    return json({ error: "Message must be at least 5 characters" }, 400);
  }
  if (!turnstileToken) {
    return json({ error: "Missing verification" }, 403);
  }

  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO;
  const turnstileSecret = env.TURNSTILE_SECRET;
  // STATS backs the rate limit, so it's required too
  if (!apiKey || !to || !turnstileSecret || !env.STATS) {
    return json({ error: "Server not configured" }, 500);
  }

  // rate limit before Turnstile so blocked IPs don't cost a verify call
  const ip = request.headers.get("CF-Connecting-IP")
          || request.headers.get("X-Forwarded-For")
          || "unknown";
  const rateKey = `rate:contact:${ip}`;
  const count = Number(await env.STATS.get(rateKey) ?? 0);
  if (count >= RATE_LIMIT) {
    return json({ error: "Rate limit exceeded" }, 429);
  }

  const tsOk = await verifyTurnstile(turnstileSecret, turnstileToken, ip);
  if (!tsOk) {
    return json({ error: "Verification failed" }, 403);
  }

  // only count submissions that passed validation + Turnstile
  await env.STATS.put(rateKey, String(count + 1), { expirationTtl: RATE_WINDOW_SEC });

  const label = TYPE_LABELS[type];
  const subjectLine = `[Randomize • ${label}] ${subject || "(no subject)"}`;

  // escape user input before dropping it into the HTML body
  const esc = (s) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));

  // shared shell: circular logo header (same mark as the site nav) + Support footer
  const LOGO = "https://userandomize.net/brand/RANDLOGO1.png";
  const shell = (headerTag, body) => `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f4f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0a0a0a;padding:16px 24px;">
          <img src="${LOGO}" width="34" height="34" alt="" style="border-radius:50%;vertical-align:middle;" />
          <span style="color:#ffffff;font-size:18px;font-weight:bold;vertical-align:middle;margin-left:10px;">Randomize</span>${headerTag}
        </td></tr>
        <tr><td style="padding:24px;">${body}</td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #e4e4e7;text-align:center;">
          <p style="margin:0;color:#52525b;font-size:13px;font-weight:700;">Randomize Support</p>
          <p style="margin:3px 0 0;font-size:12px;"><a href="https://userandomize.net" style="color:#6d28d9;text-decoration:none;">userandomize.net</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const lbl = (t) => `<p style="margin:0 0 4px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:.04em;">${t}</p>`;

  // 1. notification to the owner (must succeed)
  const ownerHtml = shell(
    ` <span style="color:#9b7bff;font-size:13px;vertical-align:middle;">&middot; new ${esc(label)}</span>`,
    `${lbl("From")}
     <p style="margin:0 0 16px;color:#18181b;font-size:15px;">${esc(name || "Anonymous")} &lt;<a href="mailto:${esc(email)}" style="color:#6d28d9;text-decoration:none;">${esc(email)}</a>&gt;</p>
     ${subject ? `${lbl("Subject")}<p style="margin:0 0 16px;color:#18181b;font-size:15px;">${esc(subject)}</p>` : ""}
     ${lbl("Message")}
     <p style="margin:0;color:#27272a;font-size:15px;line-height:1.55;white-space:pre-wrap;">${esc(message)}</p>`
  );
  const ownerText =
    `Type: ${label}\n` +
    `From: ${name || "(anonymous)"} <${email}>\n\n` +
    `${message}\n`;

  // 2. friendly confirmation to the sender, with a copy of their message
  const customerHtml = shell(
    "",
    `<p style="margin:0 0 12px;color:#18181b;font-size:17px;font-weight:700;">Thanks for reaching out!</p>
     <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.55;">I've received your message and will review it as soon as possible. Here's a copy for your records:</p>
     <div style="background:#f4f4f5;border-radius:8px;padding:14px 16px;">
       ${subject ? `<p style="margin:0 0 8px;color:#52525b;font-size:13px;"><strong>Subject:</strong> ${esc(subject)}</p>` : ""}
       <p style="margin:0;color:#27272a;font-size:14px;line-height:1.55;white-space:pre-wrap;">${esc(message)}</p>
     </div>`
  );
  const customerText =
    `Thanks for reaching out!\n\n` +
    `I've received your message and will review it as soon as possible. Here's a copy for your records:\n\n` +
    `${subject ? "Subject: " + subject + "\n" : ""}${message}\n\n` +
    `- Randomize Support, userandomize.net\n`;

  const send = (payload) => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const r = await send({
    from: "Randomize <noreply@userandomize.net>",
    to: [to],
    reply_to: email,         // owner's reply goes back to the sender
    subject: subjectLine,
    text: ownerText,
    html: ownerHtml
  });
  if (!r.ok) {
    const detail = await r.text();
    return json({ error: "Email send failed", detail }, 502);
  }

  // best-effort: never fail the request if the confirmation copy doesn't send
  try {
    await send({
      from: "Randomize <noreply@userandomize.net>",
      to: [email],
      reply_to: to,          // a sender reply reaches the owner inbox
      subject: "Thanks for contacting Randomize",
      text: customerText,
      html: customerHtml
    });
  } catch { }

  return json({ ok: true }, 200);
}

// non-POST lands here; POST is routed to onRequestPost
export async function onRequest() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { "allow": "POST" }
  });
}

async function verifyTurnstile(secret, token, ip) {
  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (ip && ip !== "unknown") form.append("remoteip", ip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data?.success === true;
  } catch {
    return false;
  }
}

function sanitize(v, max) {
  if (v == null) return "";
  return String(v).trim().slice(0, max);
}

// collapse CR/LF so values can't inject extra email headers
function sanitizeLine(v, max) {
  if (v == null) return "";
  return String(v).replace(/[\r\n]+/g, " ").trim().slice(0, max);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
