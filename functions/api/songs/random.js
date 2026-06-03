// GET /api/songs/random - random track. Strategy depends on filters:
//
//   - artist given  -> source the catalog from Deezer's open API (no key, no
//                      quota gates) and match the chosen track back to Spotify
//                      for the embed player + branding. Spotify's own data
//                      endpoints are unusable for this in Development Mode:
//                      /artists/{id}/albums hits long-cooldown 429s and /search
//                      only returns a handful of results per artist.
//   - album given   -> resolve the album on Spotify and pick a random track.
//   - otherwise     -> /v1/search by genre/year, picking from a RANDOM offset
//                      page (page 0 alone is biased to the most popular).
//
// /v1/recommendations was deprecated for new apps in Nov 2024, hence search.

const SPOTIFY_API = "https://api.spotify.com/v1";
const DEEZER_API  = "https://api.deezer.com";
const TOKEN_URL   = "https://accounts.spotify.com/api/token";
const MARKET      = "US";

const TOKEN_KEY     = "spotify:token:v1";
const DETAIL_TTL    = 24 * 60 * 60;    // 24h
// Spotify's /search caps at 1000 total results. We send NO limit param: an
// explicit limit (even the documented default of 20) was triggering a
// misleading "Invalid limit" 400, so we let Spotify default to 20.
const PAGE_SIZE     = 20;
const OFFSET_CAP    = 1000 - PAGE_SIZE;
const RETRY_LIMIT   = 4;
const MATCH_ATTEMPTS = 5;    // Deezer track -> Spotify match retries (Deezer exclusives miss)

export async function onRequestGet({ request, env }) {
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.STATS) {
        return json({ error: "Server not configured" }, 500);
    }

    const url = new URL(request.url);
    const opts = {
        genres:        parseList(url.searchParams.get("genres")),
        fromYear:      clampYear(url.searchParams.get("from_year")),
        toYear:        clampYear(url.searchParams.get("to_year")),
        noExplicit:    url.searchParams.get("no_explicit") === "1",
        artist:        (url.searchParams.get("artist") || "").trim().slice(0, 80),
        album:         (url.searchParams.get("album") || "").trim().slice(0, 80),
    };

    const tokenRes = await getToken(env);
    if (!tokenRes.token) {
        return json({ error: "Spotify auth failed", detail: tokenRes.error }, 502);
    }
    const token = tokenRes.token;

    let outcome;
    if (opts.artist)      outcome = await randomFromArtist(env, token, opts);
    else if (opts.album)  outcome = await randomFromAlbum(env, token, opts);
    else                  outcome = await randomFromSearch(token, opts);

    if (outcome.error)    return json({ error: outcome.error, detail: outcome.detail }, outcome.status || 502);
    if (outcome.notFound) return json({ error: outcome.notFound }, 404);

    const pick = outcome.pick;
    const primaryArtistId = pick.artists?.[0]?.id;
    const albumId = outcome.album?.id || pick.album?.id;

    // Reuse anything the strategy already fetched (artist object, full album with
    // its tracklist) so a roll costs as few Spotify calls as possible - both are
    // cached 24h, so repeat rolls usually hit zero. No canonical /tracks/{id} call
    // (the album detail already carries art + tracklist) and no /audio-features
    // (deprecated, 403s for new apps).
    const [artistDetail, albumDetail] = await Promise.all([
        outcome.artist
            ? Promise.resolve(outcome.artist)
            : (primaryArtistId ? getArtistDetail(env, token, primaryArtistId) : Promise.resolve(null)),
        outcome.album
            ? Promise.resolve(outcome.album)
            : (albumId ? getAlbumDetail(env, token, albumId) : Promise.resolve(null)),
    ]);

    return json(shape(pick, artistDetail, albumDetail, outcome.total));
}

// ---- strategy: artist (Deezer catalog + Spotify match) --------------------

