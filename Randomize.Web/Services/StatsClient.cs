using System.Net.Http.Json;

namespace Randomize.Web.Services;

// Thin wrapper around the /api/stats Pages Function. Increments are
// fire-and-forget: a 404 in dev (when wrangler isn't running) or a transient
// network blip should never block or surface in the UI.
public sealed class StatsClient
{
    private readonly HttpClient _http;

    public StatsClient(HttpClient http) => _http = http;

    public void Increment(string tool)
    {
        // Discard the task — we never want a failure here to throw on a
        // randomizer's hot path.
        _ = SafePostAsync(tool);
    }

    public async Task<StatsSnapshot?> GetAsync(CancellationToken ct = default)
    {
        try
        {
            return await _http.GetFromJsonAsync<StatsSnapshot>("api/stats", ct);
        }
        catch
        {
            return null;
        }
    }

    private async Task SafePostAsync(string tool)
    {
        try
        {
            await _http.PostAsJsonAsync("api/stats", new { tool });
        }
        catch
        {
            // Intentionally swallowed.
        }
    }
}

public sealed record StatsSnapshot(
    int Total,
    int WheelSpins,
    int HeadsLanded,
    int TailsLanded,
    int DaysWithoutAccident);
