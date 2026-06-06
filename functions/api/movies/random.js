// GET /api/movies/random - random TMDB pick by type, genres, min rating
import { incrementStat } from "../_stats.js";
import { rateLimited, tooMany } from "../_ratelimit.js";

const TMDB = "https://api.themoviedb.org/3";
const OMDB = "https://www.omdbapi.com";
const IMG = "https://image.tmdb.org/t/p";

const DISCOVER_TTL = 6 * 60 * 60;     // 6h
const DETAIL_TTL   = 24 * 60 * 60;    // 24h
const OMDB_TTL     = 24 * 60 * 60;    // 24h
const PAGE_CAP     = 250;              // top ~5000 popularity-ranked results

// looser vote floor at high ratings
function minVotesFor(rating) {
  if (rating >= 9.0) return 25;
  return 50;
}

export async function onRequestGet({ request, env }) {
  if (!env.TMDB_API_KEY || !env.STATS) {
    return json({ error: "Server not configured" }, 500);
  }
  if (await rateLimited(env, request, "movies")) return tooMany();

  const url = new URL(request.url);
  const type = url.searchParams.get("type") === "tv" ? "tv" : "movie";
  const genres = (url.searchParams.get("genres") || "")
    .split(",").map(s => s.trim()).filter(s => /^\d+$/.test(s));
  const minRating = clampRating(url.searchParams.get("min_rating"));
  const fromYear = clampYear(url.searchParams.get("from_year"));
  const toYear = clampYear(url.searchParams.get("to_year"));
  const userMinVotes = clampVotes(url.searchParams.get("min_votes"));
  const originLang = clampCode(url.searchParams.get("lang"), /^[a-z]{2}$/);
  const originCountry = clampCode(url.searchParams.get("country"), /^[A-Z]{2}$/);

  // CF sets cf.country on prod; falls back to US locally (for watch providers)
  const country = (request.cf && request.cf.country) || "US";

  // user value overrides the safety scaler when explicitly set
  const minVotes = userMinVotes != null ? userMinVotes : minVotesFor(minRating);

  const params = new URLSearchParams({
    include_adult: "false",
    sort_by: "popularity.desc",
    "vote_count.gte": String(minVotes),
    language: "en-US",
  });
  if (genres.length) params.set("with_genres", genres.join(","));
  if (minRating > 0) params.set("vote_average.gte", String(minRating));
  if (originLang) params.set("with_original_language", originLang);
  if (originCountry) params.set("with_origin_country", originCountry);

  // TMDB uses primary_release_date for movies, first_air_date for TV
  const dateField = type === "tv" ? "first_air_date" : "primary_release_date";
  if (fromYear != null) params.set(`${dateField}.gte`, `${fromYear}-01-01`);
  if (toYear != null) params.set(`${dateField}.lte`, `${toYear}-12-31`);

  // bump v* if the discover query params change meaning
  const filterKey = `${type}:${genres.join(",")}:${minRating}:${minVotes}:${fromYear ?? ""}-${toYear ?? ""}:${originLang ?? ""}:${originCountry ?? ""}`;

  const first = await cached(env, `tmdb:discover:v4:${filterKey}:1`, DISCOVER_TTL,
    () => tmdb(`${TMDB}/discover/${type}?${params}&page=1`, env.TMDB_API_KEY),
    d => Array.isArray(d?.results));

  if (!first || !Array.isArray(first.results) || first.results.length === 0) {
    return json({ error: "No results for those filters" }, 404);
  }

  const totalPages = Math.min(Number(first.total_pages) || 1, PAGE_CAP);
  const page = 1 + Math.floor(Math.random() * totalPages);

  const pageData = page === 1 ? first : await cached(env,
    `tmdb:discover:v4:${filterKey}:${page}`, DISCOVER_TTL,
    () => tmdb(`${TMDB}/discover/${type}?${params}&page=${page}`, env.TMDB_API_KEY),
    d => Array.isArray(d?.results));

  const list = pageData?.results || [];
  if (!list.length) return json({ error: "No results found" }, 404);

  const pick = list[Math.floor(Math.random() * list.length)];

  const detail = await cached(env, `tmdb:detail:v2:${type}:${pick.id}`, DETAIL_TTL,
    () => tmdb(`${TMDB}/${type}/${pick.id}?append_to_response=images,external_ids,credits,watch/providers&language=en-US&include_image_language=en,null`,
               env.TMDB_API_KEY),
    d => d?.id != null);

  if (!detail) return json({ error: "Detail fetch failed" }, 502);

  const out = shape(detail, type, country);
  out.totalResults = Number(first.total_results) || list.length;

  // OMDb adds awards + IMDb rating; skipped if key/imdbId missing
  const imdbId = detail.external_ids?.imdb_id;
  if (imdbId && env.OMDB_API_KEY) {
    const om = await cached(env, `omdb:${imdbId}`, OMDB_TTL,
      () => omdb(imdbId, env.OMDB_API_KEY),
      d => d?.Response === "True");
    if (om) mergeOmdb(out, om);
  }

  await incrementStat(env, "movie");   // count server-side, not from the client
  return json(out);
}

