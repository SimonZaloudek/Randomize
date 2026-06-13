// GET /api/lol/random - random League of Legends loadout, Ultimate Bravery style.
// Data comes from Riot's free Data Dragon CDN (no key). We cache the raw files
// in KV, do the randomization server-side, and count a `lol` stat.
//
// Query: mode=sr|aram, roll=all | comma list of champion,role,spells,runes,skills,items
import { incrementStat } from "../_stats.js";
import { rateLimited, tooMany } from "../_ratelimit.js";

const DDRAGON = "https://ddragon.leagueoflegends.com";
const LANG = "en_US";
const VER_TTL  = 6 * 60 * 60;        // 6h - patch checks
const DATA_TTL = 24 * 60 * 60;       // 24h - static patch data

const ROLES = ["Top", "Jungle", "Mid", "Bot", "Support"];

// Stat shards aren't in runesReforged.json - they're a fixed 3-row set.
const SHARDS = [
  [{ name: "Adaptive Force", icon: "StatModsAdaptiveForceIcon.png" }, { name: "Attack Speed", icon: "StatModsAttackSpeedIcon.png" }, { name: "Ability Haste", icon: "StatModsCDRScalingIcon.png" }],
  [{ name: "Adaptive Force", icon: "StatModsAdaptiveForceIcon.png" }, { name: "Move Speed", icon: "StatModsMovementSpeedIcon.png" }, { name: "Health Scaling", icon: "StatModsHealthScalingIcon.png" }],
  [{ name: "Health", icon: "StatModsHealthPlusIcon.png" }, { name: "Tenacity & Slow Resist", icon: "StatModsTenacityIcon.png" }, { name: "Health Scaling", icon: "StatModsHealthScalingIcon.png" }],
];

export async function onRequestGet({ request, env }) {
  if (!env.STATS) return json({ error: "Server not configured" }, 500);
  if (await rateLimited(env, request, "lol")) return tooMany();

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "aram" ? "aram" : "sr";
  const roll = parseRoll(url.searchParams.get("roll"), mode);

  // pinned ids let a shared link rebuild the exact loadout (roll=none + ids)
  const qp = k => url.searchParams.get(k) || null;
  const csv = s => (s ? s.split(",").map(x => x.trim()).filter(Boolean) : []);
  const pin = {
    champion: qp("c"), role: qp("ro"), skills: qp("sk"),
    spells: csv(qp("s")), items: csv(qp("i")), runes: qp("r"), shards: qp("sh"),
  };

  const version = await getVersion(env);
  const data = await getData(env, version);

  const out = generate(data, { mode, roll, version, pin });

  // skin needs the per-champion file (champion.json has no skins), so it's async
  if (roll.has("skin")) out.skin = await randomSkin(env, version, data);

  await incrementStat(env, "lol");
  return json(out);
}

// chromas live in the skins list too but have no splash art (403). They're the
// ones with a colour in parens, e.g. "... (Ruby)" - but keep year re-releases "(2022)".
function isChroma(skin) {
  const m = (skin.name || "").match(/\(([^)]+)\)/);
  return !!m && !/^\d{4}$/.test(m[1].trim());
}

// pick a random champion, then a random real skin from its detail file
async function randomSkin(env, version, data) {
  const champ = pick(data.champions);
  if (!champ) return null;
  const detail = await cachedJson(env, `lol:skins:${version}:${champ.id}`,
    () => ddragon(version, `champion/${champ.id}.json`));
  const skins = (detail?.data?.[champ.id]?.skins || []).filter(s => !isChroma(s));
  const skin = pick(skins);
  if (!skin) return null;
  return {
    champion: champ.name,
    name: skin.num === 0 ? champ.name : skin.name,
    splash: `${DDRAGON}/cdn/img/champion/splash/${champ.id}_${skin.num}.jpg`,
    loading: `${DDRAGON}/cdn/img/champion/loading/${champ.id}_${skin.num}.jpg`,
  };
}

// what to randomize; "all" = the full challenge loadout.
// ARAM has no champion pick, no lanes, and a fixed Flash + Snowball.
const ALL = ["champion", "role", "spells", "runes", "skills", "items"];
const PICK = ["item", "skin"];                 // singular rolls used only by the modular picker
const VALID = new Set([...ALL, ...PICK]);
const ARAM_SKIP = ["champion", "role", "spells"];
function parseRoll(param, mode) {
  if (!param || param === "all")
    return new Set(mode === "aram" ? ALL.filter(p => !ARAM_SKIP.includes(p)) : ALL);
  const set = new Set(param.split(",").map(s => s.trim()).filter(s => VALID.has(s)));
  if (mode === "aram") for (const p of ARAM_SKIP) set.delete(p);
  return set;
}

