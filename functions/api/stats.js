// Cloudflare Pages Function — /api/stats
// GET  → returns all counters
// POST → { tool: "<key>" } increments one counter
//
// Backed by the STATS KV namespace (bound in CF Pages settings).
// Read-modify-write isn't atomic in KV; for a hobby site the occasional
// missed increment under heavy concurrency is fine.

const TOOLS = [
  "string",       // catch-all for text randomizers (shuffle, weighted, pw, token, emoji)
  "number",       // catch-all for number tools (rng, dice, lotto, multi, date, pin)
  "wheel",        // spinning wheel
  "group",        // group shuffler
  "shift",        // shift planner
  "coin-heads",   // coin flip → heads
  "coin-tails"    // coin flip → tails
];

// Bump this date when you "reset the accident counter" for the joke stat.
const ACCIDENT_RESET = new Date("2026-05-26T00:00:00Z");

export async function onRequestGet({ env }) {
  const reads = await Promise.all(TOOLS.map(t => env.STATS.get(`count:${t}`)));
  const counts = Object.fromEntries(TOOLS.map((t, i) => [t, Number(reads[i] ?? 0)]));

  // Derived totals exposed to the frontend so it doesn't have to know the keys.
  const total = sum(counts);
  const wheelSpins = counts.wheel;
  const headsLanded = counts["coin-heads"];
  const tailsLanded = counts["coin-tails"];
  const daysWithoutAccident = Math.max(
    0,
    Math.floor((Date.now() - ACCIDENT_RESET.getTime()) / 86_400_000)
  );

  return json({
    total,
    wheelSpins,
    headsLanded,
    tailsLanded,
    daysWithoutAccident,
    counts
  });
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid JSON" }, 400); }

  const tool = String(body?.tool || "");
  if (!TOOLS.includes(tool)) {
    return json({ error: "Unknown tool" }, 400);
  }

  const key = `count:${tool}`;
  const cur = Number(await env.STATS.get(key) ?? 0);
  await env.STATS.put(key, String(cur + 1));
  return json({ ok: true, count: cur + 1 });
}

function sum(counts) {
  // "Total randomizations" excludes the coin sub-counters because the coin
  // flip is already counted in `string`.
  let n = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (k.startsWith("coin-")) continue;
    n += v;
  }
  return n;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