async function randomFromArtist(env, token, opts) {
    const da = await resolveDeezerArtist(env, opts.artist);
    const dArtist = da.artist;

    if (dArtist) {
        const { albums } = await getDeezerAlbums(env, dArtist.id);
        let pool = albums;
        if (opts.album) {
            const needle = opts.album.toLowerCase();
            pool = pool.filter(a => (a.title || "").toLowerCase().includes(needle));
        }
        pool = pool.filter(a => yearInRange(albumYear(a), opts.fromYear, opts.toYear));

        if (pool.length) {
            const total = pool.reduce((sum, a) => sum + (a.nb_tracks || 0), 0);
            // Deezer gives us the artist's fan count + photo for free - synthesise an
            // artist-detail object so the result card can show them (Spotify withholds
            // followers/genres in Dev Mode anyway).
            const artist = {
                genres: [],
                followers: { total: dArtist.nb_fan ?? null },
                images: dArtist.picture ? [{ url: dArtist.picture }] : [],
                popularity: null,
            };
            // pick a random Deezer track, then locate it on Spotify for the embed.
            // Retry on misses (Deezer-exclusive tracks won't exist on Spotify).
            for (let attempt = 0; attempt < MATCH_ATTEMPTS; attempt++) {
                const album = pool[Math.floor(Math.random() * pool.length)];
                const tracks = await getDeezerAlbumTracks(env, album.id);
                const candidates = tracks.filter(t => !opts.noExplicit || !t.explicit);
                if (!candidates.length) continue;
                const dt = candidates[Math.floor(Math.random() * candidates.length)];
                const st = await matchSpotify(token, dt.title, dArtist.name);
                if (st?.id) return { pick: st, artist, total };
            }
        }
    }

    // Fallback: Deezer couldn't resolve the artist or nothing matched on Spotify.
    // Use Spotify's own (Dev-Mode-limited) track search so we still return something.
    const found = await resolveArtist(env, token, opts.artist);
    if (found.error) return found;
    if (!found.artist) return { notFound: "No artist matched that name" };
    return searchArtistTracks(token, found.artist, opts);
}

// Find a Deezer track on Spotify by title + artist. Returns the full Spotify
// track object (search items are full tracks) or null.
async function matchSpotify(token, title, artistName) {
    const q = `track:${quote(title)} artist:${quote(artistName)}`;
    const r = await apiGet(token, searchUrl(q, 0));
    if (r.error) return null;
    const items = r.data?.tracks?.items || [];
    const lower = artistName.toLowerCase();
    return items.find(t => (t.artists || []).some(a => (a.name || "").toLowerCase() === lower))
        || items[0]
        || null;
}

// ---- Deezer (open API: no key, no OAuth, no quota gates) -------------------
// Used purely as a catalog index for the artist path - all displayed data still
// comes from the matched Spotify track. Lookups are cached 24h in KV.

async function resolveDeezerArtist(env, name) {
    const key = `deezer:artist:v1:${name.toLowerCase()}`;
    const hit = await env.STATS.get(key, { type: "json" });
    if (hit) return { artist: hit };

    const data = await deezerJson(`${DEEZER_API}/search/artist?q=${encodeURIComponent(name)}&limit=5`);
    const items = data?.data || [];
    if (!items.length) return { artist: null };
    const lower = name.toLowerCase();
    const a = items.find(x => (x.name || "").toLowerCase() === lower) || items[0];
    const artist = {
        id: a.id,
        name: a.name,
        nb_fan: a.nb_fan ?? null,
        picture: a.picture_xl || a.picture_big || a.picture_medium || null,
    };
    await env.STATS.put(key, JSON.stringify(artist), { expirationTtl: DETAIL_TTL });
    return { artist };
}

async function getDeezerAlbums(env, artistId) {
    const key = `deezer:albums:v1:${artistId}`;
    const hit = await env.STATS.get(key, { type: "json" });
    if (hit) return { albums: hit };

    const data = await deezerJson(`${DEEZER_API}/artist/${artistId}/albums?limit=100`);
    const albums = (data?.data || []).map(a => ({
        id: a.id,
        title: a.title,
        release_date: a.release_date,
        nb_tracks: a.nb_tracks,
    }));
    await env.STATS.put(key, JSON.stringify(albums), { expirationTtl: DETAIL_TTL });
    return { albums };
}

async function getDeezerAlbumTracks(env, albumId) {
    const key = `deezer:albumtracks:v1:${albumId}`;
    const hit = await env.STATS.get(key, { type: "json" });
    if (hit) return hit;

    const data = await deezerJson(`${DEEZER_API}/album/${albumId}`);
    const tracks = (data?.tracks?.data || []).map(t => ({
        title: t.title,
        explicit: !!t.explicit_lyrics,
    }));
    await env.STATS.put(key, JSON.stringify(tracks), { expirationTtl: DETAIL_TTL });
    return tracks;
}

