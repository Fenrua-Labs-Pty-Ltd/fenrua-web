import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { publicArtifactFiles, publicRouteFor } from "./public-output-lib.mjs";

const canonicalOrigin = "https://fenrua.ai";
const [robots, sitemap, llms, securityText, vercelSource, siteEvidenceSource] = await Promise.all([
  readFile(new URL("../robots.txt", import.meta.url), "utf8"),
  readFile(new URL("../sitemap.xml", import.meta.url), "utf8"),
  readFile(new URL("../llms.txt", import.meta.url), "utf8"),
  readFile(new URL("../.well-known/security.txt", import.meta.url), "utf8"),
  readFile(new URL("../vercel.json", import.meta.url), "utf8"),
  readFile(new URL("../data/site-evidence.json", import.meta.url), "utf8"),
]);
const siteEvidence = JSON.parse(siteEvidenceSource);
assert.match(siteEvidence.contentModifiedDate, /^\d{4}-\d{2}-\d{2}$/, "Site evidence must declare a content modification date.");

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function escapedRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function attribute(html, elementPattern, name) {
  const tag = html.match(elementPattern)?.[0];
  if (!tag) return null;
  return tag.match(new RegExp(`\\b${escapedRegex(name)}="([^"]*)"`))?.[1] ?? null;
}

