// Cloudflare Pages Function — POST /api/contact
// Validates a contact form submission, runs Turnstile + per-IP rate limit,
// and sends via Resend.
//
// Required env / bindings:
//   RESEND_API_KEY     — Resend secret
//   CONTACT_TO         — destination email (also the Resend account email
//                        while using onboarding@resend.dev)
//   TURNSTILE_SECRET   — Cloudflare Turnstile secret key
//   STATS              — KV namespace (also used for usage counters)
//
// Rate limit: at most RATE_LIMIT successful-validation submissions per IP
// per RATE_WINDOW_SEC. Failed validation / honeypot drops don't burn the
// quota so a typo doesn't lock a user out.

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

  const name = sanitize(body?.name, 100);
  const email = sanitize(body?.email, 254);
  const subject = sanitize(body?.subject, 200);
  const message = sanitize(body?.message, 5000);
  const type = String(body?.type || "").trim();
  const honeypot = String(body?.website || "");
  const turnstileToken = String(body?.turnstileToken || "");

  // Bots fill hidden fields. Pretend everything's fine and drop the message
  // without burning the legitimate user's rate-limit quota.
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
  if (!apiKey || !to || !turnstileSecret) {
    return json({ error: "Server not configured" }, 500);
  }

  // ---- Rate limit (before Turnstile so we don't waste verify calls on
  //      already-blocked IPs). CF sets CF-Connecting-IP on every request. ----
  const ip = request.headers.get("CF-Connecting-IP")
          || request.headers.get("X-Forwarded-For")
          || "unknown";
  const rateKey = `rate:contact:${ip}`;
  if (env.STATS) {
    const count = Number(await env.STATS.get(rateKey) ?? 0);
    if (count >= RATE_LIMIT) {
      return json({ error: "Rate limit exceeded" }, 429);
    }
  }

  // ---- Turnstile verify ----
  const tsOk = await verifyTurnstile(turnstileSecret, turnstileToken, ip);
  if (!tsOk) {
    return json({ error: "Verification failed" }, 403);
  }

  // ---- Bump rate counter only after passing both checks ----
  if (env.STATS) {
    const count = Number(await env.STATS.get(rateKey) ?? 0);
    await env.STATS.put(rateKey, String(count + 1), { expirationTtl: RATE_WINDOW_SEC });
  }

  // ---- Send via Resend ----
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
      from: "Randomize <onboarding@resend.dev>",
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

export async function onRequest({ request }) {
  if (request.method === "POST") return;
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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