// Deezer returns {error:{...}} with HTTP 200 on failure, so check for it.
async function deezerJson(url) {
    try {
        const r = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!r.ok) return null;
        const j = await r.json();
        return j && j.error ? null : j;
    } catch {
        return null;
    }
}

// Spotify artist search - only used by the fallback path now. Cached by name.
async function resolveArtist(env, token, name) {
    const key = `spotify:artistlookup:v1:${name.toLowerCase()}`;
    const cachedArtist = await env.STATS.get(key, { type: "json" });
    if (cachedArtist) return { artist: cachedArtist };

    const u = `${SPOTIFY_API}/search?q=${encodeURIComponent(name)}&type=artist&limit=5`;
    const r = await apiGet(token, u);
    if (r.error) return { error: "Spotify artist search failed", detail: r.error, status: 502 };
    const items = r.data?.artists?.items || [];
    if (!items.length) return { artist: null };
    const lower = name.toLowerCase();
    const artist = items.find(a => (a.name || "").toLowerCase() === lower) || items[0];
    await env.STATS.put(key, JSON.stringify(artist), { expirationTtl: DETAIL_TTL });
    return { artist };
}

// Fallback track search (the /search endpoint stays available when Deezer can't
// help). Smaller pool in Dev Mode, but it still returns something.
async function searchArtistTracks(token, artist, opts) {
    const query = `artist:${quote(artist.name)}`;
    const probe = await apiGet(token, searchUrl(query, 0));
    if (probe.error) return { error: "Spotify search failed", detail: probe.error, status: 502 };

    const total = Math.min(probe.data?.tracks?.total || 0, OFFSET_CAP);
    if (total === 0) return { notFound: "No tracks found for that artist" };

    for (let attempt = 0; attempt < RETRY_LIMIT; attempt++) {
        const offset = total <= PAGE_SIZE ? 0 : Math.floor(Math.random() * (total - PAGE_SIZE + 1));
        const page = offset === 0 ? probe : await apiGet(token, searchUrl(query, offset));
        if (page.error) break;
        let items = (page.data?.tracks?.items || []).filter(t =>
            t?.id && (t.artists || []).some(a => a.id === artist.id));
        items = postFilter(items, opts);
        if (items.length) return { pick: items[Math.floor(Math.random() * items.length)], artist, total };
    }
    return { notFound: "No tracks meet the explicit filter for that artist" };
}

// Pick a random album, then a random track on it. Uses the CACHED album detail
// (which already carries the tracklist + art), so a reroll that lands on an
// album we've seen costs zero Spotify calls. Returns the chosen track plus the
// album detail so the caller doesn't have to fetch it again.
// artistId is optional: when set, only tracks credited to that artist qualify
// (skips features on compilations); null accepts every track on the album.
async function pickTrackFromAlbums(env, token, albums, artistId, opts) {
    const pool = albums.slice();
    for (let attempt = 0; attempt < RETRY_LIMIT && pool.length; attempt++) {
        const idx = Math.floor(Math.random() * pool.length);
        const album = pool.splice(idx, 1)[0];   // don't retry the same album

        const detail = await getAlbumDetail(env, token, album.id);
        if (!detail?.id) continue;

        let items = (detail.tracks?.items || []).filter(t =>
            t?.id && (!artistId || (t.artists || []).some(a => a.id === artistId)));
        if (opts.noExplicit) items = items.filter(t => !t.explicit);
        if (!items.length) continue;

        return { track: items[Math.floor(Math.random() * items.length)], album: detail };
    }
    return null;
}

// Full album object (tracklist, art, copyright, label), cached 24h.
function getAlbumDetail(env, token, albumId) {
    return cached(env, `spotify:album:v1:${albumId}`, DETAIL_TTL,
        () => spotifyGet(`${SPOTIFY_API}/albums/${albumId}`, token),
        d => d?.id != null);
}

// Full artist object, cached 24h (genres/followers may be withheld in Dev Mode).
function getArtistDetail(env, token, artistId) {
    return cached(env, `spotify:artist:v1:${artistId}`, DETAIL_TTL,
        () => spotifyGet(`${SPOTIFY_API}/artists/${artistId}`, token),
        d => d?.id != null);
}

// ---- strategy: single album ------------------------------------------------

