import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
const routes = [...sitemap.matchAll(/<loc>https:\/\/fenrua\.ai([^<]+)<\/loc>/g)].map(([, path]) => path);

assert.equal(routes.length, 35, "The current route set must remain explicit in the sitemap.");
for (const route of routes) {
  const file = route === "/" ? "../index.html" : `..${route}/index.html`;
  const html = await readFile(new URL(file, import.meta.url), "utf8");

  for (const [label, href] of [
    ["Platform", "/platform"],
    ["Developers", "/developers"],
    ["Research", "/research"],
    ["Trust", "/trust"],
    ["Operations", "/operations"],
    ["Company", "/company"],
    ["Roadmap", "/roadmap"],
  ]) {
    assert.match(html, new RegExp(`<a href="${href}">${label}<\\/a>|<a href="${href}" aria-current="page">${label}<\\/a>`), `${route} must expose the ${label} primary category.`);
  }
  assert.doesNotMatch(html, /Swipe left for more|site-header-mobile-live|mobile-chain-status\.js/, `${route} must not depend on hidden horizontal navigation or a duplicate chain poller.`);
}

const overview = await readFile(new URL("../index.html", import.meta.url), "utf8");
assert.match(overview, /<header class="site-header site-header-live"/, "Overview must retain the dedicated mobile observation rail.");
assert.match(overview, /class="header-chain-rail mobile-chain-rail"/, "Overview must retain its compact mobile observation cards.");
assert.match(overview, /class="section-shell chain-progress desktop-chain-progress"/, "Overview must retain detailed desktop cards under its introductory card.");
assert.match(overview, /<script src="\/kernel-status\.js" defer><\/script>/, "Overview must use the bounded observation updater.");
assert.equal([...overview.matchAll(/data-chain-card="/g)].length, 4, "Overview must render only its responsive pairs of observation cards.");
assert.equal([...overview.matchAll(/data-chain-meta="announcer"/g)].length, 1, "Overview must expose one bounded observation announcer.");
assert.match(overview, /Awaiting signed observation/, "Overview static output must not assert a current chain state.");
assert.doesNotMatch(overview, />Loading</, "Overview static output must not remain in a permanent loading state.");

for (const route of routes.filter((route) => route !== "/" && route !== "/status")) {
  const html = await readFile(new URL(`..${route}/index.html`, import.meta.url), "utf8");
  assert.equal([...html.matchAll(/data-chain-card="/g)].length, 0, `${route} must not duplicate detailed chain cards.`);
  assert.equal([...html.matchAll(/data-chain-meta="announcer"/g)].length, 0, `${route} must not announce a poller it does not run.`);
  assert.doesNotMatch(html, /<script\s+src="\/(?:kernel-status|status-monitor)\.js"/i, `${route} must not load an unrelated observation poller.`);
}

const status = await readFile(new URL("../status/index.html", import.meta.url), "utf8");
assert.match(status, /<script src="\/status-monitor\.js" defer><\/script>/, "Status must retain the dedicated signed-observation monitor.");
assert.equal([...status.matchAll(/data-chain-card="/g)].length, 0, "Status uses its monitor table rather than duplicate cards.");
assert.equal([...status.matchAll(/data-status-monitor-announcer/g)].length, 1, "Status must retain one monitor announcer.");

console.log(JSON.stringify({ status: "ok", scope: "observation-placement-and-mobile-navigation", routes: routes.length }));
