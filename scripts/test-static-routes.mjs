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
  "audit/index.html",
  "status/index.html",
  "legal/index.html",
  "support/index.html",
  "security/index.html",
  "accessibility/index.html",
];

for (const route of routes) {
  const html = await readFile(new URL(`../${route}`, import.meta.url), "utf8");
  assert.match(html, /<main id="content">/, `${route} must contain a main landmark`);
  assert.match(html, /Skip to content/, `${route} must include a skip link`);
  assert.match(html, /technical-data\.js/, `${route} must load technical data controls`);
  assert.match(html, /<strong>Fenrua Protocol<\/strong>/, `${route} must use the canonical public protocol name`);
  assert.match(html, /<small>by Fenrua Labs Pty Ltd<\/small>/, `${route} must identify the registered operator`);
  assert.match(html, /<a class="nav-legal" href="\/legal"(?: aria-current="page")?>Legal<\/a>\s*<\/nav>/, `${route} must keep Legal as the dedicated final primary-navigation item`);
  assert.match(html, /href="\/#commercial-boundary-title">Service boundary<\/a>/, `${route} must link to the canonical service boundary`);
  assert.ok(
    html.includes('Business enquiries: <a href="mailto:partnerships@fenrua.ai">partnerships@fenrua.ai</a>'),
    `${route} must expose the public business contact`,
  );
  for (const [label, url] of [
    ["GitHub", "https://github.com/fenrualabs"],
    ["X", "https://x.com/FenruaLabs"],
    ["LinkedIn", "https://www.linkedin.com/in/fenrua-labs-80b679388"],
  ]) {
    assert.ok(html.includes(`<a href="${url}" rel="me">${label}</a>`), `${route} must expose the verified ${label} profile`);
  }
  assert.doesNotMatch(html, />Loading registry</, `${route} must not ship an empty loading registry`);
}

