// Share helpers. tryNative uses the Web Share API (the native sheet - the only way
// to reach Instagram on mobile) and returns false when it isn't available, so the
// UI can fall back to the per-network dialog.
window.RandomizeShare = {
    async tryNative(title, text, url) {
        if (!navigator.share) return false;
        try {
            await navigator.share({ title, text, url });
            return true;
        } catch (e) {
            // user dismissed the sheet -> treat as handled; any other failure -> fall back
            return !!e && e.name === "AbortError";
        }
    },
    async copy(text) {
        try { await navigator.clipboard.writeText(text); return true; }
        catch { return false; }
    }
};