function matches(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function visibleText(html) {
  return html
    .replaceAll(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replaceAll(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

const sitemapRecords = [...sitemap.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/g)].map(([, record]) => {
  const loc = decodeXml(record.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "");
  const lastmod = record.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? "";
  return { loc, lastmod };
});
assert.ok(sitemapRecords.length > 0, "Sitemap must contain canonical page records.");

const sitemapUrls = sitemapRecords.map(({ loc }) => loc);
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "Sitemap URLs must be unique.");
const sitemapByUrl = new Map(sitemapRecords.map((record) => [record.loc, record]));
for (const { loc, lastmod } of sitemapRecords) {
  const parsed = new URL(loc);
  assert.equal(parsed.origin, canonicalOrigin, `Sitemap URL must use the canonical origin: ${loc}`);
  assert.equal(parsed.search, "", `Sitemap URL must not contain a query: ${loc}`);
  assert.equal(parsed.hash, "", `Sitemap URL must not contain a fragment: ${loc}`);
  assert.ok(parsed.pathname === "/" || !parsed.pathname.endsWith("/"), `Sitemap URL must be slashless: ${loc}`);
  assert.match(lastmod, /^\d{4}-\d{2}-\d{2}$/, `Sitemap lastmod must be an honest date: ${loc}`);
  assert.ok(Number.isFinite(Date.parse(`${lastmod}T00:00:00Z`)), `Sitemap lastmod must parse: ${loc}`);
  assert.equal(lastmod, siteEvidence.contentModifiedDate, `Sitemap lastmod must match current site evidence: ${loc}`);
}

const htmlArtifacts = publicArtifactFiles().filter(
  (file) => file === "index.html" || file.endsWith("/index.html"),
);
const expectedUrls = htmlArtifacts
  .map((file) => `${canonicalOrigin}${publicRouteFor(file)}`)
  .sort((left, right) => left.localeCompare(right));
assert.deepEqual(
  [...sitemapUrls].sort((left, right) => left.localeCompare(right)),
  expectedUrls,
  "Sitemap must exactly cover every indexable static HTML route and no retired route.",
);

const titles = new Set();
const descriptions = new Set();
for (const file of htmlArtifacts) {
  const route = publicRouteFor(file);
  const canonicalUrl = `${canonicalOrigin}${route}`;
  const html = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() ?? "";
  const description = attribute(html, /<meta\b[^>]*\bname="description"[^>]*>/i, "content") ?? "";
  const canonical = attribute(html, /<link\b[^>]*\brel="canonical"[^>]*>/i, "href");
  const htmlRobots = attribute(html, /<meta\b[^>]*\bname="robots"[^>]*>/i, "content");
  const googlebot = attribute(html, /<meta\b[^>]*\bname="googlebot"[^>]*>/i, "content");
  const bingbot = attribute(html, /<meta\b[^>]*\bname="bingbot"[^>]*>/i, "content");
  const ogUrl = attribute(html, /<meta\b[^>]*\bproperty="og:url"[^>]*>/i, "content");
  const languageAlternates = matches(html, /<link\b(?=[^>]*\brel="alternate")(?=[^>]*\bhreflang="en-AU")[^>]*\bhref="([^"]+)"[^>]*>/gi);
  const defaultAlternates = matches(html, /<link\b(?=[^>]*\brel="alternate")(?=[^>]*\bhreflang="x-default")[^>]*\bhref="([^"]+)"[^>]*>/gi);
  const h1Count = [...html.matchAll(/<h1\b/gi)].length;

  assert.equal(attribute(html, /<html\b[^>]*>/i, "lang"), "en-AU", `${file} must declare en-AU.`);
  assert.equal(canonical, canonicalUrl, `${file} must self-canonicalize to its sitemap URL.`);
  assert.equal(ogUrl, canonicalUrl, `${file} Open Graph URL must match its canonical URL.`);
  assert.deepEqual(languageAlternates, [canonicalUrl], `${file} must expose one self-referential en-AU alternate.`);
  assert.deepEqual(defaultAlternates, [canonicalUrl], `${file} must expose one self-referential x-default alternate.`);
  assert.equal(htmlRobots, "index,follow", `${file} must remain indexable.`);
  for (const [crawler, directives] of [["googlebot", googlebot], ["bingbot", bingbot]]) {
    assert.match(directives ?? "", /\bindex\b/, `${file} must allow ${crawler} indexing.`);
    assert.match(directives ?? "", /\bfollow\b/, `${file} must allow ${crawler} link discovery.`);
    assert.match(directives ?? "", /max-snippet:-1/, `${file} must not suppress ${crawler} snippets.`);
    assert.match(directives ?? "", /max-image-preview:large/, `${file} must allow large image previews.`);
  }
  assert.ok(title.length >= 10 && title.length <= 65, `${file} title must be specific and search-safe.`);
  assert.ok(description.length >= 40 && description.length <= 160, `${file} description must be specific and search-safe.`);
  assert.ok(!titles.has(title), `${file} title must be unique: ${title}`);
  assert.ok(!descriptions.has(description), `${file} description must be unique.`);
  titles.add(title);
  descriptions.add(description);
  assert.equal(h1Count, 1, `${file} must expose exactly one primary heading.`);
  assert.ok(visibleText(html).length >= 500, `${file} must ship substantive server-rendered content.`);

  const structuredData = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)];
  assert.equal(structuredData.length, 2, `${file} must contain Organization and page-discovery JSON-LD.`);
  const organization = JSON.parse(structuredData[0][1]);
  assert.equal(organization["@type"], "Organization");
  assert.equal(organization["@id"], `${canonicalOrigin}/#organization`);
  assert.equal(organization.name, "FENRUA LABS PTY LTD");
  assert.equal(organization.legalName, "FENRUA LABS PTY LTD");
  assert.equal(organization.taxID, "ABN 62 700 182 663");
  assert.deepEqual(
    organization.identifier.map(({ propertyID, value }) => [propertyID, value]),
    [
      ["ABN", "62 700 182 663"],
      ["ACN", "700 182 663"],
    ],
  );
  assert.equal(organization.address.addressLocality, "Ultimo");
  assert.equal(organization.address.addressRegion, "NSW");
  assert.equal(organization.address.postalCode, "2007");
  assert.equal(organization.contactPoint.email, "partnerships@fenrua.ai");
  assert.equal(organization.url, `${canonicalOrigin}/`);
  assert.deepEqual(organization.sameAs, [
    "https://github.com/fenrualabs",
    "https://x.com/FenruaLabs",
    "https://www.linkedin.com/in/fenrua-labs-80b679388",
    "https://www.youtube.com/@FenruaLabs",
  ]);

  const discovery = JSON.parse(structuredData[1][1]);
  const graphByType = new Map(discovery["@graph"].map((entry) => [entry["@type"], entry]));
  assert.equal(graphByType.get("WebSite")?.url, `${canonicalOrigin}/`);
  assert.equal(graphByType.get("WebSite")?.publisher?.["@id"], `${canonicalOrigin}/#organization`);
  const webPage = graphByType.get("WebPage");
  assert.equal(webPage?.url, canonicalUrl, `${file} structured URL must match the canonical.`);
  assert.equal(webPage?.name, title, `${file} structured title must match the HTML title.`);
  assert.equal(webPage?.description, description, `${file} structured description must match the meta description.`);
  assert.equal(webPage?.inLanguage, "en-AU");
  assert.equal(webPage?.dateModified, sitemapByUrl.get(canonicalUrl)?.lastmod, `${file} lastmod signals must agree.`);
  assert.equal(webPage?.dateModified, siteEvidence.contentModifiedDate, `${file} dateModified must match current site evidence.`);
  const breadcrumb = graphByType.get("BreadcrumbList");
  assert.deepEqual(breadcrumb?.itemListElement?.[0], {
    "@type": "ListItem",
    position: 1,
    name: "Home",
    item: `${canonicalOrigin}/`,
  });
  assert.equal(
    breadcrumb?.itemListElement?.at(-1)?.item,
    canonicalUrl,
    `${file} breadcrumb must terminate at the canonical URL.`,
  );
}

