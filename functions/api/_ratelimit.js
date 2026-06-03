// Per-IP rate limit backed by the STATS KV (same idea as contact.js). Underscore
// prefix keeps Pages Functions from routing it. Generous by default so real users
// never hit it - only scripted hammering does. Fails OPEN: if KV is unavailable we
// don't block, since punishing real users for our outage is worse than the abuse.
export async function rateLimited(env, request, bucket, max = 40, windowSec = 60) {
    if (!env?.STATS) return false;
    const ip = request.headers.get("CF-Connecting-IP")
        || request.headers.get("X-Forwarded-For")
        || "unknown";
    const key = `rate:${bucket}:${ip}`;
    try {
        const count = Number(await env.STATS.get(key) ?? 0);
        if (count >= max) return true;
        await env.STATS.put(key, String(count + 1), { expirationTtl: windowSec });
        return false;
    } catch {
        return false;
    }
}

export function tooMany() {
    return new Response(
        JSON.stringify({ error: "Too many requests - give it a second." }),
        { status: 429, headers: { "content-type": "application/json; charset=utf-8", "retry-after": "10" } }
    );
}
