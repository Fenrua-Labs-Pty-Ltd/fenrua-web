import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, robots, sitemap] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../robots.txt", import.meta.url), "utf8"),
  readFile(new URL("../sitemap.xml", import.meta.url), "utf8"),
]);

const structuredData = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
assert.ok(structuredData, "Organization JSON-LD must be present.");

const organization = JSON.parse(structuredData[1]);
assert.equal(organization["@type"], "Organization");
assert.equal(organization.name, "Fenrua Labs");
assert.equal(organization.url, "https://fenrua.ai/");
assert.ok(organization.sameAs?.includes("https://github.com/fenrualabs"));

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

assert.match(robots, /Sitemap: https:\/\/fenrua\.ai\/sitemap\.xml/);
assert.match(sitemap, /<loc>https:\/\/fenrua\.ai\/<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/fenrua\.ai\/architecture\/<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/fenrua\.ai\/toolchain\/<\/loc>/);
assert.match(html, /<link rel="canonical" href="https:\/\/fenrua\.ai\/" \/>/);

console.log(
  JSON.stringify({
    status: "ok",
    scope: "public-discovery",
    canonical: organization.url,
    crawlersAllowed: 6,
  })
);
