// GET /api/lol/team - distinct random champions for the Team Comp Roller.
// One request rolls the whole team (instead of 5x /api/lol/random), so a roll
// costs one rate-limit hit and one stat count. Roles are assigned client-side.
//
// Query: size=1..5 (default 5)         how many champions to roll
//        not=csv of champion ids       exclude (locked slots / other players)
//        c=csv of champion ids         pinned: rebuild a shared comp, no rolling
import { incrementStat } from "../_stats.js";
import { rateLimited, tooMany } from "../_ratelimit.js";
import { getVersion, getData, shapeChampion } from "./random.js";

export async function onRequestGet({ request, env }) {
  if (!env.STATS) return json({ error: "Server not configured" }, 500);
  if (await rateLimited(env, request, "lol")) return tooMany();

  const url = new URL(request.url);
  const csv = s => (s ? s.split(",").map(x => x.trim()).filter(Boolean) : []);
  const pins = csv(url.searchParams.get("c")).slice(0, 5);
  const not = new Set(csv(url.searchParams.get("not")));
  const size = Math.min(5, Math.max(1, parseInt(url.searchParams.get("size"), 10) || 5));

  const version = await getVersion(env);
  const data = await getData(env, version);

  const champions = pins.length
    ? pins.map(id => data.championById[id]).filter(Boolean).map(c => shapeChampion(c, version))
    : shuffle(data.champions.filter(c => !not.has(c.id))).slice(0, size).map(c => shapeChampion(c, version));

  await incrementStat(env, "lol");
  return json({ version, champions });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
