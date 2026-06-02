var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-Kvl7B3/functionsWorker-0.662923986571836.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var IGDB = "https://api.igdb.com/v4";
var TOKEN_URL = "https://id.twitch.tv/oauth2/token";
var TTL = 7 * 24 * 60 * 60;
var TOKEN_KEY = "igdb:token:v1";
var PLATFORMS = [
  { id: 6, name: "PC (Windows)" },
  { id: 14, name: "Mac" },
  { id: 3, name: "Linux" },
  { id: 167, name: "PlayStation 5" },
  { id: 48, name: "PlayStation 4" },
  { id: 9, name: "PlayStation 3" },
  { id: 8, name: "PlayStation 2" },
  { id: 7, name: "PlayStation" },
  { id: 38, name: "PSP" },
  { id: 46, name: "PS Vita" },
  { id: 169, name: "Xbox Series X|S" },
  { id: 49, name: "Xbox One" },
  { id: 12, name: "Xbox 360" },
  { id: 11, name: "Xbox" },
  { id: 130, name: "Nintendo Switch" },
  { id: 41, name: "Wii U" },
  { id: 5, name: "Wii" },
  { id: 37, name: "Nintendo 3DS" },
  { id: 20, name: "Nintendo DS" },
  { id: 21, name: "GameCube" },
  { id: 4, name: "Nintendo 64" },
  { id: 19, name: "SNES" },
  { id: 18, name: "NES" },
  { id: 24, name: "Game Boy Advance" },
  { id: 34, name: "Android" },
  { id: 39, name: "iOS" }
];
async function onRequestGet({ env }) {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET || !env.STATS) {
    return json({ error: "Server not configured" }, 500);
  }
  const genres = await cached(
    env,
    "igdb:genres:v1",
    async () => {
      const token = await getToken(env);
      if (!token) return null;
      return igdb(
        `${IGDB}/genres`,
        `fields id,name; sort name asc; limit 50;`,
        token,
        env.TWITCH_CLIENT_ID
      );
    },
    (d) => Array.isArray(d)
  );
  return json({
    genres: Array.isArray(genres) ? genres.map((g) => ({ id: g.id, name: g.name })) : [],
    platforms: PLATFORMS
  });
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function getToken(env) {
  const hit = await env.STATS.get(TOKEN_KEY, { type: "json" });
  if (hit && hit.expires_at > Math.floor(Date.now() / 1e3) + 60) {
    return hit.access_token;
  }
  const r = await fetch(`${TOKEN_URL}?client_id=${env.TWITCH_CLIENT_ID}&client_secret=${env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
    method: "POST"
  });
  if (!r.ok) return null;
  const data = await r.json();
  if (!data.access_token) return null;
  const stored = {
    access_token: data.access_token,
    expires_at: Math.floor(Date.now() / 1e3) + (data.expires_in || 3600)
  };
  await env.STATS.put(TOKEN_KEY, JSON.stringify(stored), {
    expirationTtl: Math.max(60, (data.expires_in || 3600) - 120)
  });
  return data.access_token;
}
__name(getToken, "getToken");
__name2(getToken, "getToken");
async function igdb(url, body, token, clientId) {
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "Content-Type": "text/plain"
    },
    body
  });
  if (!r.ok) return null;
  return r.json();
}
__name(igdb, "igdb");
__name2(igdb, "igdb");
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
var IGDB2 = "https://api.igdb.com/v4";
var TOKEN_URL2 = "https://id.twitch.tv/oauth2/token";
var IMG = "https://images.igdb.com/igdb/image/upload";
var DISCOVER_TTL = 6 * 60 * 60;
var DETAIL_TTL = 24 * 60 * 60;
var TOKEN_KEY2 = "igdb:token:v1";
var OFFSET_CAP = 5e3;
function minVotesFor(rating) {
  if (rating >= 90) return 25;
  if (rating > 0) return 50;
  return 0;
}
__name(minVotesFor, "minVotesFor");
__name2(minVotesFor, "minVotesFor");
async function onRequestGet2({ request, env }) {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET || !env.STATS) {
    return json2({ error: "Server not configured" }, 500);
  }
  const url = new URL(request.url);
  const genres = parseIds(url.searchParams.get("genres"));
  const platforms = parseIds(url.searchParams.get("platforms"));
  const modes = parseIds(url.searchParams.get("modes"));
  const minRating = clampRating(url.searchParams.get("min_rating"));
  const userMinVotes = clampVotes(url.searchParams.get("min_votes"));
  const fromYear = clampYear(url.searchParams.get("from_year"));
  const toYear = clampYear(url.searchParams.get("to_year"));
  const minVotes = userMinVotes != null ? userMinVotes : minVotesFor(minRating);
  const token = await getToken2(env);
  if (!token) return json2({ error: "Auth failed" }, 502);
  const conds = [];
  if (genres.length) conds.push(`genres = (${genres.join(",")})`);
  if (platforms.length) conds.push(`platforms = (${platforms.join(",")})`);
  if (modes.length) conds.push(`game_modes = (${modes.join(",")})`);
  if (minRating > 0) conds.push(`rating >= ${minRating}`);
  if (minVotes > 0) conds.push(`rating_count >= ${minVotes}`);
  if (fromYear != null) conds.push(`first_release_date >= ${unixYearStart(fromYear)}`);
  if (toYear != null) conds.push(`first_release_date <= ${unixYearEnd(toYear)}`);
  conds.push("cover != null");
  const whereClause = `where ${conds.join(" & ")};`;
  const filterKey = `${genres.join(",")}:${platforms.join(",")}:${modes.join(",")}:${minRating}:${minVotes}:${fromYear ?? ""}-${toYear ?? ""}`;
  const countRes = await cached2(
    env,
    `igdb:count:v2:${filterKey}`,
    DISCOVER_TTL,
    () => igdb2(`${IGDB2}/games/count`, whereClause, token, env.TWITCH_CLIENT_ID),
    (d) => typeof d?.count === "number"
  );
  if (!countRes || countRes.count === 0) {
    return json2({ error: "No matches for those filters" }, 404);
  }
  const total = Math.min(countRes.count, OFFSET_CAP);
  const offset = Math.floor(Math.random() * Math.max(1, total - 50));
  const list = await cached2(
    env,
    `igdb:discover:v2:${filterKey}:${offset}`,
    DISCOVER_TTL,
    () => igdb2(
      `${IGDB2}/games`,
      `fields id,name; ${whereClause} sort total_rating_count desc; limit 50; offset ${offset};`,
      token,
      env.TWITCH_CLIENT_ID
    ),
    (d) => Array.isArray(d)
  );
  if (!Array.isArray(list) || list.length === 0) {
    return json2({ error: "No results found" }, 404);
  }
  const pick = list[Math.floor(Math.random() * list.length)];
  const detail = await cached2(
    env,
    `igdb:detail:v4:${pick.id}`,
    DETAIL_TTL,
    () => igdbDetail(pick.id, token, env.TWITCH_CLIENT_ID),
    (d) => Array.isArray(d) && d.length > 0
  );
  if (!detail || !detail.length) return json2({ error: "Detail fetch failed" }, 502);
  const game = detail[0];
  const steamAppId = pickSteamAppId(game.external_games, game.websites);
  const [ttbList, similar, steam] = await Promise.all([
    cached2(
      env,
      `igdb:ttb:v1:${pick.id}`,
      DETAIL_TTL,
      () => igdb2(
        `${IGDB2}/game_time_to_beats`,
        `fields hastily,normally,completely; where game_id = ${pick.id};`,
        token,
        env.TWITCH_CLIENT_ID
      ),
      (d) => Array.isArray(d)
    ),
    fetchSimilar(env, token, game.similar_games),
    steamAppId ? cached2(
      env,
      `steam:reviews:v2:${steamAppId}`,
      DETAIL_TTL,
      () => fetchSteamReviews(steamAppId),
      (d) => d != null
    ) : Promise.resolve(null)
  ]);
  const out = shape(game, ttbList?.[0] || null, similar);
  out.totalResults = countRes.count;
  if (steam) {
    out.ratings.push(steam.rating);
    if (Array.isArray(steam.reviews) && steam.reviews.length > 0) {
      out.steamReviews = steam.reviews;
    }
    if (steam.players != null) out.steamPlayers = steam.players;
  }
  if (steamAppId) out.steamAppId = steamAppId;
  out._debug = {
    steamAppId,
    externalGamesCount: (game.external_games || []).length,
    externalGamesSources: (game.external_games || []).map((e) => e.external_game_source ?? e.category),
    websitesCount: (game.websites || []).length,
    websitesTypes: (game.websites || []).map((w) => w.type ?? w.category),
    steamFetchOk: !!steam,
    similarCount: similar?.length || 0
  };
  return json2(out);
}
__name(onRequestGet2, "onRequestGet2");
__name2(onRequestGet2, "onRequestGet");
async function fetchSimilar(env, token, similarIds) {
  if (!Array.isArray(similarIds) || similarIds.length === 0) return [];
  const ids = similarIds.slice(0, 6).join(",");
  const data = await cached2(
    env,
    `igdb:similar:v1:${ids}`,
    DETAIL_TTL,
    () => igdb2(
      `${IGDB2}/games`,
      `fields id,name,slug,cover.image_id,first_release_date,url; where id = (${ids}) & cover != null;`,
      token,
      env.TWITCH_CLIENT_ID
    ),
    (d) => Array.isArray(d)
  );
  if (!Array.isArray(data)) return [];
  return data.map((g) => ({
    id: g.id,
    name: g.name,
    cover: g.cover?.image_id ? `${IMG}/t_cover_med/${g.cover.image_id}.jpg` : null,
    year: g.first_release_date ? new Date(g.first_release_date * 1e3).getUTCFullYear() : null,
    url: g.url || null
  }));
}
__name(fetchSimilar, "fetchSimilar");
__name2(fetchSimilar, "fetchSimilar");
var STEAM_SOURCE = 1;
var STEAM_WEBSITE = 13;
function pickSteamAppId(externals, websites) {
  const e = (externals || []).find(
    (x) => (x.external_game_source === STEAM_SOURCE || x.category === STEAM_SOURCE) && x.uid
  );
  if (e?.uid) return String(e.uid);
  const w = (websites || []).find(
    (x) => (x.type === STEAM_WEBSITE || x.category === STEAM_WEBSITE) && x.url
  );
  if (w) {
    const m = w.url.match(/store\.steampowered\.com\/app\/(\d+)/);
    if (m) return m[1];
  }
  return null;
}
__name(pickSteamAppId, "pickSteamAppId");
__name2(pickSteamAppId, "pickSteamAppId");
async function fetchSteamReviews(appId) {
  try {
    const reviewsUrl = `https://store.steampowered.com/appreviews/${appId}?json=1&language=english&num_per_page=3&review_type=all&purchase_type=all&filter=all`;
    const playersUrl = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`;
    const [reviewRes, playerRes] = await Promise.all([
      fetch(reviewsUrl, {
        headers: {
          Accept: "application/json",
          // CF Worker IPs get flagged without a browser-ish UA
          "User-Agent": "Mozilla/5.0 (compatible; Randomize/1.0; +https://randomize.pages.dev)"
        }
      }).catch(() => null),
      fetch(playersUrl).catch(() => null)
    ]);
    if (!reviewRes || !reviewRes.ok) return null;
    const rev = await reviewRes.json();
    const q = rev?.query_summary;
    if (!q || !q.total_reviews) return null;
    const pct = Math.round(q.total_positive / q.total_reviews * 100);
    const reviews = (rev.reviews || []).slice(0, 3).map((r) => ({
      text: (r.review || "").replace(/\r/g, "").trim().slice(0, 600),
      recommended: !!r.voted_up,
      votesUp: r.votes_up || 0,
      // playtime_forever is in minutes
      playtimeHours: Math.round((r.author?.playtime_forever || 0) / 60),
      timestamp: r.timestamp_created || null
    })).filter((r) => r.text.length > 0);
    let playerCount = null;
    if (playerRes && playerRes.ok) {
      const pj = await playerRes.json().catch(() => null);
      if (typeof pj?.response?.player_count === "number") {
        playerCount = pj.response.player_count;
      }
    }
    return {
      rating: {
        source: "Steam",
        score: pct,
        max: 100,
        votes: q.total_reviews,
        summary: q.review_score_desc || null
      },
      reviews,
      players: playerCount
    };
  } catch {
    return null;
  }
}
__name(fetchSteamReviews, "fetchSteamReviews");
__name2(fetchSteamReviews, "fetchSteamReviews");
async function getToken2(env) {
  const hit = await env.STATS.get(TOKEN_KEY2, { type: "json" });
  if (hit && hit.expires_at > Math.floor(Date.now() / 1e3) + 60) {
    return hit.access_token;
  }
  const r = await fetch(`${TOKEN_URL2}?client_id=${env.TWITCH_CLIENT_ID}&client_secret=${env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
    method: "POST"
  });
  if (!r.ok) return null;
  const data = await r.json();
  if (!data.access_token) return null;
  const stored = {
    access_token: data.access_token,
    expires_at: Math.floor(Date.now() / 1e3) + (data.expires_in || 3600)
  };
  await env.STATS.put(TOKEN_KEY2, JSON.stringify(stored), {
    expirationTtl: Math.max(60, (data.expires_in || 3600) - 120)
  });
  return data.access_token;
}
__name(getToken2, "getToken2");
__name2(getToken2, "getToken");
async function igdb2(url, body, token, clientId) {
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "Content-Type": "text/plain"
    },
    body
  });
  if (!r.ok) return null;
  return r.json();
}
__name(igdb2, "igdb2");
__name2(igdb2, "igdb");
async function igdbDetail(id, token, clientId) {
  const fields = [
    "id",
    "name",
    "slug",
    "summary",
    "storyline",
    "url",
    "first_release_date",
    "rating",
    "rating_count",
    "aggregated_rating",
    "aggregated_rating_count",
    "total_rating",
    "total_rating_count",
    "cover.image_id",
    "screenshots.image_id",
    "artworks.image_id",
    "genres.name",
    "platforms.id",
    "platforms.name",
    "platforms.abbreviation",
    "game_modes.name",
    "player_perspectives.name",
    "themes.name",
    "involved_companies.company.name",
    "involved_companies.developer",
    "involved_companies.publisher",
    "external_games.url",
    "external_games.external_game_source",
    "external_games.uid",
    "websites.url",
    "websites.type",
    "videos.video_id",
    "franchises.name",
    "collections.name",
    "similar_games"
  ];
  return igdb2(
    `${IGDB2}/games`,
    `fields ${fields.join(",")}; where id = ${id};`,
    token,
    clientId
  );
}
__name(igdbDetail, "igdbDetail");
__name2(igdbDetail, "igdbDetail");
function shape(g, ttb, similar) {
  const cover = g.cover?.image_id ? `${IMG}/t_cover_big/${g.cover.image_id}.jpg` : null;
  const screenshots = (g.screenshots || []).slice(0, 10).map((s) => `${IMG}/t_screenshot_huge/${s.image_id}.jpg`);
  const backdrop = g.artworks?.[0]?.image_id ? `${IMG}/t_screenshot_huge/${g.artworks[0].image_id}.jpg` : screenshots[0] || null;
  const developers = (g.involved_companies || []).filter((c) => c.developer).map((c) => c.company?.name).filter(Boolean);
  const publishers = (g.involved_companies || []).filter((c) => c.publisher).map((c) => c.company?.name).filter(Boolean);
  const ratings = [];
  if (g.aggregated_rating && (g.aggregated_rating_count || 0) > 0) {
    ratings.push({
      source: "Critics",
      score: Math.round(g.aggregated_rating),
      max: 100,
      votes: g.aggregated_rating_count,
      summary: null
    });
  }
  if (g.rating && (g.rating_count || 0) > 0) {
    ratings.push({
      source: "IGDB",
      score: Math.round(g.rating),
      max: 100,
      votes: g.rating_count,
      summary: null
    });
  }
  const platforms = (g.platforms || []).map((p) => ({
    id: p.id,
    name: p.name,
    abbr: p.abbreviation || null
  }));
  return {
    id: g.id,
    name: g.name,
    slug: g.slug || null,
    summary: g.summary || "",
    storyline: g.storyline || null,
    year: g.first_release_date ? new Date(g.first_release_date * 1e3).getUTCFullYear() : null,
    releaseDate: g.first_release_date ? new Date(g.first_release_date * 1e3).toISOString().slice(0, 10) : null,
    cover,
    backdrop,
    screenshots,
    genres: (g.genres || []).map((x) => x.name),
    platforms,
    gameModes: (g.game_modes || []).map((x) => x.name),
    perspectives: (g.player_perspectives || []).map((x) => x.name),
    themes: (g.themes || []).map((x) => x.name),
    developers,
    publishers,
    franchise: g.franchises?.[0]?.name || g.collections?.[0]?.name || null,
    ratings,
    stores: mergeStores(g.external_games || [], g.websites || [], platforms, g.name),
    igdbUrl: g.url || null,
    timeToBeat: ttb && (ttb.hastily || ttb.normally || ttb.completely) ? {
      hastily: ttb.hastily || null,
      normally: ttb.normally || null,
      completely: ttb.completely || null
    } : null,
    youtubeId: g.videos?.[0]?.video_id || null,
    similar: similar || []
  };
}
__name(shape, "shape");
__name2(shape, "shape");
var STORE_MAP = {
  1: { name: "Steam", icon: "steam" },
  5: { name: "GOG", icon: "gog" },
  11: { name: "Microsoft Store", icon: "microsoft" },
  13: { name: "App Store", icon: "apple" },
  15: { name: "Google Play", icon: "android" },
  17: { name: "Nintendo eShop", icon: "nintendo" },
  26: { name: "Epic Games Store", icon: "epic" },
  28: { name: "Oculus", icon: "oculus" },
  30: { name: "itch.io", icon: "itch" },
  31: { name: "Xbox Marketplace", icon: "xbox" },
  36: { name: "PlayStation Store", icon: "playstation" }
};
var STORE_PLATFORMS = {
  steam: [6, 14, 3],
  epic: [6],
  gog: [6, 14, 3],
  itch: [6, 14, 3],
  playstation: [167, 48, 9, 8, 7, 46, 38],
  xbox: [169, 49, 12, 11],
  nintendo: [130, 41, 5, 37, 20, 21, 4, 19, 18, 24]
};
function searchUrl(icon, name) {
  const q = encodeURIComponent(name);
  switch (icon) {
    case "steam":
      return `https://store.steampowered.com/search/?term=${q}`;
    case "epic":
      return `https://store.epicgames.com/en-US/browse?q=${q}`;
    case "gog":
      return `https://www.gog.com/en/games?query=${q}`;
    case "itch":
      return `https://itch.io/search?q=${q}`;
    case "playstation":
      return `https://store.playstation.com/en-us/search/${q}`;
    case "xbox":
      return `https://www.xbox.com/en-us/Search/Results?q=${q}`;
    case "nintendo":
      return `https://www.nintendo.com/us/search/?q=${q}&p=1&cat=gme&sort=df`;
    default:
      return null;
  }
}
__name(searchUrl, "searchUrl");
__name2(searchUrl, "searchUrl");
var WEBSITE_TO_ICON = {
  13: "steam",
  15: "itch",
  16: "epic",
  17: "gog"
};
function mergeStores(externals, websites, platforms, gameName) {
  const direct = {};
  for (const e of externals) {
    const source = e.external_game_source ?? e.category;
    const meta = STORE_MAP[source];
    if (!meta || !e.url) continue;
    if (!direct[meta.icon]) {
      direct[meta.icon] = { name: meta.name, icon: meta.icon, url: e.url, direct: true };
    }
  }
  for (const w of websites) {
    const type = w.type ?? w.category;
    const icon = WEBSITE_TO_ICON[type];
    if (!icon || !w.url || direct[icon]) continue;
    const meta = Object.values(STORE_MAP).find((m) => m.icon === icon);
    if (!meta) continue;
    direct[icon] = { name: meta.name, icon, url: w.url, direct: true };
  }
  const platformIds = new Set(platforms.map((p) => p.id));
  const result = [];
  const ordered = ["steam", "playstation", "xbox", "nintendo", "epic", "gog", "itch"];
  for (const icon of ordered) {
    if (direct[icon]) {
      result.push(direct[icon]);
      continue;
    }
    const platformsForStore = STORE_PLATFORMS[icon] || [];
    const applies = platformsForStore.some((pid) => platformIds.has(pid));
    if (!applies) continue;
    const url = searchUrl(icon, gameName);
    if (!url) continue;
    const meta = Object.values(STORE_MAP).find((m) => m.icon === icon) || { name: icon, icon };
    result.push({ name: meta.name, icon, url, direct: false });
  }
  for (const icon of Object.keys(direct)) {
    if (!ordered.includes(icon)) result.push(direct[icon]);
  }
  return result;
}
__name(mergeStores, "mergeStores");
__name2(mergeStores, "mergeStores");
function parseIds(s) {
  return (s || "").split(",").map((x) => x.trim()).filter((x) => /^\d+$/.test(x));
}
__name(parseIds, "parseIds");
__name2(parseIds, "parseIds");
function clampRating(s) {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 95) return 95;
  return Math.round(n);
}
__name(clampRating, "clampRating");
__name2(clampRating, "clampRating");
function clampYear(s) {
  if (s == null || s === "") return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n)) return null;
  if (n < 1970) return 1970;
  if (n > 2100) return 2100;
  return n;
}
__name(clampYear, "clampYear");
__name2(clampYear, "clampYear");
function clampVotes(s) {
  if (s == null || s === "") return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n > 1e5) return 1e5;
  return n;
}
__name(clampVotes, "clampVotes");
__name2(clampVotes, "clampVotes");
function unixYearStart(y) {
  return Math.floor(Date.UTC(y, 0, 1) / 1e3);
}
__name(unixYearStart, "unixYearStart");
__name2(unixYearStart, "unixYearStart");
function unixYearEnd(y) {
  return Math.floor(Date.UTC(y, 11, 31, 23, 59, 59) / 1e3);
}
__name(unixYearEnd, "unixYearEnd");
__name2(unixYearEnd, "unixYearEnd");
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
var TMDB = "https://api.themoviedb.org/3";
var TTL2 = 7 * 24 * 60 * 60;
async function onRequestGet3({ env }) {
  if (!env.TMDB_API_KEY || !env.STATS) {
    return json3({ error: "Server not configured" }, 500);
  }
  const movie = await cached3(
    env,
    "tmdb:genres:movie",
    () => tmdb(`${TMDB}/genre/movie/list?language=en-US`, env.TMDB_API_KEY),
    (d) => Array.isArray(d?.genres)
  );
  const tv = await cached3(
    env,
    "tmdb:genres:tv",
    () => tmdb(`${TMDB}/genre/tv/list?language=en-US`, env.TMDB_API_KEY),
    (d) => Array.isArray(d?.genres)
  );
  return json3({
    movie: movie?.genres || [],
    tv: tv?.genres || []
  });
}
__name(onRequestGet3, "onRequestGet3");
__name2(onRequestGet3, "onRequestGet");
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
async function cached3(env, key, fetcher, validate) {
  const hit = await env.STATS.get(key, { type: "json" });
  if (hit) return hit;
  const data = await fetcher();
  if (data && (!validate || validate(data))) {
    await env.STATS.put(key, JSON.stringify(data), { expirationTtl: TTL2 });
  }
  return data;
}
__name(cached3, "cached3");
__name2(cached3, "cached");
function json3(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
__name(json3, "json3");
__name2(json3, "json");
var TMDB2 = "https://api.themoviedb.org/3";
var OMDB = "https://www.omdbapi.com";
var IMG2 = "https://image.tmdb.org/t/p";
var DISCOVER_TTL2 = 6 * 60 * 60;
var DETAIL_TTL2 = 24 * 60 * 60;
var OMDB_TTL = 24 * 60 * 60;
var PAGE_CAP = 250;
function minVotesFor2(rating) {
  if (rating >= 9) return 25;
  return 50;
}
__name(minVotesFor2, "minVotesFor2");
__name2(minVotesFor2, "minVotesFor");
async function onRequestGet4({ request, env }) {
  if (!env.TMDB_API_KEY || !env.STATS) {
    return json4({ error: "Server not configured" }, 500);
  }
  const url = new URL(request.url);
  const type = url.searchParams.get("type") === "tv" ? "tv" : "movie";
  const genres = (url.searchParams.get("genres") || "").split(",").map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
  const minRating = clampRating2(url.searchParams.get("min_rating"));
  const fromYear = clampYear2(url.searchParams.get("from_year"));
  const toYear = clampYear2(url.searchParams.get("to_year"));
  const userMinVotes = clampVotes2(url.searchParams.get("min_votes"));
  const country = request.cf && request.cf.country || "US";
  const minVotes = userMinVotes != null ? userMinVotes : minVotesFor2(minRating);
  const params = new URLSearchParams({
    include_adult: "false",
    sort_by: "popularity.desc",
    "vote_count.gte": String(minVotes),
    language: "en-US"
  });
  if (genres.length) params.set("with_genres", genres.join(","));
  if (minRating > 0) params.set("vote_average.gte", String(minRating));
  const dateField = type === "tv" ? "first_air_date" : "primary_release_date";
  if (fromYear != null) params.set(`${dateField}.gte`, `${fromYear}-01-01`);
  if (toYear != null) params.set(`${dateField}.lte`, `${toYear}-12-31`);
  const filterKey = `${type}:${genres.join(",")}:${minRating}:${minVotes}:${fromYear ?? ""}-${toYear ?? ""}`;
  const first = await cached4(
    env,
    `tmdb:discover:v3:${filterKey}:1`,
    DISCOVER_TTL2,
    () => tmdb2(`${TMDB2}/discover/${type}?${params}&page=1`, env.TMDB_API_KEY),
    (d) => Array.isArray(d?.results)
  );
  if (!first || !Array.isArray(first.results) || first.results.length === 0) {
    return json4({ error: "No results for those filters" }, 404);
  }
  const totalPages = Math.min(Number(first.total_pages) || 1, PAGE_CAP);
  const page = 1 + Math.floor(Math.random() * totalPages);
  const pageData = page === 1 ? first : await cached4(
    env,
    `tmdb:discover:v3:${filterKey}:${page}`,
    DISCOVER_TTL2,
    () => tmdb2(`${TMDB2}/discover/${type}?${params}&page=${page}`, env.TMDB_API_KEY),
    (d) => Array.isArray(d?.results)
  );
  const list = pageData?.results || [];
  if (!list.length) return json4({ error: "No results found" }, 404);
  const pick = list[Math.floor(Math.random() * list.length)];
  const detail = await cached4(
    env,
    `tmdb:detail:v2:${type}:${pick.id}`,
    DETAIL_TTL2,
    () => tmdb2(
      `${TMDB2}/${type}/${pick.id}?append_to_response=images,external_ids,credits,watch/providers&language=en-US&include_image_language=en,null`,
      env.TMDB_API_KEY
    ),
    (d) => d?.id != null
  );
  if (!detail) return json4({ error: "Detail fetch failed" }, 502);
  const out = shape2(detail, type, country);
  out.totalResults = Number(first.total_results) || list.length;
  const imdbId = detail.external_ids?.imdb_id;
  if (imdbId && env.OMDB_API_KEY) {
    const om = await cached4(
      env,
      `omdb:${imdbId}`,
      OMDB_TTL,
      () => omdb(imdbId, env.OMDB_API_KEY),
      (d) => d?.Response === "True"
    );
    if (om) mergeOmdb(out, om);
  }
  return json4(out);
}
__name(onRequestGet4, "onRequestGet4");
__name2(onRequestGet4, "onRequestGet");
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
function clampRating2(s) {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 9.5) return 9.5;
  return Math.round(n * 10) / 10;
}
__name(clampRating2, "clampRating2");
__name2(clampRating2, "clampRating");
function clampYear2(s) {
  if (s == null || s === "") return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n)) return null;
  if (n < 1900) return 1900;
  if (n > 2100) return 2100;
  return n;
}
__name(clampYear2, "clampYear2");
__name2(clampYear2, "clampYear");
function clampVotes2(s) {
  if (s == null || s === "") return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n > 1e5) return 1e5;
  return n;
}
__name(clampVotes2, "clampVotes2");
__name2(clampVotes2, "clampVotes");
function shape2(d, type, country) {
  const isMovie = type === "movie";
  const date = (isMovie ? d.release_date : d.first_air_date) || "";
  const backdrops = (d.images?.backdrops || []).slice(0, 10).map((b) => `${IMG2}/w780${b.file_path}`);
  const cast = (d.credits?.cast || []).slice(0, 8).map((c) => ({
    name: c.name,
    character: c.character || null,
    profile: c.profile_path ? `${IMG2}/w185${c.profile_path}` : null
  }));
  const wp = d["watch/providers"]?.results || {};
  const region = wp[country] || wp.US || null;
  const mapProv = /* @__PURE__ */ __name2((arr) => (arr || []).map((p) => ({
    name: p.provider_name,
    logo: p.logo_path ? `${IMG2}/w92${p.logo_path}` : null
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
    poster: d.poster_path ? `${IMG2}/w500${d.poster_path}` : null,
    backdrop: d.backdrop_path ? `${IMG2}/original${d.backdrop_path}` : null,
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
__name(shape2, "shape2");
__name2(shape2, "shape");
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
async function cached4(env, key, ttl, fetcher, validate) {
  const hit = await env.STATS.get(key, { type: "json" });
  if (hit) return hit;
  const data = await fetcher();
  if (data && (!validate || validate(data))) {
    await env.STATS.put(key, JSON.stringify(data), { expirationTtl: ttl });
  }
  return data;
}
__name(cached4, "cached4");
__name2(cached4, "cached");
function json4(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
__name(json4, "json4");
__name2(json4, "json");
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
    return json5({ error: "Invalid content type" }, 415);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json5({ error: "Invalid JSON" }, 400);
  }
  const name = sanitizeLine(body?.name, 100);
  const email = sanitizeLine(body?.email, 254);
  const subject = sanitizeLine(body?.subject, 200);
  const message = sanitize(body?.message, 5e3);
  const type = String(body?.type || "").trim();
  const honeypot = String(body?.website || "");
  const turnstileToken = String(body?.turnstileToken || "");
  if (honeypot) return json5({ ok: true }, 200);
  if (!ALLOWED_TYPES.includes(type)) {
    return json5({ error: "Invalid type" }, 400);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json5({ error: "Valid email required" }, 400);
  }
  if (!message || message.length < 5) {
    return json5({ error: "Message must be at least 5 characters" }, 400);
  }
  if (!turnstileToken) {
    return json5({ error: "Missing verification" }, 403);
  }
  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO;
  const turnstileSecret = env.TURNSTILE_SECRET;
  if (!apiKey || !to || !turnstileSecret || !env.STATS) {
    return json5({ error: "Server not configured" }, 500);
  }
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
  const rateKey = `rate:contact:${ip}`;
  const count = Number(await env.STATS.get(rateKey) ?? 0);
  if (count >= RATE_LIMIT) {
    return json5({ error: "Rate limit exceeded" }, 429);
  }
  const tsOk = await verifyTurnstile(turnstileSecret, turnstileToken, ip);
  if (!tsOk) {
    return json5({ error: "Verification failed" }, 403);
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
    return json5({ error: "Email send failed", detail }, 502);
  }
  return json5({ ok: true }, 200);
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
function json5(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
__name(json5, "json5");
__name2(json5, "json");
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
  "game",
  // video game randomizer
  "rps",
  // rock paper scissors arena
  "rps-rock",
  "rps-paper",
  "rps-scissors",
  "coin-heads",
  "coin-tails"
];
var ACCIDENT_RESET = /* @__PURE__ */ new Date("2026-05-26T00:00:00Z");
var MS_PER_DAY = 864e5;
async function onRequestGet5({ env }) {
  if (!env.STATS) return json6({ error: "Server not configured" }, 500);
  const reads = await Promise.all(TOOLS.map((t) => env.STATS.get(`count:${t}`)));
  const counts = Object.fromEntries(TOOLS.map((t, i) => [t, Number(reads[i] ?? 0)]));
  const total = sum(counts);
  const wheelSpins = counts.wheel;
  const headsLanded = counts["coin-heads"];
  const tailsLanded = counts["coin-tails"];
  return json6({
    total,
    wheelSpins,
    headsLanded,
    tailsLanded,
    daysWithoutAccident: daysSinceReset(),
    counts
  });
}
__name(onRequestGet5, "onRequestGet5");
__name2(onRequestGet5, "onRequestGet");
async function onRequestPost2({ request, env }) {
  if (!env.STATS) return json6({ error: "Server not configured" }, 500);
  let body;
  try {
    body = await request.json();
  } catch {
    return json6({ error: "Invalid JSON" }, 400);
  }
  const tool = String(body?.tool || "");
  if (!TOOLS.includes(tool)) {
    return json6({ error: "Unknown tool" }, 400);
  }
  const key = `count:${tool}`;
  const cur = Number(await env.STATS.get(key) ?? 0);
  await env.STATS.put(key, String(cur + 1));
  return json6({ ok: true, count: cur + 1 });
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
function json6(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
__name(json6, "json6");
__name2(json6, "json");
var routes = [
  {
    routePath: "/api/games/filters",
    mountPath: "/api/games",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/games/random",
    mountPath: "/api/games",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/movies/genres",
    mountPath: "/api/movies",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/movies/random",
    mountPath: "/api/movies",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
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
    modules: [onRequestGet5]
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

// .wrangler/tmp/bundle-54tLDs/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-54tLDs/middleware-loader.entry.ts
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
//# sourceMappingURL=functionsWorker-0.662923986571836.js.map
