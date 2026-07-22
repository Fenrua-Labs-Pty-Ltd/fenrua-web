import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function sectionById(markup, id) {
  const section = markup.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>[\\s\\S]*?<\\/section>`))?.[0];
  assert.ok(section, `Missing generated section #${id}.`);
  return section;
}

function cardByHeading(markup, heading) {
  const card = markup.match(new RegExp(`<article>[\\s\\S]*?<h3>${heading}<\\/h3>[\\s\\S]*?<\\/article>`))?.[0];
  assert.ok(card, `Missing reviewer card ${heading}.`);
  return card;
}

function assertOfficialSourceWarning(markup, label) {
  const warning = sectionById(markup, "official-source-warning");
  assert.match(warning, /class="official-source-warning"/, `${label} must render the official-source warning surface.`);
  assert.match(warning, /<p class="warning-eyebrow">SECURITY NOTICE<\/p>/, `${label} must label the warning in text as a security notice.`);
  assert.match(warning, /<h2 id="official-source-warning-title">Official Source and Anti-Impersonation Notice<\/h2>/, `${label} must preserve the warning title.`);
  for (const statement of [
    "fenrua.ai is the sole and only official website for Fenrua Protocol and Fenrua Labs Pty Ltd.",
    "Fenrua Protocol has no live token, contract, presale, airdrop, staking pool, swap, bridge, NFT mint, or claim page on Ethereum, Solana, BSC, or any other public mainnet chain.",
    "Fenrua activity is currently limited to Fenrua’s private-chain research environment and bounded public evidence surfaces.",
    "should be treated as unauthorised, impersonated, or potentially fraudulent unless explicitly confirmed on fenrua.ai.",
    "Always verify Fenrua information from fenrua.ai before trusting any external link, message, contract address, social post, or media account.",
  ]) {
    const escaped = statement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(warning, new RegExp(escaped), `${label} must preserve the required official-source notice.`);
  }
}

function assertNoPositiveReviewerClaims(markup, label) {
  for (const pattern of [
    /\b(?:we|fenrua|the public (?:site|path|record))\s+(?:offer|offers|provide|provides|operate|operates|grant|grants|include|includes|guarantee|guarantees|promise|promises)\s+(?:a\s+)?(?:public account(?: flow)?|hosted verifier(?: availability)?|public service entitlement|SLO|uptime|runtime assurance|runtime attestation|production approval|financial return)\b/i,
    /\b(?:the\s+)?(?:site|release|service|public (?:site|path|record))\s+(?:has|have|is|are|was|were|received|receives|holds|hold)\s+(?:an?\s+)?(?:public account(?: flow)?|hosted verifier(?: availability)?|public service entitlement|SLO|production approval|runtime assurance|runtime attestation|financial return)\b/i,
    /\b(?:the\s+)?(?:site|release|service|public (?:site|path|record))\s+(?:has|have|is|are|was|were)\s+(?:an?\s+)?(?:\d+(?:\.\d+)?%\s+)?uptime\b/i,
    /\b(?:fenrua|the\s+(?:site|release|service|public (?:site|path|record)))\s+(?:is|are|was|were|has\s+been|have\s+been)\s+(?:certified|certificated|production-approved|attested)\b/i,
    /\b(?:external\s+)?(?:certification|runtime attestation|production approval|runtime assurance)\s+(?:confirms?|verifies|certifies|attests?|guarantees?|proves?)\b/i,
    /\b(?:the\s+)?SLO\s+(?:meets|is|are|has|have|guarantees?|confirms?)\b/i,
  ]) {
    assert.doesNotMatch(markup, pattern, `${label} must not introduce a positive assurance or service claim.`);
  }
}