// ---------------------------------------------------------------------------
// Randomization (pure - exported for tests)
// ---------------------------------------------------------------------------
export function generate(data, { mode, roll, version, pin = {} }) {
  const out = { version, mode };

  if (roll.has("champion")) out.champion = shapeChampion(pick(data.champions), version);
  else if (pin.champion && data.championById[pin.champion]) out.champion = shapeChampion(data.championById[pin.champion], version);

  if (mode === "sr") {
    if (roll.has("role")) out.role = pick(ROLES);
    else if (pin.role) out.role = pin.role;
  }

  if (roll.has("spells")) out.spells = randomSpells(data, mode, out.role ?? pin.role, version);
  else if (pin.spells?.length) out.spells = pin.spells.map(id => data.spellById[id]).filter(Boolean).map(s => shapeSpell(s, version));

  if (roll.has("skills")) out.skills = shuffle(["Q", "W", "E"]);
  else if (pin.skills) out.skills = pin.skills.split("").filter(c => "QWE".includes(c)).slice(0, 3);

  if (roll.has("runes")) out.runes = randomRunes(data.trees);
  else if (pin.runes) out.runes = hydrateRunes(data.runeById, pin.runes, pin.shards);

  if (roll.has("items")) out.items = randomItems(data, mode).map(i => shapeItem(i, version));
  else if (pin.items?.length) out.items = pin.items.map(id => data.itemById[id]).filter(Boolean).map(i => shapeItem(i, version));

  // picker: a single random legendary, separate from the full build above
  if (roll.has("item")) {
    const pool = data.legendaries.sr.length ? data.legendaries.sr : data.legendaries.aram;
    const it = pick(pool);
    if (it) out.item = shapeItem(it, version);
  }

  if (out.champion && out.items) out.cursedness = cursedness(out);
  return out;
}

// rebuild a rune page from a shared link: r = keystone-p1-p2-p3-s1-s2, sh = shard indices
function hydrateRunes(runeById, r, sh) {
  const ids = String(r).split("-").map(Number);
  const ks = runeById[ids[0]], s1 = runeById[ids[4]];
  if (!ks || !s1) return null;
  const idx = String(sh || "0,0,0").split(",").map(Number);
  return {
    primary: {
      name: ks.tree.name, icon: img(ks.tree.icon), keystone: rune(ks.rune),
      runes: ids.slice(1, 4).map(id => runeById[id]).filter(Boolean).map(x => rune(x.rune)),
    },
    secondary: {
      name: s1.tree.name, icon: img(s1.tree.icon),
      runes: ids.slice(4, 6).map(id => runeById[id]).filter(Boolean).map(x => rune(x.rune)),
    },
    shards: SHARDS.map((row, ri) => {
      const i = idx[ri] ?? 0, s = row[i] || row[0];
      return { name: s.name, icon: img(`perk-images/StatMods/${s.icon}`), idx: i };
    }),
  };
}

function randomRunes(trees) {
  const primary = pick(trees);
  const others = trees.filter(t => t.id !== primary.id);
  const secondary = pick(others);
  const secondaryRows = shuffle([secondary.slots[1], secondary.slots[2], secondary.slots[3]]).slice(0, 2);

  return {
    primary: {
      name: primary.name,
      icon: img(primary.icon),
      keystone: rune(pick(primary.slots[0].runes)),
      runes: [primary.slots[1], primary.slots[2], primary.slots[3]].map(s => rune(pick(s.runes))),
    },
    secondary: {
      name: secondary.name,
      icon: img(secondary.icon),
      runes: secondaryRows.map(s => rune(pick(s.runes))),
    },
    shards: SHARDS.map(row => {
      const idx = Math.floor(Math.random() * row.length);
      const s = row[idx];
      return { name: s.name, icon: img(`perk-images/StatMods/${s.icon}`), idx };
    }),
  };
}

// SR junglers always run Smite; everyone else gets two distinct spells for the mode
function randomSpells(data, mode, role, version) {
  const pool = data.spells[mode];
  if (mode === "sr" && role === "Jungle") {
    const smite = pool.find(s => s.id === "SummonerSmite");
    if (smite) {
      const other = pick(pool.filter(s => s.id !== "SummonerSmite"));
      return shuffle([smite, other].filter(Boolean)).map(s => shapeSpell(s, version));
    }
  }
  return pickTwo(pool).map(s => shapeSpell(s, version));
}

function randomItems(data, mode) {
  const boot = pick(data.boots);                          // boots are universal
  const legendaries = sample(data.legendaries[mode], 5);
  return boot ? [boot, ...legendaries] : legendaries;
}

// ---------------------------------------------------------------------------
// Shaping - attach names + Data Dragon art URLs
// ---------------------------------------------------------------------------
export function shapeChampion(c, v) {
  return {
    id: c.id,
    name: c.name,
    title: c.title,
    roles: c.tags || [],
    square: `${DDRAGON}/cdn/${v}/img/champion/${c.image.full}`,
    splash: `${DDRAGON}/cdn/img/champion/splash/${c.id}_0.jpg`,
    loading: `${DDRAGON}/cdn/img/champion/loading/${c.id}_0.jpg`,
  };
}

function shapeSpell(s, v) {
  return { id: s.id, name: s.name, icon: `${DDRAGON}/cdn/${v}/img/spell/${s.image.full}` };
}

function shapeItem(i, v) {
  return {
    id: i.id,
    name: i.name,
    icon: `${DDRAGON}/cdn/${v}/img/item/${i.image.full}`,
    gold: i.gold?.total ?? 0,
    tags: i.tags || [],
  };
}

