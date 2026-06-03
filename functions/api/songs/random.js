// GET /api/songs/random - random Spotify track. Strategy depends on filters:
//
//   - artist given  -> resolve the artist to an ID and page through their
//                      albums + singles, then pick a true-random track. The
//                      /search "artist:" filter only ever returns a small
//                      relevance-ranked slice (and quoting a multi-word name
//                      narrows it further), so it can't represent a full
//                      discography - we enumerate it instead.
//   - album given   -> resolve the album and pick a random track from it.
//   - otherwise     -> /v1/search by genre/year, picking from a RANDOM offset
//                      page. The old code always picked from page 0 (the top-20
//                      most relevant), so results were biased, not random.
//
// /v1/recommendations was deprecated for new apps in Nov 2024, hence search.

const SPOTIFY_API = "https://api.spotify.com/v1";
const TOKEN_URL   = "https://accounts.spotify.com/api/token";
const MARKET      = "US";

const TOKEN_KEY     = "spotify:token:v1";
const DETAIL_TTL    = 24 * 60 * 60;    // 24h
// Spotify's /search caps at 1000 total results. We send NO limit param: an
// explicit limit (even the documented default of 20) was triggering a
// misleading "Invalid limit" 400, so we let Spotify default to 20.
const PAGE_SIZE     = 20;
const OFFSET_CAP    = 1000 - PAGE_SIZE;
const ALBUM_PAGES   = 3;     // 50 albums/page -> cap ~150 albums per artist
const RETRY_LIMIT   = 4;

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
    if (opts.artist)      outcome = await randomFromArtist(token, opts);
    else if (opts.album)  outcome = await randomFromAlbum(token, opts);
    else                  outcome = await randomFromSearch(token, opts);

    if (outcome.error)    return json({ error: outcome.error, detail: outcome.detail }, outcome.status || 502);
    if (outcome.notFound) return json({ error: outcome.notFound }, 404);

    // Resolve the pick to a FULL track object (album art, ISRC, track number).
    // Search and album-track lists can be "simplified" objects that omit them.
    const full = await spotifyGet(`${SPOTIFY_API}/tracks/${outcome.pick.id}`, token);
    const pick = full?.id ? full : outcome.pick;
    const primaryArtistId = pick.artists?.[0]?.id;
    const albumId = pick.album?.id;

    // Artist detail (genres/followers - may be withheld in Dev Mode) + full album
    // (for copyright). NB: /audio-features is deprecated and 403s for new apps, so
    // we don't call it. If the artist path already resolved the artist, reuse it.
    const [artistDetail, albumDetail] = await Promise.all([
        outcome.artist
            ? Promise.resolve(outcome.artist)
            : (primaryArtistId
                ? cached(env, `spotify:artist:v1:${primaryArtistId}`, DETAIL_TTL,
                    () => spotifyGet(`${SPOTIFY_API}/artists/${primaryArtistId}`, token),
                    d => d?.id != null)
                : Promise.resolve(null)),
        albumId
            ? cached(env, `spotify:album:v1:${albumId}`, DETAIL_TTL,
                () => spotifyGet(`${SPOTIFY_API}/albums/${albumId}`, token),
                d => d?.id != null)
            : Promise.resolve(null),
    ]);

    return json(shape(pick, artistDetail, albumDetail, outcome.total));
}

// ---- strategy: artist discography -----------------------------------------

async function randomFromArtist(token, opts) {
    const found = await resolveArtist(token, opts.artist);
    if (found.error) return found;
    if (!found.artist) return { notFound: "No artist matched that name" };
    const artist = found.artist;

    const albumsRes = await getArtistAlbums(token, artist.id);
    if (albumsRes.error) return albumsRes;

    let albums = albumsRes.albums;
    if (opts.album) {
        const needle = opts.album.toLowerCase();
        albums = albums.filter(a => (a.name || "").toLowerCase().includes(needle));
    }
    albums = albums.filter(a => yearInRange(albumYear(a), opts.fromYear, opts.toYear));
    if (!albums.length) return { notFound: "No releases match those filters for that artist" };

    const total = albums.reduce((sum, a) => sum + (a.total_tracks || 0), 0);

    const pick = await pickTrackFromAlbums(token, albums, artist.id, opts);
    if (!pick) return { notFound: "No tracks meet the popularity / explicit filters" };

    return { pick, artist, total };
}

