// GET /api/songs/genres - curated genre list for the UI chip filter.
// Hardcoded because Spotify deprecated /recommendations/available-genre-seeds.
// IDs match Spotify search-friendly `genre:` query terms.

const GENRES = [
    { id: "pop",         name: "Pop" },
    { id: "rock",        name: "Rock" },
    { id: "hip-hop",     name: "Hip-Hop" },
    { id: "rap",         name: "Rap" },
    { id: "electronic",  name: "Electronic" },
    { id: "house",       name: "House" },
    { id: "techno",      name: "Techno" },
    { id: "indie",       name: "Indie" },
    { id: "alternative", name: "Alternative" },
    { id: "country",     name: "Country" },
    { id: "classical",   name: "Classical" },
    { id: "jazz",        name: "Jazz" },
    { id: "blues",       name: "Blues" },
    { id: "r-n-b",       name: "R&B" },
    { id: "soul",        name: "Soul" },
    { id: "funk",        name: "Funk" },
    { id: "metal",       name: "Metal" },
    { id: "punk",        name: "Punk" },
    { id: "folk",        name: "Folk" },
    { id: "reggae",      name: "Reggae" },
    { id: "latin",       name: "Latin" },
    { id: "k-pop",       name: "K-Pop" },
    { id: "j-pop",       name: "J-Pop" },
    { id: "soundtrack",  name: "Soundtrack" },
    { id: "ambient",     name: "Ambient" },
    { id: "lo-fi",       name: "Lo-Fi" }
];

export async function onRequestGet() {
    return new Response(JSON.stringify({ genres: GENRES }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" }
    });
}
