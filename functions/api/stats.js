// /api/stats - GET returns the counters, POST { tool } increments one.
// Backed by the STATS KV namespace. Increments aren't atomic; that's fine here.
import { rateLimited, tooMany } from "./_ratelimit.js";

const TOOLS = [
  "string",       // text randomizers
  "number",       // number tools
  "wheel",
  "group",
  "shift",
  "movie",        // movie / TV randomizer
  "game",         // video game randomizer
  "song",         // song randomizer
  "rps",          // rock paper scissors arena
  "rps-rock",
  "rps-paper",
  "rps-scissors",
  "coin-heads",
  "coin-tails"
];

// bump this to reset the "days without an accident" counter
const ACCIDENT_RESET = new Date("2026-05-26T00:00:00Z");

const MS_PER_DAY = 86_400_000;

export async function onRequestGet({ env }) {
  if (!env.STATS) return json({ error: "Server not configured" }, 500);

  const reads = await Promise.all(TOOLS.map(t => env.STATS.get(`count:${t}`)));
  const counts = Object.fromEntries(TOOLS.map((t, i) => [t, Number(reads[i] ?? 0)]));

  const total = sum(counts);
  const wheelSpins = counts.wheel;
  const headsLanded = counts["coin-heads"];
  const tailsLanded = counts["coin-tails"];

  return json({
    total,
    wheelSpins,
    headsLanded,
    tailsLanded,
    games: counts.game,
    movies: counts.movie,
    songs: counts.song,
    rockWins: counts["rps-rock"],
    daysWithoutAccident: daysSinceReset(),
    counts
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.STATS) return json({ error: "Server not configured" }, 500);
  // ~1/sec/IP is plenty for real interaction (even rapid coin flips); blocks loops
  if (await rateLimited(env, request, "stats", 60)) return tooMany();

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid JSON" }, 400); }

  const tool = String(body?.tool || "");
  if (!TOOLS.includes(tool)) {
    return json({ error: "Unknown tool" }, 400);
  }

  // no rate limit on purpose - decorative counters, and a limiter would double
  // the KV writes. The allow-list above caps what can be written.
  const key = `count:${tool}`;
  const cur = Number(await env.STATS.get(key) ?? 0);
  await env.STATS.put(key, String(cur + 1));
  return json({ ok: true, count: cur + 1 });
}

// whole UTC calendar days from the reset date to today
function daysSinceReset() {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const resetUtc = Date.UTC(
    ACCIDENT_RESET.getUTCFullYear(),
    ACCIDENT_RESET.getUTCMonth(),
    ACCIDENT_RESET.getUTCDate()
  );
  return Math.max(0, Math.round((todayUtc - resetUtc) / MS_PER_DAY));
}

// total excludes the coin sub-counters (the flip already counts under "string")
function sum(counts) {
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
