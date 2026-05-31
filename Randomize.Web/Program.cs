using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Randomize.Core.Services;
using Randomize.Web;
using Randomize.Web.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddSingleton<StringRandomizerService>();
builder.Services.AddSingleton<NumberRandomizerService>();
builder.Services.AddScoped<StatsClient>();
builder.Services.AddScoped<LocalizationService>();


await builder.Build().RunAsync();
