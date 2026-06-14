// GET /api/meals/random - random recipe from TheMealDB (free public key "1").
// No filter -> random.php (already returns full detail). With a filter we hit
// filter.php (id+name+thumb only), pick one at random, then lookup.php for the
// full recipe. Results are KV-cached, the `meal` stat is counted server-side,
// and the endpoint is rate-limited - same pattern as the movies/games proxies.
import { incrementStat } from "../_stats.js";
import { rateLimited, tooMany } from "../_ratelimit.js";

const MEALDB = "https://www.themealdb.com/api/json/v1";
const FILTER_TTL = 6 * 60 * 60;      // 6h - the id list for a filter
const DETAIL_TTL = 24 * 60 * 60;     // 24h - a single recipe

// Region-aware delivery links. No platform exposes a real per-dish/location API,
// so these are best-effort: a search URL where the site supports one, otherwise
// the homepage. Country comes from Cloudflare (request.cf.country).
const PLATFORM = {
  wolt:     { name: "Wolt",      url: q => `https://wolt.com/en/discovery/search?q=${q}` },
  bolt:     { name: "Bolt Food", url: () => "https://food.bolt.eu/" },
  bistrosk: { name: "Bistro.sk", url: () => "https://www.bistro.sk/" },
  foodora:  { name: "Foodora",   url: () => "https://www.foodora.com/" },
  ubereats: { name: "Uber Eats", url: q => `https://www.ubereats.com/search?q=${q}` },
  doordash: { name: "DoorDash",  url: q => `https://www.doordash.com/search/store/${q}/` },
};

const DELIVERY = {
  SK: ["bistrosk", "wolt", "bolt"],
  CZ: ["wolt", "bolt", "foodora"],
  US: ["ubereats", "doordash"],
  CA: ["ubereats", "doordash"],
  GB: ["ubereats", "foodora"],
};
const DEFAULT_DELIVERY = ["wolt", "ubereats"];

export async function onRequestGet({ request, env }) {
  if (!env.STATS) return json({ error: "Server not configured" }, 500);
  if (await rateLimited(env, request, "meals")) return tooMany();

  const url = new URL(request.url);
  const category = clean(url.searchParams.get("category"));
  const area = clean(url.searchParams.get("area"));
  const ingredient = clean(url.searchParams.get("ingredient"));

  let meal;

  if (category || area || ingredient) {
    // TheMealDB filters by one facet at a time; category wins, then area, then ingredient
    const { param, value } = pickFilter(category, area, ingredient);
    const list = await cached(env, `meal:filter:v1:${param}:${value.toLowerCase()}`, FILTER_TTL,
      () => mealdb(env, `filter.php?${param}=${encodeURIComponent(value)}`),
      d => Array.isArray(d?.meals));

    const items = list?.meals || [];
    if (!items.length) return json({ error: "No meals match that filter" }, 404);

    const id = items[Math.floor(Math.random() * items.length)].idMeal;
    const detail = await cached(env, `meal:detail:v1:${id}`, DETAIL_TTL,
      () => mealdb(env, `lookup.php?i=${id}`),
      d => d?.meals?.[0]);
    meal = detail?.meals?.[0];
  } else {
    // random.php is non-deterministic, so it's fetched fresh (never cached)
    const r = await mealdb(env, "random.php");
    meal = r?.meals?.[0];
  }

  if (!meal) return json({ error: "No meal found" }, 502);

  const out = shape(meal);
  out.delivery = deliveryFor(request, out.name);

  await incrementStat(env, "meal");
  return json(out);
}

// pick the delivery platforms for the visitor's country, each pointed at the dish
function deliveryFor(request, dishName) {
  const country = (request.cf && request.cf.country) || "";
  const codes = DELIVERY[country] || DEFAULT_DELIVERY;
  const q = encodeURIComponent(dishName);
  return codes.map(c => PLATFORM[c]).filter(Boolean).map(p => ({ name: p.name, url: p.url(q) }));
}

function pickFilter(category, area, ingredient) {
  if (category) return { param: "c", value: category };
  if (area) return { param: "a", value: area };
  return { param: "i", value: ingredient };
}

// flatten TheMealDB's strIngredient1..20 / strMeasure1..20 pairs into a clean list
function shape(m) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = (m[`strIngredient${i}`] || "").trim();
    const measure = (m[`strMeasure${i}`] || "").trim();
    if (name) ingredients.push({ name, measure });
  }

  return {
    id: m.idMeal,
    name: m.strMeal,
    category: m.strCategory || null,
    area: m.strArea || null,
    thumb: m.strMealThumb || null,
    instructions: m.strInstructions || "",
    tags: (m.strTags || "").split(",").map(t => t.trim()).filter(Boolean),
    ingredients,
    youtube: m.strYoutube || null,
    source: m.strSource || null,
  };
}

function mealdb(env, path) {
  const key = env.MEALDB_KEY || "1";
  return fetch(`${MEALDB}/${key}/${path}`)
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null);
}

async function cached(env, key, ttl, fetcher, validate) {
  const hit = await env.STATS.get(key, { type: "json" });
  if (hit) return hit;
  const data = await fetcher();
  if (data && (!validate || validate(data))) {
    await env.STATS.put(key, JSON.stringify(data), { expirationTtl: ttl });
  }
  return data;
}

function clean(s) {
  return (s || "").trim() || null;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