async function randomFromAlbum(env, token, opts) {
    const u = `${SPOTIFY_API}/search?q=${encodeURIComponent(opts.album)}&type=album&limit=5&market=${MARKET}`;
    const r = await apiGet(token, u);
    if (r.error) return { error: "Spotify album search failed", detail: r.error, status: 502 };

    const items = r.data?.albums?.items || [];
    if (!items.length) return { notFound: "No album matched that name" };
    const lower = opts.album.toLowerCase();
    const album = items.find(a => (a.name || "").toLowerCase() === lower) || items[0];

    // null artistId: accept any track on the album (not just one artist's)
    const picked = await pickTrackFromAlbums(env, token, [album], null, opts);
    if (!picked) return { notFound: "No tracks on that album meet the filters" };

    return { pick: picked.track, album: picked.album, total: picked.album.total_tracks ?? album.total_tracks ?? null };
}

// ---- strategy: genre / year search ----------------------------------------

async function randomFromSearch(token, opts) {
    let query = buildSearchQuery(opts);
    if (!query) query = discoveryQuery();    // no filters -> random surprise

    const probe = await apiGet(token, searchUrl(query, 0));
    if (probe.error) return { error: "Spotify search failed", detail: `${probe.error} | q=${query}`, status: 502 };

    const total = Math.min(probe.data?.tracks?.total || 0, OFFSET_CAP);
    if (total === 0) return { notFound: "No matches for those filters" };

    for (let attempt = 0; attempt < RETRY_LIMIT; attempt++) {
        // pick a random page across the whole result set, not just page 0
        const offset = total <= PAGE_SIZE ? 0 : Math.floor(Math.random() * (total - PAGE_SIZE + 1));
        const page = offset === 0 ? probe : await apiGet(token, searchUrl(query, offset));
        if (page.error) break;

        const items = postFilter(page.data?.tracks?.items || [], opts);
        if (items.length) return { pick: items[Math.floor(Math.random() * items.length)], total };
    }
    return { notFound: "No matches meet the popularity / explicit filters" };
}

function buildSearchQuery({ genres, fromYear, toYear }) {
    const parts = [];
    if (genres.length) parts.push(genres.map(g => `genre:${quote(g)}`).join(" "));
    if (fromYear != null || toYear != null) {
        const from = fromYear ?? 1900;
        const to   = toYear   ?? new Date().getUTCFullYear() + 1;
        parts.push(`year:${from}-${to}`);
    }
    return parts.join(" ").trim();
}

function searchUrl(query, offset) {
    // Spotify's docs show colons UNencoded in q (year:2024, not year%3A2024).
    const encQ = encodeURIComponent(query).replace(/%3A/g, ":");
    let u = `${SPOTIFY_API}/search?q=${encQ}&type=track`;
    if (offset > 0) u += `&offset=${offset}`;
    return u;
}

// quote a value if it has whitespace - keeps Spotify's search parser happy
function quote(s) {
    return /\s/.test(s) ? `"${s.replace(/"/g, "")}"` : s;
}

function discoveryQuery() {
    const pick = Math.floor(Math.random() * 3);
    if (pick === 0) return `year:${1960 + Math.floor(Math.random() * 65)}`;
    if (pick === 1) return String.fromCharCode(97 + Math.floor(Math.random() * 26));
    const genres = ["pop", "rock", "indie", "hip-hop", "electronic", "jazz", "soul", "metal", "folk", "ambient"];
    return `genre:${genres[Math.floor(Math.random() * genres.length)]}`;
}

function postFilter(tracks, { noExplicit }) {
    return tracks.filter(t => {
        if (!t || !t.id) return false;
        if (noExplicit && t.explicit) return false;
        return true;
    });
}

// ---- shaping ---------------------------------------------------------------

