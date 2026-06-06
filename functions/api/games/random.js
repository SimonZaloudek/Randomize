// GET /api/games/random - random IGDB pick by genres, platforms, year range, min rating/votes
import { incrementStat } from "../_stats.js";
import { rateLimited, tooMany } from "../_ratelimit.js";

const IGDB       = "https://api.igdb.com/v4";
const TOKEN_URL  = "https://id.twitch.tv/oauth2/token";
const IMG        = "https://images.igdb.com/igdb/image/upload";

const DISCOVER_TTL = 6 * 60 * 60;        // 6h
const DETAIL_TTL   = 24 * 60 * 60;       // 24h
const TOKEN_KEY    = "igdb:token:v1";
const OFFSET_CAP   = 5000;               // skip past this point - mostly long tail

// only applied when user picked a min_rating but no explicit min_votes
function minVotesFor(rating) {
  if (rating >= 90) return 25;
  if (rating > 0)   return 50;
  return 0;
}

export async function onRequestGet({ request, env }) {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET || !env.STATS) {
    return json({ error: "Server not configured" }, 500);
  }
  if (await rateLimited(env, request, "games")) return tooMany();

  const url = new URL(request.url);
  const genres    = parseIds(url.searchParams.get("genres"));
  const platforms = parseIds(url.searchParams.get("platforms"));
  const modes     = parseIds(url.searchParams.get("modes"));
  const minRating = clampRating(url.searchParams.get("min_rating"));
  const userMinVotes = clampVotes(url.searchParams.get("min_votes"));
  const fromYear  = clampYear(url.searchParams.get("from_year"));
  const toYear    = clampYear(url.searchParams.get("to_year"));

  // user value overrides the safety scaler when explicitly set
  const minVotes = userMinVotes != null ? userMinVotes : minVotesFor(minRating);

  const token = await getToken(env);
  if (!token) return json({ error: "Auth failed" }, 502);

  const conds = [];
  if (genres.length)    conds.push(`genres = (${genres.join(",")})`);
  if (platforms.length) conds.push(`platforms = (${platforms.join(",")})`);
  if (modes.length)     conds.push(`game_modes = (${modes.join(",")})`);
  if (minRating > 0)    conds.push(`rating >= ${minRating}`);
  if (minVotes > 0)     conds.push(`rating_count >= ${minVotes}`);
  if (fromYear != null) conds.push(`first_release_date >= ${unixYearStart(fromYear)}`);
  if (toYear   != null) conds.push(`first_release_date <= ${unixYearEnd(toYear)}`);
  // result page falls apart without a cover image
  conds.push("cover != null");
  const whereClause = `where ${conds.join(" & ")};`;

  const filterKey = `${genres.join(",")}:${platforms.join(",")}:${modes.join(",")}:${minRating}:${minVotes}:${fromYear ?? ""}-${toYear ?? ""}`;

  const countRes = await cached(env, `igdb:count:v2:${filterKey}`, DISCOVER_TTL,
    () => igdb(`${IGDB}/games/count`, whereClause, token, env.TWITCH_CLIENT_ID),
    d => typeof d?.count === "number");

  if (!countRes || countRes.count === 0) {
    return json({ error: "No matches for those filters" }, 404);
  }

  const total = Math.min(countRes.count, OFFSET_CAP);
  // random offset into the pool, then second random pick from a 50-item window
  const offset = Math.floor(Math.random() * Math.max(1, total - 50));

  const list = await cached(env, `igdb:discover:v2:${filterKey}:${offset}`, DISCOVER_TTL,
    () => igdb(`${IGDB}/games`,
      `fields id,name; ${whereClause} sort total_rating_count desc; limit 50; offset ${offset};`,
      token, env.TWITCH_CLIENT_ID),
    d => Array.isArray(d));

  if (!Array.isArray(list) || list.length === 0) {
    return json({ error: "No results found" }, 404);
  }

  const pick = list[Math.floor(Math.random() * list.length)];

  const detail = await cached(env, `igdb:detail:v4:${pick.id}`, DETAIL_TTL,
    () => igdbDetail(pick.id, token, env.TWITCH_CLIENT_ID),
    d => Array.isArray(d) && d.length > 0);

  if (!detail || !detail.length) return json({ error: "Detail fetch failed" }, 502);

  const game = detail[0];
  const steamAppId = pickSteamAppId(game.external_games, game.websites);

  // parallelized - each of these takes ~500-1500ms on a cache miss
  const [ttbList, similar, steam] = await Promise.all([
    cached(env, `igdb:ttb:v1:${pick.id}`, DETAIL_TTL,
      () => igdb(`${IGDB}/game_time_to_beats`,
        `fields hastily,normally,completely; where game_id = ${pick.id};`,
        token, env.TWITCH_CLIENT_ID),
      d => Array.isArray(d)),
    fetchSimilar(env, token, game.similar_games),
    steamAppId
      ? cached(env, `steam:reviews:v2:${steamAppId}`, DETAIL_TTL,
          () => fetchSteamReviews(steamAppId),
          d => d != null)
      : Promise.resolve(null)
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

  // diagnostic block - shows what IGDB returned for Steam ID resolution
  out._debug = {
    steamAppId,
    externalGamesCount: (game.external_games || []).length,
    externalGamesSources: (game.external_games || []).map(e => e.external_game_source ?? e.category),
    websitesCount: (game.websites || []).length,
    websitesTypes: (game.websites || []).map(w => w.type ?? w.category),
    steamFetchOk: !!steam,
    similarCount: similar?.length || 0
  };

  await incrementStat(env, "game");   // count server-side, not from the client
  return json(out);
}

async function fetchSimilar(env, token, similarIds) {
  if (!Array.isArray(similarIds) || similarIds.length === 0) return [];
  // similar_games on a game record only gives IDs - need a second hop
  const ids = similarIds.slice(0, 6).join(",");
  const data = await cached(env, `igdb:similar:v1:${ids}`, DETAIL_TTL,
    () => igdb(`${IGDB}/games`,
      `fields id,name,slug,cover.image_id,first_release_date,url; where id = (${ids}) & cover != null;`,
      token, env.TWITCH_CLIENT_ID),
    d => Array.isArray(d));
  if (!Array.isArray(data)) return [];
  return data.map(g => ({
    id: g.id,
    name: g.name,
    cover: g.cover?.image_id ? `${IMG}/t_cover_med/${g.cover.image_id}.jpg` : null,
    year: g.first_release_date ? new Date(g.first_release_date * 1000).getUTCFullYear() : null,
    url: g.url || null
  }));
}

// IGDB deprecated `category` on external_games/websites in 2024 - the data
// moved to `external_game_source` and `type`. Same enum IDs. We accept either.
const STEAM_SOURCE = 1;
const STEAM_WEBSITE = 13;

function pickSteamAppId(externals, websites) {
  const e = (externals || []).find(x =>
    (x.external_game_source === STEAM_SOURCE || x.category === STEAM_SOURCE) && x.uid
  );
  if (e?.uid) return String(e.uid);

  const w = (websites || []).find(x =>
    (x.type === STEAM_WEBSITE || x.category === STEAM_WEBSITE) && x.url
  );
  if (w) {
    const m = w.url.match(/store\.steampowered\.com\/app\/(\d+)/);
    if (m) return m[1];
  }
  return null;
}

// summary + 3 most-helpful reviews + current player count, all in parallel
async function fetchSteamReviews(appId) {
  try {
    const reviewsUrl = `https://store.steampowered.com/appreviews/${appId}?json=1&language=english&num_per_page=3&review_type=all&purchase_type=all&filter=all`;
    const playersUrl = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`;

    const [reviewRes, playerRes] = await Promise.all([
      fetch(reviewsUrl, {
        headers: {
          Accept: "application/json",
          // CF Worker IPs get flagged without a browser-ish UA
          "User-Agent": "Mozilla/5.0 (compatible; Randomize/1.0; +https://userandomize.net)"
        }
      }).catch(() => null),
      fetch(playersUrl).catch(() => null)
    ]);

    if (!reviewRes || !reviewRes.ok) return null;
    const rev = await reviewRes.json();
    const q = rev?.query_summary;
    if (!q || !q.total_reviews) return null;

    const pct = Math.round((q.total_positive / q.total_reviews) * 100);

    const reviews = (rev.reviews || []).slice(0, 3).map(r => ({
      text: (r.review || "").replace(/\r/g, "").trim().slice(0, 600),
      recommended: !!r.voted_up,
      votesUp: r.votes_up || 0,
      // playtime_forever is in minutes
      playtimeHours: Math.round((r.author?.playtime_forever || 0) / 60),
      timestamp: r.timestamp_created || null
    })).filter(r => r.text.length > 0);

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

// Twitch app access token. Cached for its full TTL minus a 2-min buffer.
async function getToken(env) {
  const hit = await env.STATS.get(TOKEN_KEY, { type: "json" });
  if (hit && hit.expires_at > Math.floor(Date.now() / 1000) + 60) {
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
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600)
  };
  await env.STATS.put(TOKEN_KEY, JSON.stringify(stored), {
    expirationTtl: Math.max(60, (data.expires_in || 3600) - 120)
  });
  return data.access_token;
}

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

async function igdbDetail(id, token, clientId) {
  const fields = [
    "id", "name", "slug", "summary", "storyline", "url",
    "first_release_date",
    "rating", "rating_count",
    "aggregated_rating", "aggregated_rating_count",
    "total_rating", "total_rating_count",
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
  return igdb(`${IGDB}/games`,
    `fields ${fields.join(",")}; where id = ${id};`,
    token, clientId);
}

function shape(g, ttb, similar) {
  const cover = g.cover?.image_id
    ? `${IMG}/t_cover_big/${g.cover.image_id}.jpg`
    : null;

  const screenshots = (g.screenshots || []).slice(0, 10)
    .map(s => `${IMG}/t_screenshot_huge/${s.image_id}.jpg`);

  const backdrop = g.artworks?.[0]?.image_id
    ? `${IMG}/t_screenshot_huge/${g.artworks[0].image_id}.jpg`
    : (screenshots[0] || null);

  const developers = (g.involved_companies || [])
    .filter(c => c.developer)
    .map(c => c.company?.name).filter(Boolean);
  const publishers = (g.involved_companies || [])
    .filter(c => c.publisher)
    .map(c => c.company?.name).filter(Boolean);

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

  const platforms = (g.platforms || []).map(p => ({
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
    year: g.first_release_date
      ? new Date(g.first_release_date * 1000).getUTCFullYear()
      : null,
    releaseDate: g.first_release_date
      ? new Date(g.first_release_date * 1000).toISOString().slice(0, 10)
      : null,
    cover,
    backdrop,
    screenshots,
    genres: (g.genres || []).map(x => x.name),
    platforms,
    gameModes: (g.game_modes || []).map(x => x.name),
    perspectives: (g.player_perspectives || []).map(x => x.name),
    themes: (g.themes || []).map(x => x.name),
    developers,
    publishers,
    franchise: g.franchises?.[0]?.name || g.collections?.[0]?.name || null,
    ratings,
    stores: mergeStores(g.external_games || [], g.websites || [], platforms, g.name),
    igdbUrl: g.url || null,
    timeToBeat: ttb && (ttb.hastily || ttb.normally || ttb.completely) ? {
      hastily:    ttb.hastily    || null,
      normally:   ttb.normally   || null,
      completely: ttb.completely || null
    } : null,
    youtubeId: g.videos?.[0]?.video_id || null,
    similar: similar || []
  };
}

// IGDB external_game_source IDs -> our storefront icons
const STORE_MAP = {
  1:  { name: "Steam",              icon: "steam"       },
  5:  { name: "GOG",                icon: "gog"         },
  11: { name: "Microsoft Store",    icon: "microsoft"   },
  13: { name: "App Store",          icon: "apple"       },
  15: { name: "Google Play",        icon: "android"     },
  17: { name: "Nintendo eShop",     icon: "nintendo"    },
  26: { name: "Epic Games Store",   icon: "epic"        },
  28: { name: "Oculus",             icon: "oculus"      },
  30: { name: "itch.io",            icon: "itch"        },
  31: { name: "Xbox Marketplace",   icon: "xbox"        },
  36: { name: "PlayStation Store",  icon: "playstation" }
};

// platform IDs that make each storefront plausible (used for search fallback)
const STORE_PLATFORMS = {
  steam:       [6, 14, 3],
  epic:        [6],
  gog:         [6, 14, 3],
  itch:        [6, 14, 3],
  playstation: [167, 48, 9, 8, 7, 46, 38],
  xbox:        [169, 49, 12, 11],
  nintendo:    [130, 41, 5, 37, 20, 21, 4, 19, 18, 24]
};

// fallback when IGDB has no direct storefront URL
function searchUrl(icon, name) {
  const q = encodeURIComponent(name);
  switch (icon) {
    case "steam":       return `https://store.steampowered.com/search/?term=${q}`;
    case "epic":        return `https://store.epicgames.com/en-US/browse?q=${q}`;
    case "gog":         return `https://www.gog.com/en/games?query=${q}`;
    case "itch":        return `https://itch.io/search?q=${q}`;
    case "playstation": return `https://store.playstation.com/en-us/search/${q}`;
    case "xbox":        return `https://www.xbox.com/en-us/Search/Results?q=${q}`;
    case "nintendo":    return `https://www.nintendo.com/us/search/?q=${q}&p=1&cat=gme&sort=df`;
    default:            return null;
  }
}

// IGDB website types -> our store icons
const WEBSITE_TO_ICON = {
  13: "steam",
  15: "itch",
  16: "epic",
  17: "gog"
};

// Merges direct links from both external_games + websites + per-platform
// search fallbacks. Direct link wins; search URL guarantees the section is
// never empty. Reads new (external_game_source/type) and legacy (category) fields.
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

  // websites is usually more populated than external_games on IGDB
  for (const w of websites) {
    const type = w.type ?? w.category;
    const icon = WEBSITE_TO_ICON[type];
    if (!icon || !w.url || direct[icon]) continue;
    const meta = Object.values(STORE_MAP).find(m => m.icon === icon);
    if (!meta) continue;
    direct[icon] = { name: meta.name, icon, url: w.url, direct: true };
  }

  const platformIds = new Set(platforms.map(p => p.id));
  const result = [];
  const ordered = ["steam", "playstation", "xbox", "nintendo", "epic", "gog", "itch"];

  for (const icon of ordered) {
    if (direct[icon]) {
      result.push(direct[icon]);
      continue;
    }
    const platformsForStore = STORE_PLATFORMS[icon] || [];
    const applies = platformsForStore.some(pid => platformIds.has(pid));
    if (!applies) continue;
    const url = searchUrl(icon, gameName);
    if (!url) continue;
    const meta = Object.values(STORE_MAP).find(m => m.icon === icon)
      || { name: icon, icon };
    result.push({ name: meta.name, icon, url, direct: false });
  }

  // tail anything we picked up but didn't have an explicit ordering for
  for (const icon of Object.keys(direct)) {
    if (!ordered.includes(icon)) result.push(direct[icon]);
  }
  return result;
}

function parseIds(s) {
  return (s || "").split(",").map(x => x.trim()).filter(x => /^\d+$/.test(x));
}

function clampRating(s) {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 95) return 95;
  return Math.round(n);
}

function clampYear(s) {
  if (s == null || s === "") return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n)) return null;
  if (n < 1970) return 1970;
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

function unixYearStart(y) { return Math.floor(Date.UTC(y, 0, 1) / 1000); }
function unixYearEnd(y)   { return Math.floor(Date.UTC(y, 11, 31, 23, 59, 59) / 1000); }

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
