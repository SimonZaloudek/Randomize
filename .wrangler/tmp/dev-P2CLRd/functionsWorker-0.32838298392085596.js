var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-oAV4ym/functionsWorker-0.32838298392085596.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var TMDB = "https://api.themoviedb.org/3";
var TTL = 7 * 24 * 60 * 60;
async function onRequestGet({ env }) {
  if (!env.TMDB_API_KEY || !env.STATS) {
    return json({ error: "Server not configured" }, 500);
  }
  const movie = await cached(
    env,
    "tmdb:genres:movie",
    () => tmdb(`${TMDB}/genre/movie/list?language=en-US`, env.TMDB_API_KEY),
    (d) => Array.isArray(d?.genres)
  );
  const tv = await cached(
    env,
    "tmdb:genres:tv",
    () => tmdb(`${TMDB}/genre/tv/list?language=en-US`, env.TMDB_API_KEY),
    (d) => Array.isArray(d?.genres)
  );
  return json({
    movie: movie?.genres || [],
    tv: tv?.genres || []
  });
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function tmdb(url, key) {
  const sep = url.includes("?") ? "&" : "?";
  const r = await fetch(`${url}${sep}api_key=${key}`, {
    headers: { Accept: "application/json" }
  });
  if (!r.ok) return null;
  return r.json();
}
__name(tmdb, "tmdb");
__name2(tmdb, "tmdb");
async function cached(env, key, fetcher, validate) {
  const hit = await env.STATS.get(key, { type: "json" });
  if (hit) return hit;
  const data = await fetcher();
  if (data && (!validate || validate(data))) {
    await env.STATS.put(key, JSON.stringify(data), { expirationTtl: TTL });
  }
  return data;
}
__name(cached, "cached");
__name2(cached, "cached");
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
__name(json, "json");
__name2(json, "json");
var TMDB2 = "https://api.themoviedb.org/3";
var OMDB = "https://www.omdbapi.com";
var IMG = "https://image.tmdb.org/t/p";
var DISCOVER_TTL = 6 * 60 * 60;
var DETAIL_TTL = 24 * 60 * 60;
var OMDB_TTL = 24 * 60 * 60;
var PAGE_CAP = 250;
function minVotesFor(rating) {
  if (rating >= 9) return 25;
  return 50;
}
__name(minVotesFor, "minVotesFor");
__name2(minVotesFor, "minVotesFor");
async function onRequestGet2({ request, env }) {
  if (!env.TMDB_API_KEY || !env.STATS) {
    return json2({ error: "Server not configured" }, 500);
  }
  const url = new URL(request.url);
  const type = url.searchParams.get("type") === "tv" ? "tv" : "movie";
  const genres = (url.searchParams.get("genres") || "").split(",").map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
  const minRating = clampRating(url.searchParams.get("min_rating"));
  const country = request.cf && request.cf.country || "US";
  const params = new URLSearchParams({
    include_adult: "false",
    sort_by: "popularity.desc",
    "vote_count.gte": String(minVotesFor(minRating)),
    language: "en-US"
  });
  if (genres.length) params.set("with_genres", genres.join(","));
  if (minRating > 0) params.set("vote_average.gte", String(minRating));
  const filterKey = `${type}:${genres.join(",")}:${minRating}`;
  const first = await cached2(
    env,
    `tmdb:discover:v2:${filterKey}:1`,
    DISCOVER_TTL,
    () => tmdb2(`${TMDB2}/discover/${type}?${params}&page=1`, env.TMDB_API_KEY),
    (d) => Array.isArray(d?.results)
  );
  if (!first || !Array.isArray(first.results) || first.results.length === 0) {
    return json2({ error: "No results for those filters" }, 404);
  }
  const totalPages = Math.min(Number(first.total_pages) || 1, PAGE_CAP);
  const page = 1 + Math.floor(Math.random() * totalPages);
  const pageData = page === 1 ? first : await cached2(
    env,
    `tmdb:discover:v2:${filterKey}:${page}`,
    DISCOVER_TTL,
    () => tmdb2(`${TMDB2}/discover/${type}?${params}&page=${page}`, env.TMDB_API_KEY),
    (d) => Array.isArray(d?.results)
  );
  const list = pageData?.results || [];
  if (!list.length) return json2({ error: "No results found" }, 404);
  const pick = list[Math.floor(Math.random() * list.length)];
  const detail = await cached2(
    env,
    `tmdb:detail:v2:${type}:${pick.id}`,
    DETAIL_TTL,
    () => tmdb2(
      `${TMDB2}/${type}/${pick.id}?append_to_response=images,external_ids,credits,watch/providers&language=en-US&include_image_language=en,null`,
      env.TMDB_API_KEY
    ),
    (d) => d?.id != null
  );
  if (!detail) return json2({ error: "Detail fetch failed" }, 502);
  const out = shape(detail, type, country);
  out.totalResults = Number(first.total_results) || list.length;
  const imdbId = detail.external_ids?.imdb_id;
  if (imdbId && env.OMDB_API_KEY) {
    const om = await cached2(
      env,
      `omdb:${imdbId}`,
      OMDB_TTL,
      () => omdb(imdbId, env.OMDB_API_KEY),
      (d) => d?.Response === "True"
    );
    if (om) mergeOmdb(out, om);
  }
  return json2(out);
}
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
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
  const rt = om.Ratings?.find((r) => r.Source === "Rotten Tomatoes");
  if (rt) {
    const pct = parseInt(rt.Value, 10);
    if (Number.isFinite(pct)) {
      out.ratings.push({ source: "Rotten Tomatoes", score: pct, max: 100, votes: 0 });
    }
  }
  const mc = om.Ratings?.find((r) => r.Source === "Metacritic");
  if (mc) {
    const score = parseInt(mc.Value, 10);
    if (Number.isFinite(score)) {
      out.ratings.push({ source: "Metacritic", score, max: 100, votes: 0 });
    }
  }
}
__name(mergeOmdb, "mergeOmdb");
__name2(mergeOmdb, "mergeOmdb");
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
__name(parseAwards, "parseAwards");
__name2(parseAwards, "parseAwards");
async function omdb(imdbId, key) {
  const r = await fetch(`${OMDB}/?i=${imdbId}&apikey=${key}`, {
    headers: { Accept: "application/json" }
  });
  if (!r.ok) return null;
  return r.json();
}
__name(omdb, "omdb");
__name2(omdb, "omdb");
function clampRating(s) {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 9.5) return 9.5;
  return Math.round(n * 10) / 10;
}
__name(clampRating, "clampRating");
__name2(clampRating, "clampRating");
function shape(d, type, country) {
  const isMovie = type === "movie";
  const date = (isMovie ? d.release_date : d.first_air_date) || "";
  const backdrops = (d.images?.backdrops || []).slice(0, 10).map((b) => `${IMG}/w780${b.file_path}`);
  const cast = (d.credits?.cast || []).slice(0, 8).map((c) => ({
    name: c.name,
    character: c.character || null,
    profile: c.profile_path ? `${IMG}/w185${c.profile_path}` : null
  }));
  const wp = d["watch/providers"]?.results || {};
  const region = wp[country] || wp.US || null;
  const mapProv = /* @__PURE__ */ __name2((arr) => (arr || []).map((p) => ({
    name: p.provider_name,
    logo: p.logo_path ? `${IMG}/w92${p.logo_path}` : null
  })), "mapProv");
  const providers = region ? {
    stream: mapProv(region.flatrate),
    rent: mapProv(region.rent),
    buy: mapProv(region.buy),
    free: mapProv(region.free),
    link: region.link || null
  } : null;
  const stats = {
    popularity: Math.round(d.popularity || 0),
    status: d.status || null,
    originalLanguage: d.original_language ? d.original_language.toUpperCase() : null,
    budget: isMovie ? d.budget || 0 : 0,
    revenue: isMovie ? d.revenue || 0 : 0,
    productionCountries: (d.production_countries || []).slice(0, 3).map((c) => c.iso_3166_1)
  };
  return {
    kind: type,
    id: d.id,
    title: isMovie ? d.title : d.name,
    tagline: d.tagline || null,
    year: date.slice(0, 4) || null,
    runtime: isMovie ? d.runtime || null : null,
    seasons: !isMovie ? d.number_of_seasons || null : null,
    episodes: !isMovie ? d.number_of_episodes || null : null,
    overview: d.overview || "",
    genres: (d.genres || []).map((g) => g.name),
    poster: d.poster_path ? `${IMG}/w500${d.poster_path}` : null,
    backdrop: d.backdrop_path ? `${IMG}/original${d.backdrop_path}` : null,
    images: backdrops,
    ratings: [
      {
        source: "TMDB",
        score: Number((d.vote_average ?? 0).toFixed(1)),
        max: 10,
        votes: d.vote_count || 0
      }
    ],
    stats,
    cast,
    providers,
    region: providers ? country : null,
    imdbId: d.external_ids?.imdb_id || null,
    homepage: d.homepage || null,
    links: {
      tmdb: `https://www.themoviedb.org/${type}/${d.id}`,
      imdb: d.external_ids?.imdb_id ? `https://www.imdb.com/title/${d.external_ids.imdb_id}` : null
    }
  };
}
__name(shape, "shape");
__name2(shape, "shape");
async function tmdb2(url, key) {
  const sep = url.includes("?") ? "&" : "?";
  const r = await fetch(`${url}${sep}api_key=${key}`, {
    headers: { Accept: "application/json" }
  });
  if (!r.ok) return null;
  return r.json();
}
__name(tmdb2, "tmdb2");
__name2(tmdb2, "tmdb");
async function cached2(env, key, ttl, fetcher, validate) {
  const hit = await env.STATS.get(key, { type: "json" });
  if (hit) return hit;
  const data = await fetcher();
  if (data && (!validate || validate(data))) {
    await env.STATS.put(key, JSON.stringify(data), { expirationTtl: ttl });
  }
  return data;
}
__name(cached2, "cached2");
__name2(cached2, "cached");
function json2(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
__name(json2, "json2");
__name2(json2, "json");
var ALLOWED_TYPES = ["bug", "feature", "other"];
var TYPE_LABELS = {
  bug: "Bug report",
  feature: "Feature request",
  other: "Other"
};
var RATE_LIMIT = 3;
var RATE_WINDOW_SEC = 3600;
async function onRequestPost({ request, env }) {
  const ct = request.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return json3({ error: "Invalid content type" }, 415);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json3({ error: "Invalid JSON" }, 400);
  }
  const name = sanitizeLine(body?.name, 100);
  const email = sanitizeLine(body?.email, 254);
  const subject = sanitizeLine(body?.subject, 200);
  const message = sanitize(body?.message, 5e3);
  const type = String(body?.type || "").trim();
  const honeypot = String(body?.website || "");
  const turnstileToken = String(body?.turnstileToken || "");
  if (honeypot) return json3({ ok: true }, 200);
  if (!ALLOWED_TYPES.includes(type)) {
    return json3({ error: "Invalid type" }, 400);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json3({ error: "Valid email required" }, 400);
  }
  if (!message || message.length < 5) {
    return json3({ error: "Message must be at least 5 characters" }, 400);
  }
  if (!turnstileToken) {
    return json3({ error: "Missing verification" }, 403);
  }
  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO;
  const turnstileSecret = env.TURNSTILE_SECRET;
  if (!apiKey || !to || !turnstileSecret || !env.STATS) {
    return json3({ error: "Server not configured" }, 500);
  }
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
  const rateKey = `rate:contact:${ip}`;
  const count = Number(await env.STATS.get(rateKey) ?? 0);
  if (count >= RATE_LIMIT) {
    return json3({ error: "Rate limit exceeded" }, 429);
  }
  const tsOk = await verifyTurnstile(turnstileSecret, turnstileToken, ip);
  if (!tsOk) {
    return json3({ error: "Verification failed" }, 403);
  }
  await env.STATS.put(rateKey, String(count + 1), { expirationTtl: RATE_WINDOW_SEC });
  const label = TYPE_LABELS[type];
  const subjectLine = `[Randomize \u2022 ${label}] ${subject || "(no subject)"}`;
  const text = `Type: ${label}
From: ${name || "(anonymous)"} <${email}>
IP:   ${ip}

${message}
`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Randomize <onboarding@resend.dev>",
      to: [to],
      reply_to: email,
      subject: subjectLine,
      text
    })
  });
  if (!r.ok) {
    const detail = await r.text();
    return json3({ error: "Email send failed", detail }, 502);
  }
  return json3({ ok: true }, 200);
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
async function onRequest() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { "allow": "POST" }
  });
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
async function verifyTurnstile(secret, token, ip) {
  try {
    const form = new FormData();
    form.append("secret", secret);
    form.append("response", token);
    if (ip && ip !== "unknown") form.append("remoteip", ip);
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data?.success === true;
  } catch {
    return false;
  }
}
__name(verifyTurnstile, "verifyTurnstile");
__name2(verifyTurnstile, "verifyTurnstile");
function sanitize(v, max) {
  if (v == null) return "";
  return String(v).trim().slice(0, max);
}
__name(sanitize, "sanitize");
__name2(sanitize, "sanitize");
function sanitizeLine(v, max) {
  if (v == null) return "";
  return String(v).replace(/[\r\n]+/g, " ").trim().slice(0, max);
}
__name(sanitizeLine, "sanitizeLine");
__name2(sanitizeLine, "sanitizeLine");
function json3(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
__name(json3, "json3");
__name2(json3, "json");
var TOOLS = [
  "string",
  // text randomizers
  "number",
  // number tools
  "wheel",
  "group",
  "shift",
  "movie",
  // movie / TV randomizer
  "coin-heads",
  "coin-tails"
];
var ACCIDENT_RESET = /* @__PURE__ */ new Date("2026-05-26T00:00:00Z");
var MS_PER_DAY = 864e5;
async function onRequestGet3({ env }) {
  if (!env.STATS) return json4({ error: "Server not configured" }, 500);
  const reads = await Promise.all(TOOLS.map((t) => env.STATS.get(`count:${t}`)));
  const counts = Object.fromEntries(TOOLS.map((t, i) => [t, Number(reads[i] ?? 0)]));
  const total = sum(counts);
  const wheelSpins = counts.wheel;
  const headsLanded = counts["coin-heads"];
  const tailsLanded = counts["coin-tails"];
  return json4({
    total,
    wheelSpins,
    headsLanded,
    tailsLanded,
    daysWithoutAccident: daysSinceReset(),
    counts
  });
}
__name(onRequestGet3, "onRequestGet3");
__name2(onRequestGet3, "onRequestGet");
async function onRequestPost2({ request, env }) {
  if (!env.STATS) return json4({ error: "Server not configured" }, 500);
  let body;
  try {
    body = await request.json();
  } catch {
    return json4({ error: "Invalid JSON" }, 400);
  }
  const tool = String(body?.tool || "");
  if (!TOOLS.includes(tool)) {
    return json4({ error: "Unknown tool" }, 400);
  }
  const key = `count:${tool}`;
  const cur = Number(await env.STATS.get(key) ?? 0);
  await env.STATS.put(key, String(cur + 1));
  return json4({ ok: true, count: cur + 1 });
}
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
function daysSinceReset() {
  const now = /* @__PURE__ */ new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const resetUtc = Date.UTC(
    ACCIDENT_RESET.getUTCFullYear(),
    ACCIDENT_RESET.getUTCMonth(),
    ACCIDENT_RESET.getUTCDate()
  );
  return Math.max(0, Math.round((todayUtc - resetUtc) / MS_PER_DAY));
}
__name(daysSinceReset, "daysSinceReset");
__name2(daysSinceReset, "daysSinceReset");
function sum(counts) {
  let n = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (k.startsWith("coin-")) continue;
    n += v;
  }
  return n;
}
__name(sum, "sum");
__name2(sum, "sum");
function json4(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
__name(json4, "json4");
__name2(json4, "json");
var routes = [
  {
    routePath: "/api/movies/genres",
    mountPath: "/api/movies",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/movies/random",
    mountPath: "/api/movies",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/contact",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/stats",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/stats",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/contact",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-xEj8Qy/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-xEj8Qy/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.32838298392085596.js.map
