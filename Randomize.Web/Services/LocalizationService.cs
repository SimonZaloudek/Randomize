using System.Net.Http.Json;
using Microsoft.JSInterop;

namespace Randomize.Web.Services;

// Loads a flat key→string dictionary from wwwroot/i18n/{code}.json and
// exposes it via an indexer. Components subscribe to LanguageChanged and
// re-render when the active language switches.
public sealed class LocalizationService
{
    private readonly HttpClient _http;
    private readonly IJSRuntime _js;
    private Dictionary<string, string> _strings = new();

    public string CurrentLanguage { get; private set; } = "en";
    public event Action? LanguageChanged;

    public LocalizationService(HttpClient http, IJSRuntime js)
    {
        _http = http;
        _js = js;
    }

    // Missing keys fall back to the key itself so untranslated strings stand out.
    public string this[string key] =>
        _strings.TryGetValue(key, out var v) ? v : key;

    public async Task InitializeAsync()
    {
        var saved = await _js.InvokeAsync<string?>("localStorage.getItem", "language");
        var code = !string.IsNullOrEmpty(saved) ? saved! : "en";
        await LoadAsync(code, persist: false);
    }

    public Task SetLanguageAsync(string code) => LoadAsync(code, persist: true);

    private async Task LoadAsync(string code, bool persist)
    {
        try
        {
            var dict = await _http.GetFromJsonAsync<Dictionary<string, string>>($"i18n/{code}.json");
            _strings = dict ?? new();
            CurrentLanguage = code;
            if (persist)
            {
                await _js.InvokeVoidAsync("localStorage.setItem", "language", code);
            }
            await _js.InvokeVoidAsync("document.documentElement.setAttribute", "lang", code);
            LanguageChanged?.Invoke();
        }
        catch
        {
            // missing/malformed file - keep prior dict; keys will appear as-is
        }
    }
}
