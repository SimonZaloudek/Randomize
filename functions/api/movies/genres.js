// GET /api/movies/genres - returns { movie, tv } genre lists from TMDB

const TMDB = "https://api.themoviedb.org/3";
const TTL  = 7 * 24 * 60 * 60;   // 7 days

export async function onRequestGet({ env }) {
  if (!env.TMDB_API_KEY || !env.STATS) {
    return json({ error: "Server not configured" }, 500);
  }

  const movie = await cached(env, "tmdb:genres:movie",
    () => tmdb(`${TMDB}/genre/movie/list?language=en-US`, env.TMDB_API_KEY));
  const tv = await cached(env, "tmdb:genres:tv",
    () => tmdb(`${TMDB}/genre/tv/list?language=en-US`, env.TMDB_API_KEY));

  return json({
    movie: movie?.genres || [],
    tv: tv?.genres || []
  });
}

async function tmdb(url, key) {
  const sep = url.includes("?") ? "&" : "?";
  const r = await fetch(`${url}${sep}api_key=${key}`, {
    headers: { Accept: "application/json" }
  });
  if (!r.ok) return null;
  return r.json();
}

async function cached(env, key, fetcher) {
  const hit = await env.STATS.get(key, { type: "json" });
  if (hit) return hit;
  const data = await fetcher();
  if (data) await env.STATS.put(key, JSON.stringify(data), { expirationTtl: TTL });
  return data;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
