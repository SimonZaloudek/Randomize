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
  const text =
    `Type: ${label}\n` +
    `From: ${name || "(anonymous)"} <${email}>\n` +
    `IP:   ${ip}\n` +
    `\n` +
    `${message}\n`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Randomize <noreply@userandomize.net>",
      to: [to],
      reply_to: email,
      subject: subjectLine,
      text
    })
  });

  if (!r.ok) {
    const detail = await r.text();
    return json({ error: "Email send failed", detail }, 502);
  }
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