async function resolveArtist(token, name) {
    const u = `${SPOTIFY_API}/search?q=${encodeURIComponent(name)}&type=artist&limit=5`;
    const r = await apiGet(token, u);
    if (r.error) return { error: "Spotify artist search failed", detail: r.error, status: 502 };
    const items = r.data?.artists?.items || [];
    if (!items.length) return { artist: null };
    // prefer an exact (case-insensitive) name match, else the top relevance hit
    const lower = name.toLowerCase();
    const exact = items.find(a => (a.name || "").toLowerCase() === lower);
    return { artist: exact || items[0] };
}

async function getArtistAlbums(token, artistId) {
    const albums = [];
    const seen = new Set();
    // Send NO explicit `limit`: this app's /artists/{id}/albums (like /search)
    // rejects it as "Invalid limit" regardless of value. Spotify defaults to 20
    // and we page through the rest via the `next` URL it returns.
    const params = new URLSearchParams({
        include_groups: "album,single,compilation",
        market: MARKET,
    });
    let url = `${SPOTIFY_API}/artists/${artistId}/albums?${params}`;

    for (let page = 0; page < ALBUM_PAGES && url; page++) {
        const r = await apiGet(token, url);
        if (r.error) {
            if (page === 0) return { error: "Spotify album lookup failed", detail: r.error, status: 502 };
            break;   // partial list is fine
        }
        for (const a of r.data?.items || []) {
            // Spotify returns the same album across markets/editions - dedupe by name
            const key = (a.name || "").toLowerCase().trim();
            if (key && !seen.has(key)) { seen.add(key); albums.push(a); }
        }
        url = r.data?.next || null;
    }
    return { albums };
}

// Pick a random album, pull its tracks, pick a random one by this artist.
// Retries other albums/tracks when filters wipe out a candidate.
async function pickTrackFromAlbums(token, albums, artistId, opts) {
    const pool = albums.slice();
    for (let attempt = 0; attempt < RETRY_LIMIT && pool.length; attempt++) {
        const idx = Math.floor(Math.random() * pool.length);
        const album = pool.splice(idx, 1)[0];   // don't retry the same album

        const r = await apiGet(token, `${SPOTIFY_API}/albums/${album.id}/tracks?market=${MARKET}&limit=50`);
        if (r.error) continue;

        let items = (r.data?.items || []).filter(t =>
            t?.id && (t.artists || []).some(a => a.id === artistId));   // skip features-only on compilations
        if (opts.noExplicit) items = items.filter(t => !t.explicit);
        if (!items.length) continue;

        // simplified object - the caller's canonical full-track fetch enriches it
        return items[Math.floor(Math.random() * items.length)];
    }
    return null;
}

// ---- strategy: single album ------------------------------------------------

async function randomFromAlbum(token, opts) {
    const u = `${SPOTIFY_API}/search?q=${encodeURIComponent(opts.album)}&type=album&limit=5&market=${MARKET}`;
    const r = await apiGet(token, u);
    if (r.error) return { error: "Spotify album search failed", detail: r.error, status: 502 };

    const items = r.data?.albums?.items || [];
    if (!items.length) return { notFound: "No album matched that name" };
    const lower = opts.album.toLowerCase();
    const album = items.find(a => (a.name || "").toLowerCase() === lower) || items[0];

    const pick = await pickTrackFromAlbums(token, [album], album.artists?.[0]?.id, {
        ...opts,
        // an album-only search shouldn't be constrained by the artist-membership
        // check beyond the album's own primary artist; keep popularity/explicit
    });
    if (!pick) return { notFound: "No tracks on that album meet the filters" };

    return { pick, total: album.total_tracks || null };
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
    const album = t.album || {};
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

// fetch that honours Spotify rate limiting: on HTTP 429 it waits for the
// Retry-After header (capped so we stay within the request budget), otherwise
// backs off exponentially. Returns the final Response for the caller to handle.
async function fetchRetry(url, init, tries = 3) {
    let backoff = 500;
    for (let attempt = 0; ; attempt++) {
        const r = await fetch(url, init);
        if (r.status !== 429 || attempt >= tries - 1) return r;
        const retryAfter = parseInt(r.headers.get("Retry-After") || "", 10);
        const waitMs = Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 5000) : backoff;
        await sleep(waitMs);
        backoff *= 2;
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