function rune(r) {
  return { id: r.id, name: r.name, icon: img(r.icon) };
}

function img(path) {
  return `${DDRAGON}/cdn/img/${path}`;
}

// ---------------------------------------------------------------------------
// Cursedness meter - how troll is this build?
// ---------------------------------------------------------------------------
function cursedness(out) {
  const roles = out.champion.roles;
  const ad = roles.some(r => ["Marksman", "Fighter", "Assassin"].includes(r));
  const ap = roles.includes("Mage");
  const tags = out.items.flatMap(i => i.tags);
  const apItems = tags.filter(t => t === "SpellDamage").length;
  const adItems = tags.filter(t => t === "Damage" || t === "CriticalStrike").length;
  const crit = tags.filter(t => t === "CriticalStrike").length;

  let score = 15;
  if (ad && apItems >= 3) score += 45;                       // AD champ, AP items
  if (ap && adItems >= 3) score += 45;                       // mage, AD items
  if (crit > 0 && !roles.includes("Marksman")) score += 20;  // crit on a non-marksman
  if (out.champion.title && Math.random() < 0.5) score += randInt(0, 20);   // chaos spice

  score = Math.max(5, Math.min(100, score));
  const label = score > 75 ? "Cursed" : score > 50 ? "Troll" : score > 30 ? "Spicy" : "Playable";
  return { score, label };
}

// ---------------------------------------------------------------------------
// Data Dragon fetch + KV cache, then index into pools
// ---------------------------------------------------------------------------
export async function getVersion(env) {
  const cached = await env.STATS.get("lol:version", { type: "json" });
  if (cached && cached.at > Date.now() - VER_TTL * 1000) return cached.v;
  const r = await fetch(`${DDRAGON}/api/versions.json`).catch(() => null);
  const list = r && r.ok ? await r.json().catch(() => null) : null;
  const v = Array.isArray(list) && list[0] ? list[0] : "16.12.1";
  await env.STATS.put("lol:version", JSON.stringify({ v, at: Date.now() }), { expirationTtl: VER_TTL });
  return v;
}

export async function getData(env, version) {
  const [champ, spells, trees, items] = await Promise.all([
    cachedJson(env, `lol:champ:${version}`, () => ddragon(version, "champion.json")),
    cachedJson(env, `lol:spell:${version}`, () => ddragon(version, "summoner.json")),
    cachedJson(env, `lol:rune:${version}`,  () => ddragon(version, "runesReforged.json")),
    cachedJson(env, `lol:item:${version}`,  () => ddragon(version, "item.json")),
  ]);
  return buildData({ champ, spells, trees, items });
}

// exported for tests - turns raw Data Dragon files into ready-to-pick pools
export function buildData({ champ, spells, trees, items }) {
  const champions = Object.values(champ.data);
  const sp = Object.values(spells.data);
  const entries = Object.entries(items.data).map(([id, x]) => ({ id, ...x }));

  const isBoot = x => (x.tags || []).includes("Boots") && !x.into && x.gold?.purchasable && (x.gold.total || 0) >= 800;
  const isLegendary = x =>
    (x.gold?.total || 0) >= 2200 && !x.into && x.gold?.purchasable &&
    !x.requiredChampion && !x.consumed &&
    !(x.tags || []).includes("Boots") &&
    !(x.tags || []).includes("Consumable") &&
    !(x.tags || []).includes("Trinket") &&
    !(x.tags || []).includes("Jungle");

  const onMap = (arr, m) => arr.filter(x => x.maps?.[m]);
  const legendaries = entries.filter(isLegendary);

  // id -> rune (with its tree), for rebuilding shared rune pages
  const runeById = {};
  for (const tree of trees)
    for (const slot of tree.slots)
      for (const r of slot.runes)
        runeById[r.id] = { rune: r, tree };

  return {
    champions,
    championById: champ.data,
    spellById: Object.fromEntries(sp.map(s => [s.id, s])),
    itemById: Object.fromEntries(entries.map(x => [x.id, x])),
    runeById,
    spells: {
      sr:   sp.filter(s => s.modes.includes("CLASSIC")),
      aram: sp.filter(s => s.modes.includes("ARAM")),
    },
    trees,
    boots: entries.filter(isBoot),
    legendaries: { sr: onMap(legendaries, "11"), aram: onMap(legendaries, "12") },
  };
}

function ddragon(version, file) {
  return fetch(`${DDRAGON}/cdn/${version}/data/${LANG}/${file}`).then(r => (r.ok ? r.json() : null));
}

async function cachedJson(env, key, fetcher) {
  const hit = await env.STATS.get(key, { type: "json" });
  if (hit) return hit;
  const data = await fetcher();
  if (data) await env.STATS.put(key, JSON.stringify(data), { expirationTtl: DATA_TTL });
  return data;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function pickTwo(arr) {
  const a = pick(arr);
  let b = pick(arr);
  let guard = 0;
  while (b.id === a.id && guard++ < 20) b = pick(arr);
  return [a, b];
}

function sample(arr, n) {
  return shuffle([...arr]).slice(0, n);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