for (const prohibitedClaim of [
  "The site has 99.99% uptime.",
  "The release has production approval.",
  "Fenrua is certified.",
  "Runtime attestation confirms the service state.",
]) {
  assert.throws(() => assertNoPositiveReviewerClaims(prohibitedClaim, "Claim-guard fixture"), assert.AssertionError);
}
for (const boundaryStatement of [
  "No public account flow is offered.",
  "No hosted verifier availability is claimed.",
  "This is not external certification.",
]) {
  assert.doesNotThrow(() => assertNoPositiveReviewerClaims(boundaryStatement, "Boundary-guard fixture"));
}

const routes = [
  "index.html",
  "platform/index.html",
  "architecture/index.html",
  "architecture/context/index.html",
  "architecture/components/index.html",
  "architecture/runtime/index.html",
  "architecture/deployment/index.html",
  "architecture/trust-boundaries/index.html",
  "architecture/data-and-provenance/index.html",
  "architecture/recovery/index.html",
  "architecture/evolution/index.html",
  "kernel/index.html",
  "utilities/index.html",
  "research/index.html",
  "research/pn521-cross-limb-borrow/index.html",
  "research/toolchain-evidence-lock/index.html",
  "research/read-only-chain-observation/index.html",
  "verify/index.html",
  "developers/index.html",
  "start/index.html",
  "trust/index.html",
  "trust/claims/index.html",
  "trust/evidence-classes/index.html",
  "operations/index.html",
  "operations/observations/index.html",
  "toolchain/index.html",
  "evidence/index.html",
  "audit/index.html",
  "status/index.html",
  "company/index.html",
  "legal/index.html",
  "support/index.html",
  "security/index.html",
  "accessibility/index.html",
];

assert.equal(routes.length, 34, "Static route coverage must match the current public estate.");

