// Album-colour glow for the song page. Two jobs:
//   1. sample one colour from the album art (12x12 canvas, once per song) into the
//      CSS var --song-glow. Album CDNs send ACAO:* so the cross-origin read works.
//   2. run the embed through Spotify's iFrame API to read play/pause and toggle
//      html.song-playing. The glow itself is all CSS; this just feeds it state.

(function () {
    const ROOT = document.documentElement;
    let controller = null;
    let apiReady = null;
    let mountEl = null;
    let loadToken = 0;
    let swapAt = 0;   // when the track was last swapped; ignore stale play-state events right after

    // restore the "glow disabled" preference on load
    try { if (localStorage.getItem("songGlowOff") === "1") ROOT.classList.add("glow-off"); } catch { }

    function setPlaying(on) { ROOT.classList.toggle("song-playing", !!on); }

    // user toggle to disable the glow entirely (persisted)
    function setEnabled(on) {
        ROOT.classList.toggle("glow-off", !on);
        try { localStorage.setItem("songGlowOff", on ? "0" : "1"); } catch { }
    }
    function isEnabled() {
        try { return localStorage.getItem("songGlowOff") !== "1"; } catch { return true; }
    }

    function applyColor(url) {
        if (!url) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const n = 12;
                const cv = document.createElement("canvas");
                cv.width = n; cv.height = n;
                const ctx = cv.getContext("2d", { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, n, n);
                const px = ctx.getImageData(0, 0, n, n).data;
                let best = null, bestScore = -1, ar = 0, ag = 0, ab = 0, count = 0;
                for (let i = 0; i < px.length; i += 4) {
                    if (px[i + 3] < 128) continue;
                    const r = px[i], g = px[i + 1], b = px[i + 2];
                    ar += r; ag += g; ab += b; count++;
                    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
                    const sat = mx === 0 ? 0 : (mx - mn) / mx;
                    const val = mx / 255;
                    const score = sat * (val > 0.22 && val < 0.96 ? 1 : 0.25);
                    if (score > bestScore) { bestScore = score; best = [r, g, b]; }
                }
                let col = best;
                if (!col || bestScore < 0.15) col = count ? [Math.round(ar / count), Math.round(ag / count), Math.round(ab / count)] : null;
                if (col) ROOT.style.setProperty("--song-glow", `${col[0]}, ${col[1]}, ${col[2]}`);
            } catch { /* tainted/blocked - leave the glow colour unset */ }
        };
        img.onerror = () => { };
        img.src = url;
    }

    // mount the embed once (first song). Later songs swap in place via play() - the
    // mount node is stable, so this only runs again after a dispose. Newest load
    // wins via the token in case two fire close together.
    async function load(mountId, trackId, imageUrl) {
        mountEl = document.getElementById(mountId);
        applyColor(imageUrl);
        swapAt = Date.now();
        setPlaying(false);
        const myToken = ++loadToken;
        try { controller && controller.destroy && controller.destroy(); } catch { }
        controller = null;
        if (!mountEl) return;
        try {
            const api = await ensureApi();
            if (myToken !== loadToken) return;
            api.createController(mountEl,
                { width: "100%", height: 152, uri: "spotify:track:" + trackId },
                (ctrl) => {
                    if (myToken !== loadToken) { try { ctrl.destroy && ctrl.destroy(); } catch { } return; }
                    controller = ctrl;
                    ctrl.addListener("playback_update", (e) => {
                        // drop the stale event a track-swap leaves behind, so the glow
                        // reflects the NEW track's settled state, not the old one's
                        if (Date.now() - swapAt < 700) return;
                        setPlaying(((e && e.data) || {}).isPaused === false);
                    });
                });
        } catch {
            // no API: drop in a plain embed and just show the glow (no play state)
            if (myToken === loadToken) { fallbackIframe(trackId); setPlaying(true); }
        }
    }

    // swap to a new track in the existing controller (no re-mount, no flash) and
    // recolour. Used for rerolls / tracklist clicks once the player is up.
    function play(trackId, imageUrl) {
        applyColor(imageUrl);
        swapAt = Date.now();
        setPlaying(false);   // reset the glow; playback_update turns it back on if it plays
        if (controller) controller.loadUri("spotify:track:" + trackId);
        else fallbackIframe(trackId);
    }

    // smooth-scroll the result card into view (the down-chevron under the filter)
    function scrollToResult() {
        const el = document.getElementById("songs-result-anchor");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function dispose() {
        try { controller && controller.destroy && controller.destroy(); } catch { }
        controller = null;
        setPlaying(false);
        ROOT.style.removeProperty("--song-glow");
    }

    function ensureApi() {
        if (window.__spotifyIframeApi) return Promise.resolve(window.__spotifyIframeApi);
        if (apiReady) return apiReady;
        apiReady = new Promise((resolve, reject) => {
            window.onSpotifyIframeApiReady = (api) => { window.__spotifyIframeApi = api; resolve(api); };
            const s = document.createElement("script");
            s.src = "https://open.spotify.com/embed/iframe-api/v1";
            s.async = true;
            s.onerror = () => reject(new Error("iframe-api load error"));
            document.head.appendChild(s);
            setTimeout(() => reject(new Error("iframe-api timeout")), 6000);
        });
        return apiReady;
    }

    function fallbackIframe(trackId) {
        if (!mountEl) return;
        mountEl.innerHTML =
            '<iframe style="width:100%;height:152px;border:0;border-radius:12px;background:transparent" ' +
            'src="https://open.spotify.com/embed/track/' + trackId + '?utm_source=randomize" ' +
            'loading="lazy" allowtransparency="true" ' +
            'allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>';
    }

    window.SongGlow = { load, play, dispose, setEnabled, isEnabled, scrollToResult };
})();
