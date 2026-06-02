// GET /api/games/filters - returns { genres, platforms } for the UI filter chips
const IGDB      = "https://api.igdb.com/v4";
const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TTL       = 7 * 24 * 60 * 60;   // 7 days
const TOKEN_KEY = "igdb:token:v1";

// Curated, grouped-by-brand platform list. IGDB exposes 200+ platforms (arcade
// boards, OS variants, obscure handhelds) - this trims to the ones a user
// would actually pick from a chip row.
const PLATFORMS = [
  { id: 6,   name: "PC (Windows)" },
  { id: 14,  name: "Mac" },
  { id: 3,   name: "Linux" },
  { id: 167, name: "PlayStation 5" },
  { id: 48,  name: "PlayStation 4" },
  { id: 9,   name: "PlayStation 3" },
  { id: 8,   name: "PlayStation 2" },
  { id: 7,   name: "PlayStation" },
  { id: 38,  name: "PSP" },
  { id: 46,  name: "PS Vita" },
  { id: 169, name: "Xbox Series X|S" },
  { id: 49,  name: "Xbox One" },
  { id: 12,  name: "Xbox 360" },
  { id: 11,  name: "Xbox" },
  { id: 130, name: "Nintendo Switch" },
  { id: 41,  name: "Wii U" },
  { id: 5,   name: "Wii" },
  { id: 37,  name: "Nintendo 3DS" },
  { id: 20,  name: "Nintendo DS" },
  { id: 21,  name: "GameCube" },
  { id: 4,   name: "Nintendo 64" },
  { id: 19,  name: "SNES" },
  { id: 18,  name: "NES" },
  { id: 24,  name: "Game Boy Advance" },
  { id: 34,  name: "Android" },
  { id: 39,  name: "iOS" }
];

export async function onRequestGet({ env }) {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET || !env.STATS) {
    return json({ error: "Server not configured" }, 500);
  }

  const genres = await cached(env, "igdb:genres:v1",
    async () => {
      const token = await getToken(env);
      if (!token) return null;
      return igdb(`${IGDB}/genres`,
        `fields id,name; sort name asc; limit 50;`,
        token, env.TWITCH_CLIENT_ID);
    },
    d => Array.isArray(d));

  return json({
    genres: Array.isArray(genres) ? genres.map(g => ({ id: g.id, name: g.name })) : [],
    platforms: PLATFORMS
  });
}

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

async function cached(env, key, fetcher, validate) {
  const hit = await env.STATS.get(key, { type: "json" });
  if (hit) return hit;
  const data = await fetcher();
  if (data && (!validate || validate(data))) {
    await env.STATS.put(key, JSON.stringify(data), { expirationTtl: TTL });
  }
  return data;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
