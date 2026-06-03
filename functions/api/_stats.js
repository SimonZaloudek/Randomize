// Shared stat counter. Underscore-prefixed so Pages Functions won't route it.
// Called server-side after a randomizer actually returns a result, so the
// songs/movies/games counts can't be inflated by a client POST. Mirrors the
// `count:<tool>` key format that /api/stats reads. Non-atomic, like stats.js -
// fine for decorative counters - and never throws into the request path.
export async function incrementStat(env, tool) {
    if (!env?.STATS) return;
    try {
        const key = `count:${tool}`;
        const current = Number(await env.STATS.get(key) ?? 0);
        await env.STATS.put(key, String(current + 1));
    } catch {
        // a stats hiccup must never break the actual response
    }
}
