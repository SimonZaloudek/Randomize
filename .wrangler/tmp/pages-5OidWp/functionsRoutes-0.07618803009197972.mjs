import { onRequestPost as __api_contact_js_onRequestPost } from "C:\\Users\\simon\\source\\repos\\C#\\Randomize\\functions\\api\\contact.js"
import { onRequestGet as __api_stats_js_onRequestGet } from "C:\\Users\\simon\\source\\repos\\C#\\Randomize\\functions\\api\\stats.js"
import { onRequestPost as __api_stats_js_onRequestPost } from "C:\\Users\\simon\\source\\repos\\C#\\Randomize\\functions\\api\\stats.js"
import { onRequest as __api_contact_js_onRequest } from "C:\\Users\\simon\\source\\repos\\C#\\Randomize\\functions\\api\\contact.js"

export const routes = [
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