for (const route of routes) {
  const html = await readFile(new URL(`../${route}`, import.meta.url), "utf8");
  assert.match(html, /<link rel="icon" href="\/favicon\.ico" sizes="any" \/>/, `${route} must expose the root ICO favicon.`);
  assert.match(html, /<link rel="icon" type="image\/png" sizes="32x32" href="\/assets\/favicon-32x32\.png" \/>/, `${route} must expose the 32px PNG favicon.`);
  assert.match(html, /<link rel="icon" type="image\/png" sizes="48x48" href="\/assets\/favicon-48x48\.png" \/>/, `${route} must expose the 48px PNG favicon.`);
  assert.match(html, /<link rel="apple-touch-icon" sizes="180x180" href="\/assets\/apple-touch-icon\.png" \/>/, `${route} must expose the Apple touch icon.`);
  assert.match(html, /<link rel="manifest" href="\/site\.webmanifest" \/>/, `${route} must expose the PWA manifest.`);
  assert.match(html, /<img src="\/assets\/fenrua-header-logo\.png" width="40" height="40" alt="" decoding="async" \/>/, `${route} must use the frozen PNG in its header.`);
  assert.doesNotMatch(html, /fenrua-header-logo\.jpg/, `${route} must not expose the retired JPG in page metadata, header, or favicon tags.`);
  assert.match(html, /<main id="content">/, `${route} must contain a main landmark`);
  assert.match(html, /Skip to content/, `${route} must include a skip link`);
  assert.match(html, /technical-data\.js/, `${route} must load technical data controls`);
  assert.match(html, /<strong>Fenrua BlackBox Protocol<\/strong>/, `${route} must use the canonical public protocol name`);
  assert.match(html, /<small>by Fenrua Labs Pty Ltd<\/small>/, `${route} must identify the registered operator`);
  for (const [label, href] of [
    ["Platform", "/platform"],
    ["Developers", "/developers"],
    ["Research", "/research"],
    ["Trust", "/trust"],
    ["Operations", "/operations"],
    ["Company", "/company"],
  ]) {
    assert.match(html, new RegExp(`<a href="${href}">${label}<\\/a>|<a href="${href}" aria-current="page">${label}<\\/a>`), `${route} must expose the ${label} primary category.`);
  }
  if (route !== "index.html") {
    assert.match(html, /class="breadcrumb-nav" aria-label="Breadcrumb"/, `${route} must expose visible breadcrumbs.`);
    assert.match(html, /class="section-nav" aria-label="[^\"]+ section"/, `${route} must expose local section navigation.`);
  }
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
assert.ok(toolchain.indexOf("Evidence producing") < toolchain.indexOf("Campaign executed"), "Toolchain hierarchy must prioritise evidence-producing records before campaign execution.");
assert.match(toolchain, /CAMPAIGN_EXECUTED/);
assert.match(toolchain, /Evidence links/);
assert.match(toolchain, /Toolchain version-capture boundary/);
assert.match(toolchain, /VERSION_VERIFIED/);
assert.match(toolchain, /class="tag-stack"/);
assert.match(toolchain, /class="toolchain-mobile-list"/);
assert.match(toolchain, /data-tool-card/);
assert.match(toolchain, /data-filter-disclosure/);
assert.match(toolchain, /data-clear-filters/);
assert.match(toolchain, /id="tool-sort"/);
assert.match(toolchain, /data-page-status role="status" aria-live="polite" aria-atomic="true"/, "Toolchain filter results must expose a bounded live status.");
assert.match(toolchain, /Known limitations/);
assert.equal([...toolchain.matchAll(/class="registry-tools toolchain-tools"/g)].length, 1, "toolchain controls must not render duplicate wrappers");
assert.doesNotMatch(toolchain, /<span class="status-badge">[^<]+<\/span><br>/, "delivery tags must use chip groups, not line-break stacks");
assert.doesNotMatch(toolchain, />Executed</);

const overview = await readFile(new URL("../index.html", import.meta.url), "utf8");
const trust = await readFile(new URL("../trust/index.html", import.meta.url), "utf8");
const legal = await readFile(new URL("../legal/index.html", import.meta.url), "utf8");
for (const [label, markup] of [["Overview", overview], ["Trust", trust], ["Legal", legal]]) assertOfficialSourceWarning(markup, label);
assert.ok(overview.indexOf('id="official-source-warning"') > overview.indexOf('<main id="content">'), "Overview warning must remain inside the main landmark.");
assert.ok(overview.indexOf('id="official-source-warning"') < overview.indexOf('id="page-title"'), "Overview warning must appear directly below the navigation, before the hero introduction.");
assert.match(overview, /<div class="home-intro">[\s\S]*id="official-source-warning"[\s\S]*class="route-hero route-hero-solo"/, "Overview must retain the shared desktop intro layout while preserving warning-first reading order.");
assert.equal([...overview.matchAll(/class="section-shell split-section commercial-boundary"/g)].length, 1, "Overview must retain the single full policy card.");
assert.match(overview, /Fenrua BlackBox Protocol/);
assert.match(overview, /Public evidence for private AI execution\./);
assert.match(overview, /Evidence Before Authority/);
assert.match(overview, /Capability is not authority/);
assert.match(overview, /Governable autonomous AI execution/);
assert.match(overview, /Trust Gate and the P\/N-521 proof-kernel direction remain promotion-gated research\./);
assert.doesNotMatch(overview, /AI efficiency infrastructure for verifiable systems/i);
assert.match(trust, /Fenrua BlackBox Protocol provides bounded evidence for reviewer verification/);
assert.match(overview, /<script src="\/kernel-status\.js" defer><\/script>/, "overview must load live chain updater");
assert.match(overview, /class="site-header site-header-live"/, "overview must place live blocks in the header");
assert.match(overview, /class="header-chain-rail mobile-chain-rail"/, "overview must render the mobile header live chain rail");
assert.match(overview, /class="section-shell chain-progress desktop-chain-progress"/, "overview must render desktop live blocks under the intro card");
assert.match(overview, /data-chain-card="978"/, "overview must render Chain 978 live block card");
assert.match(overview, /data-chain-card="521"/, "overview must render Chain N521 live block card");
assert.match(overview, /<meta property="og:image" content="https:\/\/fenrua\.ai\/assets\/fenrua-header-logo\.png" \/>/, "overview must use the frozen PNG for OpenGraph discovery.");
assert.match(overview, /<meta name="twitter:image" content="https:\/\/fenrua\.ai\/assets\/fenrua-header-logo\.png" \/>/, "overview must use the frozen PNG for Twitter discovery.");
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

const platform = await readFile(new URL("../platform/index.html", import.meta.url), "utf8");
assert.match(platform, /CURRENT CAPABILITY STATES/);
assert.match(platform, /capability-register\.json/);
assert.match(platform, /Local Trust Gate/);
assert.match(platform, /No public implementation, CLI, SDK, API, hosted interface, or release artifact is recorded\./);
assert.match(platform, /data-capability-id="capability\.local-trust-gate" data-capability-availability="not-available"/, "Platform must render the canonical planned capability record.");
assert.match(platform, /href="\/trust\/claims#capability\.local-trust-gate">Inspect boundary<\/a>/, "Platform must link the planned capability to its canonical record.");
assert.doesNotMatch(platform, /\/platform\/trust-gate/, "A dedicated Trust Gate product route must remain absent until the approved repository and release gate exist.");
assert.match(platform, /AI efficiency evidence standard/);
assert.match(platform, /does not publish a measured AI-efficiency benchmark/i);

const start = await readFile(new URL("../start/index.html", import.meta.url), "utf8");
for (const role of ["Developer", "Security engineer", "Researcher", "Enterprise technical leader", "University or educator", "Open-source contributor", "General technical reviewer"]) {
  assert.match(start, new RegExp(`<h3>${role}<\\/h3>`), `Start must include the ${role} path.`);
}
assert.doesNotMatch(start, /investor|investment opportunity|token sale/i, "Start must remain technical rather than investor-oriented.");
const noCloneReviewerPath = sectionById(start, "no-clone-reviewer-path");
assert.match(noCloneReviewerPath, /No-clone technical inspection path/);
assert.match(noCloneReviewerPath, /The no-clone path is inspection, not reproduction\./);
assert.match(noCloneReviewerPath, /does not replace local reproduction, runtime testing, protected-system attestation, security certification, formal verification, independent audit, or production approval/i);
for (const lane of [
  "Read the release-integrity boundary",
  "Inspect the claim register",
  "Inspect evidence classes",
  "Inspect capability maturity",
  "Inspect the public service boundary",
  "Inspect the observation boundary",
  "Reproduce locally only when required",
]) {
  assert.match(noCloneReviewerPath, new RegExp(lane), `No-clone reviewer path must include: ${lane}.`);
}
const localReproductionCard = cardByHeading(noCloneReviewerPath, "Reproduce locally only when required");
assert.match(localReproductionCard, /Clone the repository and run the Node 24 validation path only when local reproduction is required\./);
assert.match(localReproductionCard, /href="\/verify#local-verification"/);

const inspectionClosure = sectionById(start, "inspection-closure");
assert.match(inspectionClosure, /After inspection, choose the correct next action/);
for (const lane of [
  "Retain or cite the current release record",
  "Inspect claims and evidence classes",
  "Use the no-clone inspection path first",
  "Run local validation only when reproduction is required",
  "Report public documentation or source issues",
  "Report vulnerabilities through the private security path",
  "Contact partnerships for agreement-specific scope",
  "Return later to inspect reviewer delta",
]) {
  assert.match(inspectionClosure, new RegExp(lane), `Reviewer completion must include: ${lane}.`);
}
const publicIssuesCard = cardByHeading(inspectionClosure, "Report public documentation or source issues");
assert.match(publicIssuesCard, /href="https:\/\/github\.com\/Fenrua-Labs-Pty-Ltd\/fenrua-web"/);
const privateVulnerabilityCard = cardByHeading(inspectionClosure, "Report vulnerabilities through the private security path");
assert.match(privateVulnerabilityCard, /href="\/security"/);
assert.notEqual(publicIssuesCard, privateVulnerabilityCard, "Public source issues and private vulnerability reporting must remain separate lanes.");
const partnershipsCard = cardByHeading(inspectionClosure, "Contact partnerships for agreement-specific scope");
assert.match(partnershipsCard, /agreement-specific service or evidence scope/i);
assert.match(partnershipsCard, /href="mailto:partnerships@fenrua\.ai"/);

const reviewerPublicContent = `${noCloneReviewerPath}\n${inspectionClosure}`;
assert.doesNotMatch(reviewerPublicContent, /\b(?:sign[- ]?up|checkout|payment|wallet|token|reward|referral)\b/i, "Reviewer paths must not introduce consumer-funnel mechanics.");
assert.doesNotMatch(reviewerPublicContent, /\bexternal[-\s]validation\b/i, "Reviewer paths must avoid ambiguous external-validation terminology.");
assertNoPositiveReviewerClaims(reviewerPublicContent, "Reviewer paths");

const claims = await readFile(new URL("../trust/claims/index.html", import.meta.url), "utf8");
assert.match(claims, /data-claim-filter/);
assert.match(claims, /claim-filter\.js/);
assert.match(claims, /Download claim register JSON/);
assert.ok([...claims.matchAll(/data-claim-record/g)].length >= 19, "Claims must render the complete canonical register without JavaScript.");
assert.match(claims, /capability\.observation-n521/);
assert.match(claims, /no liveness claim until an independent gateway and public verification key are configured/i);

const evidenceClasses = await readFile(new URL("../trust/evidence-classes/index.html", import.meta.url), "utf8");
assert.equal([...evidenceClasses.matchAll(/class="evidence-class-card"/g)].length, 11, "Evidence classes must render the complete taxonomy.");
assert.match(evidenceClasses, /Does not prove:/);

const operations = await readFile(new URL("../operations/index.html", import.meta.url), "utf8");
assert.match(operations, /STATUS PLANES/);
assert.match(operations, /SLO state/);
assert.match(operations, /not-defined/);
for (const plane of ["Publication status", "Platform service health", "Dependency health", "Signed external observation status", "Security incident status", "Maintenance and change status"]) {
  assert.match(operations, new RegExp(plane), `Operations must distinguish ${plane}.`);
}
assert.doesNotMatch(operations, /99\.9%|uptime guarantee|SLA/i, "Operations must not invent reliability claims.");

const observations = await readFile(new URL("../operations/observations/index.html", import.meta.url), "utf8");
assert.match(observations, /Chain N521 bounded observation/);
assert.match(observations, /not-available/);
assert.doesNotMatch(observations, /data-chain-card=/, "Observation detail route must not duplicate polling cards.");

for (const route of ["context", "components", "runtime", "deployment", "trust-boundaries", "data-and-provenance", "recovery", "evolution"]) {
  const view = await readFile(new URL(`../architecture/${route}/index.html`, import.meta.url), "utf8");
  assert.match(view, /class="architecture-diagram"/, `${route} must have a semantic architecture diagram.`);
  assert.match(view, /Text equivalent:/, `${route} must have a diagram text equivalent.`);
  assert.match(view, /CURRENT IMPLEMENTATION BOUNDARY/, `${route} must state its implementation boundary.`);
}

const verify = await readFile(new URL("../verify/index.html", import.meta.url), "utf8");
for (const code of ["PASS", "PASS_WITH_LIMITATIONS", "FAIL_CLOSED", "UNSUPPORTED_SCHEMA", "ERROR"]) {
  assert.match(verify, new RegExp(code), `verify page must list ${code}`);
}
assert.match(verify, /examples\/verification-results\/pass\.example\.json/);
assert.match(verify, /class="code-panel"/);
assert.match(verify, /data-wrap-toggle/);
assert.match(verify, /LEGACY VERIFICATION CORPUS/);
assert.match(verify, /does not authorise or instruct execution/i);
assert.doesNotMatch(verify, /Execution may continue within scope/);

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
assert.match(status, /STATUS PLANE BOUNDARIES/);
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
for (const group of ["Current release evidence", "Historical research evidence", "Observation evidence", "Independent evidence", "Superseded or revoked evidence"]) {
  assert.match(evidence, new RegExp(group), `Evidence registry must expose ${group}.`);
}
assert.match(evidence, /Published kernel regression snapshot/);
assert.match(evidence, /regression_001_p521_sub_overflow\.bin/);
assert.match(evidence, /7d11e62691085056fde7193c23cc7b3ffbfde2171807f820fc94cecf6f19ee5e/);

const audit = await readFile(new URL("../audit/index.html", import.meta.url), "utf8");
assert.match(audit, /CURRENT PUBLIC RELEASE/);
assert.match(audit, /Release Integrity Verification/);
assert.match(audit, /VERIFICATION SUBJECT/);
assert.match(audit, /Independent trust anchor/);
assert.match(audit, /STATIC RELEASE SCOPE/);
assert.match(audit, /\.well-known\/fenrua-release\.json/);
assert.match(audit, /access-only-commercial-boundary/);
assert.doesNotMatch(audit, /class="section-shell split-section commercial-boundary"/, "Audit must link to the canonical policy rather than repeat its full card.");
const reviewerDelta = sectionById(audit, "reviewer-delta");
assert.match(reviewerDelta, /Reviewer delta/);
assert.match(reviewerDelta, /evidence-only checkpoint/i);
assert.match(reviewerDelta, /not a marketing changelog/i);
assert.match(reviewerDelta, /does not make a current runtime, service-health, certification, protected-system, or future-freshness claim/i);
for (const checkpoint of [
  "Current release record",
  "Changed public artifact or document-register entry",
  "Evidence record affected",
  "Supersession or limitation",
  "Observation state to re-check",
  "Recommended reviewer action",
]) {
  assert.match(reviewerDelta, new RegExp(checkpoint), `Reviewer delta must include: ${checkpoint}.`);
}
assert.match(reviewerDelta, /href="\/data\/public-document-register\.json"/);
assert.match(reviewerDelta, /Re-check signed observation state only through the bounded public monitor/i);
assert.doesNotMatch(reviewerDelta, /\b(?:sign[- ]?up|checkout|payment|wallet|token|reward|referral|external[-\s]validation)\b/i, "Reviewer delta must remain evidence-only.");
assertNoPositiveReviewerClaims(reviewerDelta, "Reviewer delta");

const sitemap = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
for (const route of ["legal", "support", "security", "accessibility"]) assert.match(sitemap, new RegExp(`/${route}<`));
for (const route of ["nexus", "fenswap", "fenpresale", "wallet", "privacy", "terms"]) assert.doesNotMatch(sitemap, new RegExp(`/${route}<`));

assert.match(legal, /FENRUA LABS PTY LTD/);
assert.match(legal, /ABN 62 700 182 663/);
assert.match(legal, /ACN 700 182 663/);
assert.match(legal, /Registered from 2026-07-13/);
assert.match(legal, /CURRENT OPERATING RECORD/);
assert.match(legal, /Protocol infrastructure and related services/);
assert.equal([...legal.matchAll(/<tr>/g)].length, 8, "Legal must render one header plus seven approved offering rows.");
assert.match(legal, /may separately contract, invoice, receive payment, and deliver services through ordinary business arrangements/i);
assert.doesNotMatch(legal, /\b(?:XP|Fortnight League|Picker|community activity|bounded rewards|payment rails)\b/i);
assert.doesNotMatch(legal, /\b(?:compliance-owned gate|must be approved|compliance-approved)\b/i);
assert.doesNotMatch(legal, /Fenrua Protocol is (?:the|an) AI security/i);
assert.equal([...legal.matchAll(/class="section-shell split-section commercial-boundary"/g)].length, 0, "Legal must link to the Overview policy card rather than repeat it.");

console.log(JSON.stringify({ status: "ok", scope: "static-routes", routes: routes.length, toolchainRows: renderedRows }));
