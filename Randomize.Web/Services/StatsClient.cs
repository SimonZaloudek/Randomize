using System.Net.Http.Json;

namespace Randomize.Web.Services;

// Wrapper around /api/stats. Failures never surface in the UI.
public sealed class StatsClient
{
    private readonly HttpClient _http;

    public StatsClient(HttpClient http) => _http = http;

    // fire-and-forget so it can't throw on a randomizer's hot path
    public void Increment(string tool)
    {
        _ = SafePostAsync(tool);
    }

    public async Task<StatsSnapshot?> GetAsync(CancellationToken ct = default)
    {
        // 5s cap so a slow API shows dashes instead of a blank card
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(5));
            return await _http.GetFromJsonAsync<StatsSnapshot>("api/stats", cts.Token);
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
            // ignore
        }
    }
}

public sealed record StatsSnapshot(
    int Total,
    int WheelSpins,
    int HeadsLanded,
    int TailsLanded,
    int DaysWithoutAccident);
