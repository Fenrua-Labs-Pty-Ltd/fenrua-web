import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const routes = [
  "index.html",
  "architecture/index.html",
  "kernel/index.html",
  "utilities/index.html",
  "research/index.html",
  "research/pn521-cross-limb-borrow/index.html",
  "research/toolchain-evidence-lock/index.html",
  "research/read-only-chain-observation/index.html",
  "verify/index.html",
  "developers/index.html",
  "toolchain/index.html",
  "evidence/index.html",
  "status/index.html",
];

const legacyRoutes = ["nexus", "fenswap", "fenpresale", "wallet", "support", "legal", "privacy", "terms", "accessibility", "security"];

for (const route of routes) {
  const html = await readFile(new URL(`../${route}`, import.meta.url), "utf8");
  assert.match(html, /<main id="content">/, `${route} must contain a main landmark`);
  assert.match(html, /Skip to content/, `${route} must include a skip link`);
  assert.match(html, /technical-data\.js/, `${route} must load technical data controls`);
  assert.doesNotMatch(html, />Loading registry</, `${route} must not ship an empty loading registry`);
}

const toolchain = await readFile(new URL("../toolchain/index.html", import.meta.url), "utf8");
const renderedRows = [...toolchain.matchAll(/data-tool-row/g)].length;
assert.ok(renderedRows >= 100, "toolchain route must server-render the registry rows");
assert.match(toolchain, /Registry SHA-256/);
assert.match(toolchain, /Download JSON/);
assert.match(toolchain, /Download Markdown lock/);
assert.match(toolchain, /Version verified/);
assert.match(toolchain, /Smoke tested/);
assert.match(toolchain, /Campaign executed/);
assert.match(toolchain, /VERSION_VERIFIED/);
assert.match(toolchain, /class="tag-stack"/);
assert.match(toolchain, /class="toolchain-mobile-list"/);
assert.match(toolchain, /data-tool-card/);
assert.match(toolchain, /data-filter-disclosure/);
assert.match(toolchain, /data-clear-filters/);
assert.match(toolchain, /id="tool-sort"/);
assert.match(toolchain, /Known limitations/);
assert.equal([...toolchain.matchAll(/class="registry-tools toolchain-tools"/g)].length, 1, "toolchain controls must not render duplicate wrappers");
assert.doesNotMatch(toolchain, /<span class="status-badge">[^<]+<\/span><br>/, "delivery tags must use chip groups, not line-break stacks");
assert.doesNotMatch(toolchain, />Executed</);

const overview = await readFile(new URL("../index.html", import.meta.url), "utf8");
assert.match(overview, /<script src="\/kernel-status\.js" defer><\/script>/, "overview must load live chain updater");
assert.match(overview, /class="site-header site-header-live"/, "overview must place live blocks in the header");
assert.match(overview, /class="header-chain-rail mobile-chain-rail"/, "overview must render the mobile header live chain rail");
assert.match(overview, /class="section-shell chain-progress desktop-chain-progress"/, "overview must render desktop live blocks under the intro card");
assert.match(overview, /data-chain-card="978"/, "overview must render Chain 978 live block card");
assert.match(overview, /data-chain-card="521"/, "overview must render Chain N521 live block card");
assert.match(overview, /data-chain-meta="feed-status"/, "overview must expose live chain feed status");
assert.equal([...overview.matchAll(/data-chain-card="/g)].length, 4, "overview must render two responsive pairs of live block cards");
assert.match(overview, /Evidence source/);
assert.match(overview, /Confidence/);
assert.doesNotMatch(overview, /Independent source|Primary source/);
assert.doesNotMatch(overview, /Blocks since check|data-chain-field="(?:978|521)-delta"/);

const verify = await readFile(new URL("../verify/index.html", import.meta.url), "utf8");
for (const code of ["PASS", "PASS_WITH_LIMITATIONS", "FAIL_CLOSED", "UNSUPPORTED_SCHEMA", "ERROR"]) {
  assert.match(verify, new RegExp(code), `verify page must list ${code}`);
}
assert.match(verify, /examples\/verification-results\/pass\.example\.json/);
assert.match(verify, /class="code-panel"/);
assert.match(verify, /data-wrap-toggle/);

const research = await readFile(new URL("../research/index.html", import.meta.url), "utf8");
assert.match(research, /class="research-card-list"/);
assert.match(research, /Open record/);
assert.match(research, /Primary limitation/);

for (const route of [
  "research/pn521-cross-limb-borrow/index.html",
  "research/toolchain-evidence-lock/index.html",
  "research/read-only-chain-observation/index.html",
]) {
  const record = await readFile(new URL(`../${route}`, import.meta.url), "utf8");
  for (const section of ["summary", "claim", "non-claim", "threat", "tooling", "commands", "evidence", "regression", "limitations", "reproduction"]) {
    assert.match(record, new RegExp(`id="${section}"`), `${route} must expose ${section}`);
  }
  assert.match(record, /class="record-toc"/);
  assert.match(record, /class="code-panel"/);
}

const status = await readFile(new URL("../status/index.html", import.meta.url), "utf8");
for (const state of ["loading", "success", "partial", "stale", "failure", "paused", "maintenance"]) {
  assert.match(status, new RegExp(`data-state="${state}"`), `status page must document ${state}`);
}
assert.match(status, /Operational state/);
assert.match(status, /pending evidence/);
assert.match(status, /<time datetime="\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z">/);
assert.match(status, /\d{2}:\d{2}:\d{2} UTC/);
assert.match(status, /data-relative-time="/);
assert.match(status, /status-table/);
assert.match(status, /data-label="Timestamp"/);

const evidence = await readFile(new URL("../evidence/index.html", import.meta.url), "utf8");
assert.match(evidence, /class="hash-copy"/);
assert.match(evidence, /class="hash-value"/);
assert.match(evidence, /data-label="Hash"/);
assert.match(evidence, /data-label="Limitation"/);
assert.match(evidence, /data-copy-label="Full SHA copied"/);

const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
for (const route of legacyRoutes) {
  const html = await readFile(new URL(`../${route}/index.html`, import.meta.url), "utf8");
  assert.match(html, /LEGACY \/ SUPERSEDED/, `${route} must be clearly marked legacy`);
  assert.match(html, /noindex,nofollow/, `${route} must be noindex`);
  assert.doesNotMatch(sitemap, new RegExp(`/${route}/`), `${route} must not be in sitemap`);
}

console.log(JSON.stringify({ status: "ok", scope: "static-routes", routes: routes.length, toolchainRows: renderedRows }));
