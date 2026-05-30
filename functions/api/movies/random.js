// GET /api/movies/random?type=movie|tv&genres=12,28&min_rating=7.5
// proxies TMDB, returns one random pick with details, cast, providers, images

const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

const DISCOVER_TTL = 6 * 60 * 60;     // 6h
const DETAIL_TTL   = 24 * 60 * 60;    // 24h
const PAGE_CAP     = 250;              // top ~5000 popularity-ranked results

// scale the vote-count floor by the rating filter; very high ratings
// legitimately live in lower-vote territory so we relax it there
function minVotesFor(rating) {
  if (rating >= 9.0) return 25;
  return 50;
}

export async function onRequestGet({ request, env }) {
  if (!env.TMDB_API_KEY || !env.STATS) {
    return json({ error: "Server not configured" }, 500);
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") === "tv" ? "tv" : "movie";
  const genres = (url.searchParams.get("genres") || "")
    .split(",").map(s => s.trim()).filter(s => /^\d+$/.test(s));
  const minRating = clampRating(url.searchParams.get("min_rating"));

  // visitor country drives the watch-provider region; CF sets this on prod
  const country = (request.cf && request.cf.country) || "US";

  const params = new URLSearchParams({
    include_adult: "false",
    sort_by: "popularity.desc",
    "vote_count.gte": String(minVotesFor(minRating)),
    language: "en-US",
  });
  if (genres.length) params.set("with_genres", genres.join(","));
  if (minRating > 0) params.set("vote_average.gte", String(minRating));

  // v2 cache key: old entries were built with a 100-vote floor; invalidate them
  const filterKey = `${type}:${genres.join(",")}:${minRating}`;

  const first = await cached(env, `tmdb:discover:v2:${filterKey}:1`, DISCOVER_TTL,
    () => tmdb(`${TMDB}/discover/${type}?${params}&page=1`, env.TMDB_API_KEY));

  if (!first || !Array.isArray(first.results) || first.results.length === 0) {
    return json({ error: "No results for those filters" }, 404);
  }

  const totalPages = Math.min(Number(first.total_pages) || 1, PAGE_CAP);
  const page = 1 + Math.floor(Math.random() * totalPages);

  const pageData = page === 1 ? first : await cached(env,
    `tmdb:discover:v2:${filterKey}:${page}`, DISCOVER_TTL,
    () => tmdb(`${TMDB}/discover/${type}?${params}&page=${page}`, env.TMDB_API_KEY));

  const list = pageData?.results || [];
  if (!list.length) return json({ error: "No results found" }, 404);

  const pick = list[Math.floor(Math.random() * list.length)];

  // v2 cache key - shape now includes cast/providers, don't reuse old entries
  const detail = await cached(env, `tmdb:detail:v2:${type}:${pick.id}`, DETAIL_TTL,
    () => tmdb(`${TMDB}/${type}/${pick.id}?append_to_response=images,external_ids,credits,watch/providers&language=en-US&include_image_language=en,null`,
               env.TMDB_API_KEY));

  if (!detail) return json({ error: "Detail fetch failed" }, 502);

  const out = shape(detail, type, country);
  out.totalResults = Number(first.total_results) || list.length;
  return json(out);
}

function clampRating(s) {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 9.5) return 9.5;
  return Math.round(n * 10) / 10;
}

function shape(d, type, country) {
  const isMovie = type === "movie";
  const date = (isMovie ? d.release_date : d.first_air_date) || "";

  const backdrops = (d.images?.backdrops || []).slice(0, 10)
    .map(b => `${IMG}/w780${b.file_path}`);

  const cast = (d.credits?.cast || []).slice(0, 8).map(c => ({
    name: c.name,
    character: c.character || null,
    profile: c.profile_path ? `${IMG}/w185${c.profile_path}` : null
  }));

  const wp = d["watch/providers"]?.results || {};
  const region = wp[country] || wp.US || null;
  const mapProv = arr => (arr || []).map(p => ({
    name: p.provider_name,
    logo: p.logo_path ? `${IMG}/w92${p.logo_path}` : null
  }));
  const providers = region ? {
    stream: mapProv(region.flatrate),
    rent:   mapProv(region.rent),
    buy:    mapProv(region.buy),
    free:   mapProv(region.free),
    link:   region.link || null
  } : null;

  const stats = {
    popularity: Math.round(d.popularity || 0),
    status: d.status || null,
    originalLanguage: d.original_language ? d.original_language.toUpperCase() : null,
    budget: isMovie ? (d.budget || 0) : 0,
    revenue: isMovie ? (d.revenue || 0) : 0,
    productionCountries: (d.production_countries || []).slice(0, 3).map(c => c.iso_3166_1)
  };

  return {
    kind: type,
    id: d.id,
    title: isMovie ? d.title : d.name,
    tagline: d.tagline || null,
    year: date.slice(0, 4) || null,
    runtime: isMovie ? (d.runtime || null) : null,
    seasons: !isMovie ? (d.number_of_seasons || null) : null,
    episodes: !isMovie ? (d.number_of_episodes || null) : null,
    overview: d.overview || "",
    genres: (d.genres || []).map(g => g.name),
    poster: d.poster_path ? `${IMG}/w500${d.poster_path}` : null,
    backdrop: d.backdrop_path ? `${IMG}/original${d.backdrop_path}` : null,
    images: backdrops,
    ratings: [
      { source: "TMDB",
        score: Number((d.vote_average ?? 0).toFixed(1)),
        max: 10,
        votes: d.vote_count || 0 }
    ],
    stats,
    cast,
    providers,
    region: providers ? country : null,
    imdbId: d.external_ids?.imdb_id || null,
    homepage: d.homepage || null,
    links: {
      tmdb: `https://www.themoviedb.org/${type}/${d.id}`,
      imdb: d.external_ids?.imdb_id
        ? `https://www.imdb.com/title/${d.external_ids.imdb_id}`
        : null
    }
  };
}

async function tmdb(url, key) {
  const sep = url.includes("?") ? "&" : "?";
  const r = await fetch(`${url}${sep}api_key=${key}`, {
    headers: { Accept: "application/json" }
  });
  if (!r.ok) return null;
  return r.json();
}

async function cached(env, key, ttl, fetcher) {
  const hit = await env.STATS.get(key, { type: "json" });
  if (hit) return hit;
  const data = await fetcher();
  if (data) await env.STATS.put(key, JSON.stringify(data), { expirationTtl: ttl });
  return data;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