function shape(t, artistDetail, albumDetail, totalResults) {
    // album info comes from the full album detail when we have it (the picked
    // track can be a simplified object with no embedded album), else the track's.
    const album = albumDetail || t.album || {};
    const cover = album.images?.find(i => i.width >= 300)?.url
        || album.images?.[0]?.url
        || null;
    const copyright = albumDetail?.copyrights?.find(c => c.text)?.text || null;

    return {
        id: t.id,
        title: t.name,
        artists: (t.artists || []).map(a => ({
            id: a.id,
            name: a.name,
            url: a.external_urls?.spotify || null
        })),
        album: {
            id: album.id,
            name: album.name,
            image: cover,
            url: album.external_urls?.spotify || null,
            totalTracks: album.total_tracks ?? null,
            type: album.album_type ?? null,
            label: albumDetail?.label || null
        },
        year: (album.release_date || "").slice(0, 4) || null,
        releaseDate: album.release_date || null,
        durationMs: t.duration_ms,
        trackNumber: t.track_number ?? null,
        discNumber: t.disc_number ?? null,
        // popularity is withheld from Dev-Mode / client-credentials apps - null, not 0
        popularity: t.popularity ?? null,
        explicit: !!t.explicit,
        copyright,
        spotifyUrl: t.external_urls?.spotify || null,
        isrc: t.external_ids?.isrc || null,
        // the album's tracklist comes free inside the album detail we already fetch
        albumTracks: (albumDetail?.tracks?.items || []).map(x => ({
            id: x.id,
            number: x.track_number ?? null,
            name: x.name,
            durationMs: x.duration_ms ?? 0,
            explicit: !!x.explicit
        })),
        artistGenres: artistDetail?.genres || [],
        artistFollowers: artistDetail?.followers?.total ?? null,
        artistPopularity: artistDetail?.popularity ?? null,
        artistImage: artistDetail?.images?.[0]?.url || null,
        totalResults: totalResults ?? 0
    };
}

// ---- Spotify plumbing ------------------------------------------------------

// Client Credentials flow. Token TTL ~1h; cached in KV minus a buffer.
async function getToken(env) {
    const hit = await env.STATS.get(TOKEN_KEY, { type: "json" });
    if (hit && hit.expires_at > Math.floor(Date.now() / 1000) + 60) {
        return { token: hit.access_token };
    }

    try {
        const auth = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
        const r = await fetchRetry(TOKEN_URL, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials"
        });

        if (!r.ok) {
            const txt = await r.text().catch(() => "");
            return { error: `${r.status}: ${txt.slice(0, 220)}` };
        }

        const data = await r.json();
        if (!data.access_token) return { error: "no access_token in response" };

        const stored = {
            access_token: data.access_token,
            expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600)
        };
        await env.STATS.put(TOKEN_KEY, JSON.stringify(stored), {
            expirationTtl: Math.max(60, (data.expires_in || 3600) - 120)
        });
        return { token: data.access_token };
    } catch (e) {
        return { error: `threw: ${e?.message || String(e)}` };
    }
}

// GET returning { data } or { error } - used where we want failure detail.
async function apiGet(token, url) {
    try {
        const r = await fetchRetry(url, {
            headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
        });
        if (!r.ok) {
            const txt = await r.text().catch(() => "");
            return { error: `${r.status} ${url.replace(SPOTIFY_API, "")} - ${txt.slice(0, 180)}` };
        }
        return { data: await r.json() };
    } catch (e) {
        return { error: `threw: ${e?.message || String(e)}` };
    }
}

// fetch that honours Spotify rate limiting. On HTTP 429 it waits for the
// Retry-After header and retries ONCE - but only if the cooldown is short. A long
// cooldown means the window is saturated, so we fail fast instead of piling on
// more requests (which would only push the reset further out). Returns the final
// Response for the caller to handle.
async function fetchRetry(url, init, tries = 2) {
    for (let attempt = 0; ; attempt++) {
        const r = await fetch(url, init);
        if (r.status !== 429 || attempt >= tries - 1) return r;
        const retryAfter = parseInt(r.headers.get("Retry-After") || "", 10);
        const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : 800 * (attempt + 1);
        if (waitMs > 3000) return r;   // too long to wait inside the request - fail fast
        await sleep(waitMs);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// GET returning json-or-null - used for best-effort detail fetches.
async function spotifyGet(url, token) {
    const r = await apiGet(token, url);
    return r.data ?? null;
}

// ---- helpers ---------------------------------------------------------------

function albumYear(a) {
    const n = parseInt((a.release_date || "").slice(0, 4), 10);
    return Number.isFinite(n) ? n : null;
}

function yearInRange(year, from, to) {
    if (year == null) return from == null && to == null;   // unknown date: keep only when unfiltered
    if (from != null && year < from) return false;
    if (to != null && year > to) return false;
    return true;
}

function parseList(s) {
    return (s || "").split(",").map(x => x.trim()).filter(x => x.length > 0 && x.length < 40);
}

function clampYear(s) {
    if (s == null || s === "") return null;
    const n = parseInt(s, 10);
    if (!Number.isFinite(n)) return null;
    const max = new Date().getUTCFullYear() + 1;
    if (n < 1900) return 1900;
    if (n > max) return max;
    return n;
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

function json(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { "content-type": "application/json; charset=utf-8" }
    });
}
