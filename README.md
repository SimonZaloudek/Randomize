  # Randomize

  A collection of fast, polished randomizers - text, numbers, wheels, music, movies,
  games and more. Privacy-friendly by design: no accounts, no tracking, everything runs
  in your browser.

  Live demo: userandomize.net

<img width="1912" height="938" alt="image" src="https://github.com/user-attachments/assets/48ec972b-2f64-4f35-9998-700f383ede73" />


  ## What's inside

  - **Text** - pick or shuffle lines, weighted picks, password and token generators,
  random emoji, coin flip
  - **Numbers** - random numbers, dice rolls, lottery draws, random dates, PINs
  - **Wheel** - a customizable spinning wheel of fortune
  - **Group Shuffler** - split people into fair random groups or teams
  - **Shift Planner** - randomized shift assignment across a planning window
  - **Movies & TV** - discover something to watch, filtered by genre, year and rating
  - **Games** - find your next game, filterable by genre, platform, year and rating
  - **RPS Arena** - a rock-paper-scissors battle simulator that runs until one side
  wins
  - **Songs** - a random track from any artist, album or genre, with an in-page player

  All wrapped in light and dark themes, and available in English, Spanish and Slovak.

  ## Built with

  - Blazor WebAssembly (.NET 9) - the entire UI runs client-side
  - Cloudflare Pages and Pages Functions - static hosting and a small serverless API
  - JavaScript interop for canvas rendering (the wheel, the RPS arena)
  - Bootstrap 5 with custom CSS

  Integrates public data from Spotify, Deezer, TMDB, IGDB and others.

  ## Engineering highlights

  - **Fully serverless, no backend to babysit** - a static WASM front-end with thin
  Cloudflare Functions that proxy third-party APIs and keep credentials off the client.
  - **Resilient music discovery** - combines Deezer's open catalog for breadth with
  Spotify for playback, plus caching and graceful fallbacks so it stays fast and within
  rate limits.
  - **Hardened API layer** - server-authoritative stat counters, per-IP rate limiting,
  and a spam-proofed contact form.
  - **Performance-minded UI** - composite-only animations and album-art-driven theming
  for smooth visuals on any device.
  - **Clean separation of concerns** - domain randomization logic lives in its own
  dependency-free project, decoupled from the Blazor UI.

  ## Running locally

  ```bash
  dotnet build Randomize.sln
  dotnet run --project Randomize.Web
  ```

  The randomizers that call external services run on Cloudflare Pages Functions; the
  rest of the app works fully client-side.

  ## License

  Released under the [MIT License](LICENSE).