const renderedRouteHtml = await Promise.all(routes.map((route) => readFile(new URL(`../${route}`, import.meta.url), "utf8")));
assert.equal(
  renderedRouteHtml.reduce((count, html) => count + [...html.matchAll(/class="section-shell split-section commercial-boundary"/g)].length, 0),
  1,
  "The full commercial policy card must appear once, on Overview only."
);

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
assert.equal([...overview.matchAll(/class="section-shell split-section commercial-boundary"/g)].length, 1, "Overview must retain the single full policy card.");
assert.match(overview, /<script src="\/kernel-status\.js" defer><\/script>/, "overview must load live chain updater");
assert.match(overview, /class="site-header site-header-live"/, "overview must place live blocks in the header");
assert.match(overview, /class="header-chain-rail mobile-chain-rail"/, "overview must render the mobile header live chain rail");
assert.match(overview, /class="section-shell chain-progress desktop-chain-progress"/, "overview must render desktop live blocks under the intro card");
assert.match(overview, /data-chain-card="978"/, "overview must render Chain 978 live block card");
assert.match(overview, /data-chain-card="521"/, "overview must render Chain N521 live block card");
assert.match(overview, /<link rel="icon" href="\/assets\/fenrua-header-logo\.jpg" type="image\/jpeg" \/>/, "overview must use the approved logo as its favicon");
assert.match(overview, /<img src="\/assets\/fenrua-header-logo\.jpg" width="40" height="40" alt="" \/>/, "overview must use the approved logo in its header");
assert.match(overview, /data-chain-meta="feed-status"/, "overview must expose live chain feed status");
assert.match(
  overview,
  /Each chain is presented from its own independently signed bounded observation when one validates; otherwise its state remains waiting or unavailable\./,
  "overview observation copy must remain conditional on each chain's current signed evidence."
);
assert.doesNotMatch(
  overview,
  /Chain N521 remains awaiting evidence/,
  "overview must not freeze Chain N521 in an awaiting state when live signed evidence can change independently."
);
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
assert.match(status, /Current public state/);
assert.match(status, /Commercial boundary statement/);
assert.match(status, /Research and technology services/);
assert.match(status, /LIVE SIGNED OBSERVATIONS/);
assert.match(status, /STATIC RELEASE RECORDS/);
assert.match(status, /<script src="\/status-monitor\.js" defer><\/script>/);
assert.match(status, /data-status-monitor-row="978"/);
assert.match(status, /data-status-monitor-row="521"/);
assert.match(status, /Last signed observation/);
assert.match(status, /status-table/);
assert.doesNotMatch(status, /data-relative-time="/);
assert.doesNotMatch(status, /data-label="Timestamp"/);
assert.doesNotMatch(status, /Last successful check/);
assert.doesNotMatch(status, /<script>\s*\(\(\) =>/, "Status must not ship a CSP-blocked inline relative-time script.");
assert.equal([...status.matchAll(/data-chain-meta="announcer"/g)].length, 0, "Status header telemetry must be non-announcing.");
assert.equal([...status.matchAll(/data-status-monitor-announcer/g)].length, 1, "Status must expose one telemetry live region.");
const staticReleaseTable = status.match(/<div class="registry status-table static-release-table"[\s\S]*?<\/table>/)?.[0];
assert.ok(staticReleaseTable, "Status must render the static release table.");
const staticReleaseBody = staticReleaseTable.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1];
assert.ok(staticReleaseBody, "Status must render a static release table body.");
const staticReleaseRows = [...staticReleaseBody.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((match) => match[1]);
assert.ok(staticReleaseRows.length > 0, "Status must render static release rows.");
for (const [index, row] of staticReleaseRows.entries()) {
  assert.equal([...row.matchAll(/<td\b/g)].length, 8, `Static release row ${index + 1} must match the eight-column header.`);
  assert.equal([...row.matchAll(/data-label="Current limitation"/g)].length, 1, `Static release row ${index + 1} must expose one limitation cell.`);
}

const evidence = await readFile(new URL("../evidence/index.html", import.meta.url), "utf8");
assert.match(evidence, /class="hash-copy"/);
assert.match(evidence, /class="hash-value"/);
assert.match(evidence, /data-label="Hash"/);
assert.match(evidence, /data-label="Limitation"/);
assert.match(evidence, /data-copy-label="Full SHA copied"/);
assert.match(evidence, /Published kernel regression snapshot/);
assert.match(evidence, /regression_001_p521_sub_overflow\.bin/);
assert.match(evidence, /7d11e62691085056fde7193c23cc7b3ffbfde2171807f820fc94cecf6f19ee5e/);

const audit = await readFile(new URL("../audit/index.html", import.meta.url), "utf8");
assert.match(audit, /CURRENT PUBLIC RELEASE/);
assert.match(audit, /STATIC RELEASE SCOPE/);
assert.match(audit, /\.well-known\/fenrua-release\.json/);
assert.match(audit, /access-only-commercial-boundary/);
assert.doesNotMatch(audit, /class="section-shell split-section commercial-boundary"/, "Audit must link to the canonical policy rather than repeat its full card.");

const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
for (const route of ["legal", "support", "security", "accessibility"]) assert.match(sitemap, new RegExp(`/${route}<`));
for (const route of ["nexus", "fenswap", "fenpresale", "wallet", "privacy", "terms"]) assert.doesNotMatch(sitemap, new RegExp(`/${route}<`));

const legal = await readFile(new URL("../legal/index.html", import.meta.url), "utf8");
assert.match(legal, /FENRUA LABS PTY LTD/);
assert.match(legal, /ABN 62 700 182 663/);
assert.match(legal, /ACN 700 182 663/);
assert.match(legal, /Registered from 2026-07-13/);
assert.match(legal, /CURRENT OPERATING RECORD/);
assert.match(legal, /AI efficiency infrastructure and related services/);
assert.equal([...legal.matchAll(/<tr>/g)].length, 8, "Legal must render one header plus seven approved offering rows.");
assert.match(legal, /may separately contract, invoice, receive payment, and deliver services through ordinary business arrangements/i);
assert.doesNotMatch(legal, /\b(?:XP|Fortnight League|Picker|community activity|bounded rewards|payment rails)\b/i);
assert.doesNotMatch(legal, /\b(?:compliance-owned gate|must be approved|compliance-approved)\b/i);
assert.doesNotMatch(legal, /Fenrua Protocol is (?:the|an) AI security/i);
assert.equal([...legal.matchAll(/class="section-shell split-section commercial-boundary"/g)].length, 0, "Legal must link to the Overview policy card rather than repeat it.");

console.log(JSON.stringify({ status: "ok", scope: "static-routes", routes: routes.length, toolchainRows: renderedRows }));
