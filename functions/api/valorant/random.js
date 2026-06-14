// GET /api/valorant/random - Valorant Ultimate Bravery loadout from valorant-api.com
// (free, no key). Rolls an agent, a weapon to buy, a map + side, and a self-imposed
// rule. Raw API files are KV-cached, the `valorant` stat is counted server-side, and
// the endpoint is rate-limited - same pattern as the LoL randomizer.
import { incrementStat } from "../_stats.js";
import { rateLimited, tooMany } from "../_ratelimit.js";

const API = "https://valorant-api.com/v1";
const DATA_TTL = 24 * 60 * 60;   // 24h - static per patch

const SIDES = ["Attacking", "Defending"];

// curated Ultimate Bravery rules - self-imposed handicaps to commit to
const RULES = [
  "Use your signature ability every single round.",
  "Save your ultimate for the final round only.",
  "Every ability must be spent before you fire your first shot each round.",
  "No buying armor the entire match.",
  "You may only shoot while crouching.",
  "Walk everywhere - hold shift the whole match.",
  "Push the site every round; defaulting is forbidden.",
  "No holding angles - you must always be moving.",
  "Knife only until your first kill, then you may buy.",
  "Reload after every kill, even mid-fight.",
  "Drop your primary to a teammate every round you win.",
  "Voiceline or spray after every kill.",
  "Never scope or ADS the entire match.",
  "Full eco on the first round of each half.",
  "You must call out at least once every round.",
  "Plant or defuse only - no early peeks.",
];

export async function onRequestGet({ request, env }) {
  if (!env.STATS) return json({ error: "Server not configured" }, 500);
  if (await rateLimited(env, request, "valorant")) return tooMany();

  const url = new URL(request.url);
  const roll = parseRoll(url.searchParams.get("roll"));

  const data = await getData(env);
  if (!data) return json({ error: "Could not load Valorant data" }, 502);

  const out = generate(data, roll);
  await incrementStat(env, "valorant");
  return json(out);
}

// what to randomize; "all" = the full loadout
function parseRoll(param) {
  const all = ["agent", "weapon", "map", "rule"];
  if (!param || param === "all") return new Set(all);
  return new Set(param.split(",").map(s => s.trim()).filter(s => all.includes(s)));
}

// ---------------------------------------------------------------------------
// Randomization (pure - exported for tests)
// ---------------------------------------------------------------------------
export function generate(data, roll) {
  const out = {};
  if (roll.has("agent")) out.agent = shapeAgent(pick(data.agents));
  if (roll.has("weapon")) out.weapon = shapeWeapon(pick(data.weapons));
  if (roll.has("map")) out.map = { ...shapeMap(pick(data.maps)), side: pick(SIDES) };
  if (roll.has("rule")) out.rule = pick(RULES);
  return out;
}

function shapeAgent(a) {
  return {
    name: a.displayName,
    role: a.role?.displayName || null,
    roleIcon: a.role?.displayIcon || null,
    icon: a.displayIcon,
    portrait: a.fullPortrait || a.fullPortraitV2 || null,
    abilities: (a.abilities || [])
      .filter(ab => ab.displayName && ab.slot !== "Passive")
      .map(ab => ({ slot: ab.slot, name: ab.displayName, icon: ab.displayIcon })),
  };
}

function shapeWeapon(w) {
  return {
    name: w.displayName,
    category: w.shopData?.categoryText || "Melee",
    cost: w.shopData?.cost ?? 0,
    icon: w.displayIcon,
  };
}

function shapeMap(m) {
  return { name: m.displayName, splash: m.splash, icon: m.displayIcon };
}

// ---------------------------------------------------------------------------
// Data fetch + KV cache, then trim to the playable pools
// ---------------------------------------------------------------------------
export async function getData(env) {
  const [agents, weapons, maps] = await Promise.all([
    cachedJson(env, "val:agents:v1", () => fetchJson(`${API}/agents?isPlayableCharacter=true`)),
    cachedJson(env, "val:weapons:v1", () => fetchJson(`${API}/weapons`)),
    cachedJson(env, "val:maps:v1", () => fetchJson(`${API}/maps`)),
  ]);
  if (!agents?.data || !weapons?.data || !maps?.data) return null;

  const pools = {
    agents: agents.data.filter(a => a.displayIcon),
    weapons: weapons.data.filter(w => w.displayIcon),
    // playable maps carry coordinates; the practice Range is excluded
    maps: maps.data.filter(m => m.coordinates && m.splash && m.displayName !== "The Range"),
  };
  // empty pool would make pick() return undefined and crash shaping - bail instead
  if (!pools.agents.length || !pools.weapons.length || !pools.maps.length) return null;
  return pools;
}

function fetchJson(url) {
  return fetch(url).then(r => (r.ok ? r.json() : null)).catch(() => null);
}

async function cachedJson(env, key, fetcher) {
  const hit = await env.STATS.get(key, { type: "json" });
  if (hit) return hit;
  const data = await fetcher();
  if (data?.data) await env.STATS.put(key, JSON.stringify(data), { expirationTtl: DATA_TTL });
  return data;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