function mergeOmdb(out, om) {
  out.awards = parseAwards(om.Awards);

  if (om.imdbRating && om.imdbRating !== "N/A") {
    out.ratings.push({
      source: "IMDb",
      score: parseFloat(om.imdbRating),
      max: 10,
      votes: parseInt((om.imdbVotes || "0").replace(/,/g, ""), 10) || 0
    });
  }

  // RT mostly Patreon-tier (free returns it for some titles)
  const rt = om.Ratings?.find(r => r.Source === "Rotten Tomatoes");
  if (rt) {
    const pct = parseInt(rt.Value, 10);
    if (Number.isFinite(pct)) {
      out.ratings.push({ source: "Rotten Tomatoes", score: pct, max: 100, votes: 0 });
    }
  }

  const mc = om.Ratings?.find(r => r.Source === "Metacritic");
  if (mc) {
    const score = parseInt(mc.Value, 10);
    if (Number.isFinite(score)) {
      out.ratings.push({ source: "Metacritic", score, max: 100, votes: 0 });
    }
  }
}

function parseAwards(s) {
  if (!s || s === "N/A") return null;

  const map = { "Oscar": "Oscar", "Primetime Emmy": "Emmy", "Golden Globe": "Golden Globe", "BAFTA": "BAFTA" };
  const highlights = [];
  for (const [src, label] of Object.entries(map)) {
    const won = s.match(new RegExp(`Won (\\d+) ${src}s?`, "i"));
    if (won) highlights.push({ kind: "win", label, count: parseInt(won[1], 10) });
    const nom = s.match(new RegExp(`Nominated for (\\d+) ${src}s?`, "i"));
    if (nom) highlights.push({ kind: "nomination", label, count: parseInt(nom[1], 10) });
  }

  const summary = s.match(/(\d[\d,]*)\s+wins?\s+&\s+(\d[\d,]*)\s+nominations?/i);
  const totalWins = summary ? parseInt(summary[1].replace(/,/g, ""), 10) : null;
  const totalNominations = summary ? parseInt(summary[2].replace(/,/g, ""), 10) : null;

  if (!highlights.length && totalWins == null) return null;
  return { highlights, totalWins, totalNominations };
}

async function omdb(imdbId, key) {
  const r = await fetch(`${OMDB}/?i=${imdbId}&apikey=${key}`, {
    headers: { Accept: "application/json" }
  });
  if (!r.ok) return null;
  return r.json();
}

function clampRating(s) {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 9.5) return 9.5;
  return Math.round(n * 10) / 10;
}

// null = unset, so the URL param is omitted (no filter)
function clampYear(s) {
  if (s == null || s === "") return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n)) return null;
  if (n < 1900) return 1900;
  if (n > 2100) return 2100;
  return n;
}

function clampVotes(s) {
  if (s == null || s === "") return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n > 100000) return 100000;
  return n;
}

// validate a short code against a pattern (lang iso-639-1 / country iso-3166-1); null = unset
function clampCode(s, re) {
  if (!s) return null;
  s = s.trim();
  return re.test(s) ? s : null;
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

// skip caching TMDB error envelopes (200 with success:false)
async function cached(env, key, ttl, fetcher, validate) {
  const hit = await env.STATS.get(key, { type: "json" });
  if (hit) return hit;
  const data = await fetcher();
  if (data && (!validate || validate(data))) {
    await env.STATS.put(key, JSON.stringify(data), { expirationTtl: ttl });
  }
  return data;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
