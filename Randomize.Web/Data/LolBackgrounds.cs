namespace Randomize.Web.Data;

// Per-theme backdrops in wwwroot/img/lol, named {theme}{1..5}.jpg. Source art is
// from Legends of Runeterra (Riot); credited in the About page LoL notice.
// One random pick per page load. Theme matches the data-theme attribute;
// "modern" is the base (no attribute). "light" has no art on purpose - it
// falls back to the CSS backdrop.
public static class LolBackgrounds
{
    private const int Count = 5;
    private static readonly HashSet<string> Themes = new(StringComparer.OrdinalIgnoreCase)
    {
        "modern", "default", "crimson", "tropical", "forest",
    };

    // Returns a random background URL for the theme, or null if it has none.
    public static string? Random(string? theme)
    {
        var key = string.IsNullOrWhiteSpace(theme) ? "modern" : theme.ToLowerInvariant();
        if (!Themes.Contains(key)) return null;
        return $"/img/lol/{key}{System.Random.Shared.Next(1, Count + 1)}.jpg";
    }
}
