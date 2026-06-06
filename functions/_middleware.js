// Send the production *.pages.dev URL to the real domain so search engines see
// one canonical site (no duplicate-content split). Preview deploys keep working
// because only the exact production host is matched, not branch/hash subdomains.
const CANONICAL = "userandomize.net";
const PAGES_HOST = "randomize-2rn.pages.dev";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === PAGES_HOST) {
    return Response.redirect(`https://${CANONICAL}${url.pathname}${url.search}`, 301);
  }
  return context.next();
}