for (const crawler of [
  "Google-Extended",
  "OAI-SearchBot",
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
]) {
  assert.match(robots, new RegExp(`User-agent: ${crawler}\\nAllow: /`));
}
assert.match(robots, /User-agent: \*\nAllow: \//);
assert.match(robots, /Sitemap: https:\/\/fenrua\.ai\/sitemap\.xml/);
assert.doesNotMatch(robots, /\bDisallow:/i, "Retired URLs must remain crawlable so search engines can observe 410 responses.");
assert.doesNotMatch(sitemap, /<loc>https:\/\/fenrua\.ai\/[^<]+\/<\/loc>/, "Non-root sitemap URLs must be slashless.");

const retiredTerms = ["nexus", "explorer", "fenpresale", "fenswap", "wallet", "register", "login", "account", "v2"];
for (const legacy of retiredTerms) {
  assert.doesNotMatch(sitemap, new RegExp(`<loc>[^<]*/${legacy}(?:/|<)`), `Sitemap must exclude ${legacy}.`);
}

const vercel = JSON.parse(vercelSource);
for (const source of ["/robots.txt", "/sitemap.xml", "/llms.txt"]) {
  const rule = vercel.headers.find((entry) => entry.source === source);
  const cacheControl = rule?.headers?.find((header) => header.key.toLowerCase() === "cache-control")?.value;
  assert.equal(cacheControl, "public, max-age=300, must-revalidate", `${source} must be fresh and revalidatable.`);
}

assert.match(llms, /FENRUA LABS PTY LTD/);
assert.match(llms, /https:\/\/fenrua\.ai\/legal/);
assert.doesNotMatch(llms, /token allocation|financial-return product is offered/i);
assert.match(securityText, /Canonical: https:\/\/fenrua\.ai\/\.well-known\/security\.txt/);
assert.match(securityText, /Policy: https:\/\/fenrua\.ai\/security/);

console.log(
  JSON.stringify({
    status: "ok",
    scope: "public-search-discovery",
    canonical: canonicalOrigin,
    indexableRoutes: htmlArtifacts.length,
    sitemapRecords: sitemapRecords.length,
    structuredPages: htmlArtifacts.length,
    crawlersAllowed: 6,
  }),
);
