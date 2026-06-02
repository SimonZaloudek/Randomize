import { onRequestGet as __api_games_filters_js_onRequestGet } from "C:\\Users\\simon\\source\\repos\\C#\\Randomize\\functions\\api\\games\\filters.js"
import { onRequestGet as __api_games_random_js_onRequestGet } from "C:\\Users\\simon\\source\\repos\\C#\\Randomize\\functions\\api\\games\\random.js"
import { onRequestGet as __api_movies_genres_js_onRequestGet } from "C:\\Users\\simon\\source\\repos\\C#\\Randomize\\functions\\api\\movies\\genres.js"
import { onRequestGet as __api_movies_random_js_onRequestGet } from "C:\\Users\\simon\\source\\repos\\C#\\Randomize\\functions\\api\\movies\\random.js"
import { onRequestPost as __api_contact_js_onRequestPost } from "C:\\Users\\simon\\source\\repos\\C#\\Randomize\\functions\\api\\contact.js"
import { onRequestGet as __api_stats_js_onRequestGet } from "C:\\Users\\simon\\source\\repos\\C#\\Randomize\\functions\\api\\stats.js"
import { onRequestPost as __api_stats_js_onRequestPost } from "C:\\Users\\simon\\source\\repos\\C#\\Randomize\\functions\\api\\stats.js"
import { onRequest as __api_contact_js_onRequest } from "C:\\Users\\simon\\source\\repos\\C#\\Randomize\\functions\\api\\contact.js"

export const routes = [
    {
      routePath: "/api/games/filters",
      mountPath: "/api/games",
      method: "GET",
      middlewares: [],
      modules: [__api_games_filters_js_onRequestGet],
    },
  {
      routePath: "/api/games/random",
      mountPath: "/api/games",
      method: "GET",
      middlewares: [],
      modules: [__api_games_random_js_onRequestGet],
    },
  {
      routePath: "/api/movies/genres",
      mountPath: "/api/movies",
      method: "GET",
      middlewares: [],
      modules: [__api_movies_genres_js_onRequestGet],
    },
  {
      routePath: "/api/movies/random",
      mountPath: "/api/movies",
      method: "GET",
      middlewares: [],
      modules: [__api_movies_random_js_onRequestGet],
    },
  {
      routePath: "/api/contact",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_contact_js_onRequestPost],
    },
  {
      routePath: "/api/stats",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_stats_js_onRequestGet],
    },
  {
      routePath: "/api/stats",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_stats_js_onRequestPost],
    },
  {
      routePath: "/api/contact",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_contact_js_onRequest],
    },
  ]