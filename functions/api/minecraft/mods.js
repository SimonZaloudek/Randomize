// GET /api/minecraft/mods - random mod/modpack roulette backed by the Modrinth
// API (free, no key; they ask for a descriptive User-Agent). Curated rolls pick
// randomly inside the top-1000-by-downloads window for the chosen filters, so the
// result is a surprise but not a broken 12-download test upload. chaos=1 skips the
// quality floor entirely via /projects_random. Pages of 100 hits are KV-cached,
// the `minecraft` stat is counted server-side, and the endpoint is rate-limited.
import { incrementStat } from "../_stats.js";
import { rateLimited, tooMany } from "../_ratelimit.js";

const API = "https://api.modrinth.com/v2";
const UA = "userandomize.net (minecraft mod roulette; contact via site)";
const PAGE_SIZE = 100;
const MAX_PAGES = 10;            // quality window: top 1000 by downloads
const DATA_TTL = 6 * 60 * 60;    // 6h - rankings move slowly

const TYPES = ["mod", "modpack"];
const LOADERS = ["fabric", "forge", "neoforge", "quilt"];
// loader/platform slugs that read as noise in the category chips
const PLATFORM_TAGS = new Set([
  ...LOADERS, "bukkit", "paper", "purpur", "spigot", "folia", "sponge",
  "bungeecord", "velocity", "waterfall", "datapack", "liteloader", "modloader", "rift",
]);

export async function onRequestGet({ request, env }) {
  if (!env.STATS) return json({ error: "Server not configured" }, 500);
  if (await rateLimited(env, request, "minecraft")) return tooMany();

  const q = new URL(request.url).searchParams;
  const type = TYPES.includes(q.get("type")) ? q.get("type") : "mod";
  const loader = LOADERS.includes(q.get("loader")) ? q.get("loader") : null;
  const category = clean(q.get("category"));
  const version = clean(q.get("version"));
  const count = Math.min(8, Math.max(1, Number(q.get("count")) || 1));
  const chaos = q.get("chaos") === "1";

  const mods = chaos
    ? await chaosRoll(type, count)
    : await curatedRoll(env, { type, loader, category, version }, count);

  if (!mods || mods.length === 0)
    return json({ error: "Modrinth had nothing for those filters." }, 502);

  await incrementStat(env, "minecraft");
  return json({ mods });
}

// facet slugs are lowercase kebab; anything else is dropped, not errored
function clean(v) {
  return v && /^[a-z0-9.-]{1,40}$/.test(v) ? v : null;
}

// ---------------------------------------------------------------------------
// curated: random page inside the top-downloads window, then sample from it
// ---------------------------------------------------------------------------
async function curatedRoll(env, f, count) {
  let page = Math.floor(Math.random() * MAX_PAGES);
  let data = await cachedPage(env, f, page);
  if (!data) return null;

  // niche filters may not fill 10 pages - clamp to the last page that exists
  if (data.hits.length === 0 && data.total_hits > 0) {
    page = Math.floor((Math.min(data.total_hits, PAGE_SIZE * MAX_PAGES) - 1) / PAGE_SIZE);
    data = await cachedPage(env, f, page);
    if (!data) return null;
  }
  if (data.hits.length === 0) return null;

  return sample(data.hits, count).map(h => shapeHit(h, f.type));
}

async function cachedPage(env, f, page) {
  const key = `mc:mods:${f.type}:${f.loader ?? "any"}:${f.category ?? "any"}:${f.version ?? "any"}:p${page}:v1`;
  try {
    const hit = await env.STATS.get(key, { type: "json" });
    if (hit) return hit;
  } catch { /* cache read is best-effort */ }

  const facets = [[`project_type:${f.type}`]];
  if (f.loader) facets.push([`categories:${f.loader}`]);
  if (f.category) facets.push([`categories:${f.category}`]);
  if (f.version) facets.push([`versions:${f.version}`]);

  const url = `${API}/search?index=downloads&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}` +
    `&facets=${encodeURIComponent(JSON.stringify(facets))}`;
  const data = await fetchJson(url);
  if (!data || !Array.isArray(data.hits)) return null;

  const slim = { total_hits: data.total_hits ?? data.hits.length, hits: data.hits.map(slimHit) };
  try { await env.STATS.put(key, JSON.stringify(slim), { expirationTtl: DATA_TTL }); } catch { }
  return slim;
}

// keep only what the UI shows - a full page of raw hits is ~10x this size in KV
function slimHit(h) {
  return {
    slug: h.slug,
    title: h.title,
    description: h.description,
    icon_url: h.icon_url || null,
    downloads: h.downloads ?? 0,
    author: h.author || null,
    categories: (h.categories || []).filter(c => !PLATFORM_TAGS.has(c)).slice(0, 4),
  };
}

// ---------------------------------------------------------------------------
// chaos: fully random projects, no quality floor - only the type is honoured
// ---------------------------------------------------------------------------
async function chaosRoll(type, count) {
  const data = await fetchJson(`${API}/projects_random?count=60`);
  if (!Array.isArray(data)) return null;
  const pool = data.filter(p => p.project_type === type);
  return sample(pool, count).map(p => shapeHit({
    slug: p.slug,
    title: p.title,
    description: p.description,
    icon_url: p.icon_url || null,
    downloads: p.downloads ?? 0,
    author: null,                              // project objects carry a team id, not a name
    categories: (p.categories || []).filter(c => !PLATFORM_TAGS.has(c)).slice(0, 4),
  }, type));
}

function shapeHit(h, type) {
  return { ...h, url: `https://modrinth.com/${type}/${h.slug}` };
}

function sample(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

function fetchJson(url) {
  return fetch(url, { headers: { "User-Agent": UA } })
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
