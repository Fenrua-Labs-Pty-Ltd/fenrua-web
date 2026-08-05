import assert from "node:assert/strict";
import { RETIRED_ROUTE_CACHE_CONTROL, RETIRED_ROUTE_ROBOTS } from "./retired-route-contract.mjs";

const defaultOrigin = "https://fenrua.ai";
const urlArgument = process.argv.find((argument) => argument.startsWith("--url="));
const origin = new URL(urlArgument ? urlArgument.slice("--url=".length) : defaultOrigin);
if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
  throw new TypeError("--url must be a canonical HTTPS origin without credentials, path, query, or fragment.");
}
const canonicalOrigin = origin.origin;
const requestHeaders = {
  accept: "text/html,application/xml,text/plain;q=0.9,*/*;q=0.1",
  "user-agent": "Fenrua-Public-Search-Audit/1.0 (+https://fenrua.ai/security)",
};

async function request(pathOrUrl, { method = "GET", headers = {}, redirect = "manual" } = {}) {
  const url = new URL(pathOrUrl, origin);
  const response = await fetch(url, {
    method,
    headers: { ...requestHeaders, ...headers },
    redirect,
    signal: AbortSignal.timeout(15_000),
  });
  return { url, response };
}

function header(response, name) {
  return response.headers.get(name) ?? "";
}

function canonicalFrom(html) {
  return html.match(/<link\b[^>]*\brel="canonical"[^>]*\bhref="([^"]+)"[^>]*>/i)?.[1] ?? "";
}

function metaFrom(html, name) {
  return html.match(new RegExp(`<meta\\b[^>]*\\bname="${name}"[^>]*\\bcontent="([^"]+)"[^>]*>`, "i"))?.[1] ?? "";
}

const [{ response: robotsResponse }, { response: sitemapResponse }, { response: llmsResponse }] = await Promise.all([
  request("/robots.txt"),
  request("/sitemap.xml"),
  request("/llms.txt"),
]);

for (const [label, response, contentType] of [
  ["robots.txt", robotsResponse, /^text\/plain\b/i],
  ["sitemap.xml", sitemapResponse, /^(?:application|text)\/xml\b/i],
  ["llms.txt", llmsResponse, /^text\/plain\b/i],
]) {
  assert.equal(response.status, 200, `${label} must return HTTP 200.`);
  assert.match(header(response, "content-type"), contentType, `${label} must use the expected content type.`);
  assert.match(header(response, "cache-control"), /\bmust-revalidate\b/i, `${label} must use revalidatable caching.`);
}

const [robots, sitemap, llms] = await Promise.all([
  robotsResponse.text(),
  sitemapResponse.text(),
  llmsResponse.text(),
]);
assert.match(robots, new RegExp(`Sitemap: ${canonicalOrigin.replaceAll(".", "\\.")}\\/sitemap\\.xml`));
assert.match(robots, /User-agent: \*\nAllow: \//);
assert.doesNotMatch(robots, /\bDisallow:/i, "Search engines must be able to observe retired-route 410 responses.");
assert.match(llms, /FENRUA LABS PTY LTD/);
assert.match(llms, new RegExp(`${canonicalOrigin.replaceAll(".", "\\.")}\\/legal`));

const canonicalUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll("&amp;", "&"));
assert.ok(canonicalUrls.length > 0, "Live sitemap must contain canonical URLs.");
assert.equal(new Set(canonicalUrls).size, canonicalUrls.length, "Live sitemap URLs must be unique.");

const pageResults = await Promise.all(
  canonicalUrls.map(async (url) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, canonicalOrigin, `Live sitemap URL must use ${canonicalOrigin}.`);
    assert.ok(parsed.pathname === "/" || !parsed.pathname.endsWith("/"), `Live sitemap URL must be slashless: ${url}`);
    const { response } = await request(url);
    assert.equal(response.status, 200, `${url} must return HTTP 200.`);
    assert.match(header(response, "content-type"), /^text\/html\b/i, `${url} must return HTML.`);
    assert.match(header(response, "cache-control"), /\bmust-revalidate\b/i, `${url} must be revalidatable.`);
    assert.ok(header(response, "etag") || header(response, "last-modified"), `${url} must expose a cache validator.`);
    const html = await response.text();
    assert.equal(canonicalFrom(html), url, `${url} must self-canonicalize.`);
    assert.equal(metaFrom(html, "robots"), "index,follow", `${url} must remain indexable.`);
    assert.match(metaFrom(html, "googlebot"), /\bindex\b/, `${url} must allow Google indexing.`);
    assert.match(metaFrom(html, "googlebot"), /\bfollow\b/, `${url} must allow Google link discovery.`);
    assert.match(html, /<script type="application\/ld\+json">/, `${url} must expose structured data server-side.`);
    return url;
  }),
);

const gonePaths = [
  "/fenpresale",
  "/fenswap",
  "/wallet",
  "/register",
  "/login",
  "/account",
  "/privacy",
  "/terms",
  "/v2",
  "/v2/retired-route",
  "/nexus/retired-route",
  "/explorer/retired-route",
];
for (const path of gonePaths) {
  const { response } = await request(path);
  assert.equal(response.status, 410, `${path} must return HTTP 410.`);
  assert.equal(header(response, "x-robots-tag"), RETIRED_ROUTE_ROBOTS, `${path} must be excluded from search.`);
  assert.equal(header(response, "cache-control"), RETIRED_ROUTE_CACHE_CONTROL, `${path} must use the retired-route no-store cache contract.`);
}

const successorRedirects = new Map([
  ["/nexus", "/architecture"],
  ["/explorer", "/status"],
  ["/about", "/company"],
  ["/brief", "/"],
  ["/contact", "/support"],
]);
for (const [path, destination] of successorRedirects) {
  const { response } = await request(path);
  assert.ok([301, 308].includes(response.status), `${path} must permanently redirect.`);
  assert.equal(new URL(header(response, "location"), origin).pathname, destination, `${path} must consolidate to ${destination}.`);
}

const etag = header(sitemapResponse, "etag");
if (etag) {
  const { response } = await request("/sitemap.xml", { method: "HEAD", headers: { "if-none-match": etag } });
  assert.equal(response.status, 304, "Sitemap ETag must support conditional crawler revalidation.");
}

if (canonicalOrigin === defaultOrigin) {
  const wwwResponse = await fetch("https://www.fenrua.ai/", {
    headers: requestHeaders,
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
  assert.ok([301, 308].includes(wwwResponse.status), "www host must permanently consolidate.");
  assert.equal(header(wwwResponse, "location"), `${canonicalOrigin}/`);
}

console.log(
  JSON.stringify({
    status: "ok",
    scope: "live-search-surface",
    origin: canonicalOrigin,
    indexableRoutes: pageResults.length,
    retiredRoutes: gonePaths.length,
    successorRedirects: successorRedirects.size,
    sitemapConditionalRevalidation: Boolean(etag),
  }),
);
