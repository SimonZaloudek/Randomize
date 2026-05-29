# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build / Run

This is a .NET 9 Blazor WebAssembly solution with two projects: `Randomize.Web` (the WASM client/host) and `Randomize.Core` (randomization logic). There are no tests.

- Restore + build: `dotnet build Randomize.sln`
- Run dev server: `dotnet run --project Randomize.Web` (profiles in `Randomize.Web/Properties/launchSettings.json` bind to `http://0.0.0.0:5000` and `https://0.0.0.0:7203`)
- Publish for hosting: `dotnet publish Randomize.Web -c Release` — emits a static site under `bin/Release/net9.0/publish/wwwroot`. `dotnet publish` does not clean its output folder, so delete the previous `publish/` (and re-upload a clean folder) before each deploy or stale fingerprinted files accumulate.
- `global.json` pins the repo to the .NET 9 SDK (9.0.300+). This is required: the .NET 10 SDK's `wasm-tools` workload has no net9 WASM packs, so building on it skips native optimization.
- The app does **not** use a service worker / offline PWA caching. `wwwroot/service-worker.js` is a self-destruct stub kept only to unregister workers left by older versions; `index.html` does the same on load. Don't re-add a caching service worker — it caused stale-content and reload-loop bugs on the static host.

## Architecture

Pure client-side Blazor WASM + PWA — there is no backend. Everything runs in the browser. The `HttpClient` registered in `Program.cs` points at the app's own base address only because Blazor WASM expects it; no API is called.

**Two-project split:**

- `Randomize.Core` — domain logic, no Blazor dependencies. Each feature lives in its own subnamespace (`Randomize.Core.Services`, `Randomize.Core.ShiftPlanner`, `Randomize.Core.Wheel`) rather than all under `Services`. Namespace and folder always match.
- `Randomize.Web` — Blazor pages under `Pages/` (one `.razor` per feature, route declared via `@page`), `Layout/MainLayout.razor` is the shell with the sidebar nav. The sidebar is the source of truth for which features are user-visible — add a `NavLink` there when adding a page.

**Service wiring is inconsistent on purpose — match the existing pattern of the feature you're touching:**

- `StringRandomizerService` and `NumberRandomizerService` are registered as singletons in `Program.cs` and injected into their pages.
- `GroupShufflerCore` is a `static` class — pages call it directly, nothing registered.
- `ShiftPlannerService` is instantiated inline in the page (`new ShiftPlannerService()`), not via DI.

When adding a new randomizer, pick whichever style fits; don't refactor the others for consistency.

**Shift Planner specifics** (the most non-trivial feature):

- The planning horizon is a fixed 31-slot window: hours 0–30, where 24–30 represent the early hours of the next day. This `0..30` range is hard-coded in `Shift.ShiftInit`, `ShiftPlannerService.AssignShifts`, and the Razor timeline loop — changing it requires updates in all three places.
- `Employee.StartNextDay` / `EndNextDay` flags drive the moon-icon display in `DisplayStart`/`DisplayEnd` and are persisted as the literal string `"True"` in the txt save format (see `EmployeeFileService`). The save format is space-separated: `Name MaxHours [Start [True]] [End [True]]`, with spaces in names encoded as `=`.
- `ShiftPlannerService.FindBestContinuousShift` enforces a hard-coded `MinimumShiftHours = 3`, then ranks candidate windows by unfilled-hours covered, then by duration (with a 5% slack), and picks randomly among the top candidates. The "randomize" feel comes from both `OrderBy(_random.Next())` on the employee list and the random pick at the end — touching either changes output distribution.

**JS interop** lives in `wwwroot/js/`: `wheel.js` (canvas rendering for the spinning wheel) and `save.js` (`window.downloadFile` for txt export from the Shift Planner). Both are loaded directly from `index.html`, not as ES modules.

**Styling** uses Bootstrap 5 + Bootstrap Icons (CDN) plus custom CSS in `wwwroot/css/`, split by concern into `base.css`, `layout.css`, `home.css`, `tools.css`, `shiftplanner.css`, `contact.css`, and `mobile.css`. There's no CSS preprocessing — they're plain files loaded via `<link>` tags in `index.html`. **Load order is load-bearing**: `base.css` first (defines the theme `var()`s and the global `html[data-theme]` overrides) and `mobile.css` last (touch-polish rules that override earlier `:hover` states at equal specificity). Insert new feature CSS as its own file in the appropriate spot in that order.
