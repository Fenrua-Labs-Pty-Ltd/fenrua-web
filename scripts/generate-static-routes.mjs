import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "data", "toolchain-registry.json");
const registryRaw = readFileSync(registryPath, "utf8");
const registry = JSON.parse(registryRaw);
const registryHash = createHash("sha256").update(registryRaw).digest("hex");
const generatedDate = "2026-07-13";

const nav = [
  ["Overview", "/"],
  ["Architecture", "/architecture/"],
  ["Kernel", "/kernel/"],
  ["Utilities", "/utilities/"],
  ["Research", "/research/"],
  ["Verify", "/verify/"],
  ["Developers", "/developers/"],
  ["Toolchain", "/toolchain/"],
  ["Evidence", "/evidence/"],
  ["Status", "/status/"],
];

const evidenceRecords = [
  {
    id: "repository-sync-snapshot",
    artifact: "Repository Sync Snapshot",
    type: "kernel snapshot",
    claim: "Public kernel telemetry is pinned to an immutable source commit.",
    status: "active",
    maturity: "Read-only live",
    source: "kernel-status.js",
    hash: "390f7aeef778ce93db12e16028bc3a788b643c2d",
    sourceUrl: "https://github.com/fenrualabs/fenrua-kernel/commit/390f7aeef778ce93db12e16028bc3a788b643c2d",
    created: "2026-07-12",
    verified: "2026-07-12",
    environment: "public Git repository",
    sourceCommit: "390f7aeef778ce93db12e16028bc3a788b643c2d",
    evidenceCommit: "85ecc97c026b01b576d735501795951dd293b3ca",
    producer: "sync-kernel-status.mjs",
    toolchainSubset: "git, Node.js",
    command: "node scripts/test-kernel-telemetry.mjs",
    supersedes: "none",
    supersededBy: "none",
    revocationState: "active",
    limitation: "Snapshot evidence does not prove future revisions.",
  },
  {
    id: "frozen-evidence-revision",
    artifact: "Frozen Evidence Revision",
    type: "evidence commit",
    claim: "Genesis report source revision is separated from the sync snapshot.",
    status: "active",
    maturity: "Evidence surface",
    source: "kernel-status.js",
    hash: "85ecc97c026b01b576d735501795951dd293b3ca",
    sourceUrl: "https://github.com/fenrualabs/fenrua-kernel/commit/85ecc97c026b01b576d735501795951dd293b3ca",
    created: "2026-07-12",
    verified: "2026-07-12",
    environment: "public Git repository",
    sourceCommit: "390f7aeef778ce93db12e16028bc3a788b643c2d",
    evidenceCommit: "85ecc97c026b01b576d735501795951dd293b3ca",
    producer: "sync-kernel-status.mjs",
    toolchainSubset: "git, Node.js",
    command: "node scripts/test-kernel-telemetry.mjs",
    supersedes: "none",
    supersededBy: "none",
    revocationState: "active",
    limitation: "Scope is the public frozen report, not production runtime attestation.",
  },
  {
    id: "genesis-manifest-record",
    artifact: "Genesis Manifest Record",
    type: "manifest",
    claim: "Genesis manifest integrity is publicly linked.",
    status: "active",
    maturity: "Evidence surface",
    source: "kernel-status.js",
    hash: "bd9ec111888ec32e87a5b60776f0118973848e5c096bbed8f25246e7fd3008cd",
    sourceUrl: "https://github.com/fenrualabs/fenrua-kernel/blob/390f7aeef778ce93db12e16028bc3a788b643c2d/tests/genesis/reports/manifest.json",
    created: "2026-07-12",
    verified: "2026-07-12",
    environment: "public Git repository",
    sourceCommit: "390f7aeef778ce93db12e16028bc3a788b643c2d",
    evidenceCommit: "85ecc97c026b01b576d735501795951dd293b3ca",
    producer: "fenrua-kernel genesis report",
    toolchainSubset: "Node.js, native P/N521 tests",
    command: "node scripts/test-kernel-telemetry.mjs",
    supersedes: "none",
    supersededBy: "none",
    revocationState: "active",
    limitation: "Manifest scope is limited to listed genesis records.",
  },
  {
    id: "differential-validation",
    artifact: "Differential Validation",
    type: "validation report",
    claim: "Native and sanitizer differential campaigns passed for the published evidence revision.",
    status: "active",
    maturity: "Evidence surface",
    source: "kernel-status.js",
    hash: "e74a0ad32730f5129f3f691eb3c9caab31a98596212594d218056e50a1a26c93",
    sourceUrl: "https://github.com/fenrualabs/fenrua-kernel/blob/390f7aeef778ce93db12e16028bc3a788b643c2d/tests/audit/final-build-validation.json",
    created: "2026-07-12",
    verified: "2026-07-12",
    environment: "fenrua-kernel public audit artifact",
    sourceCommit: "390f7aeef778ce93db12e16028bc3a788b643c2d",
    evidenceCommit: "85ecc97c026b01b576d735501795951dd293b3ca",
    producer: "fenrua-kernel audit suite",
    toolchainSubset: "CMake, native tests, sanitizer differential tests",
    command: "node scripts/test-kernel-telemetry.mjs",
    supersedes: "none",
    supersededBy: "none",
    revocationState: "active",
    limitation: "Differential testing is not production certification.",
  },
  {
    id: "toolchain-evidence-lock",
    artifact: "Toolchain Evidence Lock",
    type: "toolchain registry",
    claim: "Detected tool versions are preserved to match the inspected evidence environment.",
    status: "active",
    maturity: "Read-only live",
    source: "data/toolchain-registry.json",
    hash: registryHash,
    sourceUrl: "/data/toolchain-registry.json",
    created: generatedDate,
    verified: generatedDate,
    environment: "fenrua-web public registry",
    sourceCommit: "845187ca3dea57723b31ec5306fed1c275fcdcb7",
    evidenceCommit: "toolchain-lock-2026-07-12",
    producer: "data/toolchain-registry.json",
    toolchainSubset: "Node.js, Semgrep 1.169.0, SnarkJS snarkjs@0.7.6",
    command: "node scripts/test-toolchain-registry.mjs",
    supersedes: "none",
    supersededBy: "none",
    revocationState: "active",
    limitation: "Version capture is not security proof.",
  },
];

const researchItems = [
  {
    slug: "pn521-cross-limb-borrow",
    title: "P/N521 Cross-Limb Borrow Regression",
    category: "Cryptography",
    primitive: "Integrity",
    claim: "A permanent regression fixture preserves the subtraction overflow boundary for P/N521 limb arithmetic.",
    nonClaim: "This does not prove production certification or all arithmetic invariants.",
    threat: "An optimization could reintroduce a cross-limb borrow defect.",
    invariant: "The regression fixture must remain bound by manifest and aggregate report hashes.",
    implementation: "fenrua-kernel regression fixture and generated regression report.",
    tooling: "Node.js validation, native differential tests, sanitizer differential tests, Git provenance.",
    commands: ["npm run validate", "node scripts/test-kernel-telemetry.mjs"],
    evidence: "regression_001_p521_sub_overflow.bin and pinned GitHub regression report.",
    regression: "regression-order-sub-cross-limb-borrow",
    supersession: "Active; not superseded.",
    maturity: "Evidence surface",
    limitations: "Browser does not replay binary fixture bytes; public page exposes hashes and pinned links.",
  },
  {
    slug: "toolchain-evidence-lock",
    title: "Toolchain Evidence Lock",
    category: "Evidence systems",
    primitive: "Evidence",
    claim: "Toolchain versions are published as detected and remain locked to the inspected evidence environment.",
    nonClaim: "The registry does not claim the newest possible version of every tool.",
    threat: "Post-evidence dependency drift can make public claims unreproducible.",
    invariant: "A public claim must refer to a tool version and evidence bundle that were captured together.",
    implementation: "data/toolchain-registry.json and docs/FENRUA_TOOLCHAIN_LOCK.md.",
    tooling: "Version commands, package inventory, Docker image inventory, registry validation.",
    commands: ["node scripts/test-toolchain-registry.mjs", "npm run validate"],
    evidence: `Registry SHA-256 ${registryHash}`,
    regression: "Toolchain registry test prevents Semgrep and SnarkJS drift.",
    supersession: "Active; future updates require a new frozen evidence bundle.",
    maturity: "Read-only live",
    limitations: "Version capture does not prove security findings.",
  },
  {
    slug: "read-only-chain-observation",
    title: "Read-Only Chain Observation Boundary",
    category: "Chain research",
    primitive: "Verification",
    claim: "Chain 978 and Chain N521 are exposed as sanitized read-only observations.",
    nonClaim: "A chain observation does not prove contract safety, bytecode identity, reserve state, or deployment correctness.",
    threat: "Public telemetry could be mistaken for contract assurance.",
    invariant: "No private endpoint, admin URL, RPC credential, or signing material appears in browser payloads.",
    implementation: "api/chain-progress.js and scripts/test-chain-progress.mjs.",
    tooling: "Node.js API test harness and sanitized response assertions.",
    commands: ["node scripts/test-chain-progress.mjs"],
    evidence: "chain-progress public-feed test output.",
    regression: "Query requests are rejected and endpoint fields are excluded.",
    supersession: "Active; contract evidence refresh remains pending.",
    maturity: "Read-only live",
    limitations: "No stale contract claims are derived from the feed.",
  },
];

const statusCards = [
  ["loading", "Loading", "Request started; verified status not yet available.", "Retry after the configured refresh interval."],
  ["success", "Success", "Source responded and supplied evidence within the freshness window.", "Next check follows normal cadence."],
  ["partial", "Partial", "Some required evidence is present but one or more declared checks remain incomplete.", "Retry with scoped confidence."],
  ["stale", "Stale", "Last evidence is older than the freshness policy.", "Retry and keep previous value labelled stale."],
  ["failure", "Failure", "Source failed or returned invalid evidence.", "Retry with backoff and fail closed for decisions."],
  ["paused", "Paused", "Source is intentionally paused.", "No automatic retry until pause is lifted."],
  ["maintenance", "Maintenance", "Source is undergoing maintenance.", "Retry after the published maintenance window."],
];

const verificationResults = [
  ["PASS", "All supplied checks passed.", "pass.example.json"],
  ["PASS_WITH_LIMITATIONS", "Checks passed but runtime or completeness limitations remain.", "pass-with-limitations.example.json"],
  ["INCOMPLETE", "Required manifest, policy, or evidence fields are missing.", "incomplete.example.json"],
  ["STALE", "Evidence is older than the accepted freshness policy.", "stale.example.json"],
  ["POLICY_VIOLATION", "Requested action violates policy.", "policy-violation.example.json"],
  ["INTEGRITY_MISMATCH", "Hash, build, source, or runtime value does not match.", "integrity-mismatch.example.json"],
  ["SIGNATURE_INVALID", "Signature could not be verified.", "signature-invalid.example.json"],
  ["RUNTIME_UNVERIFIED", "Runtime attestation was not supplied or accepted.", "runtime-unverified.example.json"],
  ["REVOKED", "Artifact, entity, or policy is revoked.", "revoked.example.json"],
  ["FAIL_CLOSED", "Verifier reached an unsafe or unsupported state.", "fail-closed.example.json"],
  ["UNSUPPORTED_SCHEMA", "Schema version is not supported.", "unsupported-schema.example.json"],
  ["ERROR", "Verifier failed unexpectedly.", "error.example.json"],
];

const legacyRoutes = [
  "nexus",
  "fenswap",
  "fenpresale",
  "wallet",
  "support",
  "legal",
  "privacy",
  "terms",
  "accessibility",
  "security",
];

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function attr(value) {
  return esc(value).replaceAll("'", "&#39;");
}

function statusBadge(value) {
  return `<span class="status-badge status-${attr(value.toLowerCase().replaceAll(" ", "-"))}">${esc(value)}</span>`;
}

function toolchainDisplayTags(tool) {
  const tags = [];
  const commands = tool.commands ?? [];
  const commandText = commands.join(" ");

  if (!tool.installed || tool.status === "UNAVAILABLE" || tool.installationMode === "unavailable") {
    tags.push("UNAVAILABLE");
  } else {
    tags.push("DETECTED");
  }

  if (tool.executed && /version|--version|-V|versions|list|show|image inspect|help/i.test(commandText)) {
    tags.push("VERSION_VERIFIED");
  }

  if (tool.executed && /--help|doctor|validate|node --check|npm run validate|test|scan|audit|compile|prove|verify/i.test(commandText)) {
    tags.push("SMOKE_TESTED");
  }

  if (tool.evidenceProduced) tags.push("EVIDENCE_PRODUCING");
  if ((tool.pipeline ?? []).some((pipeline) => !["version-inventory", "inventory", "website"].includes(pipeline))) {
    tags.push("CANONICAL_PIPELINE");
  }
  if (tool.status === "INSTALLED_EXPLORATORY" || tool.status === "NOT_IN_CANONICAL_PIPELINE") tags.push("EXPLORATORY");
  if (tool.status === "SUPERSEDED" || tool.status === "DEPRECATED") tags.push("SUPERSEDED");
  if (tool.status === "VERSION_REVIEW_REQUIRED") tags.push("VERSION_REVIEW_REQUIRED");
  if (tool.installationMode === "container") tags.push("CONTAINER_ONLY");
  if (tool.installationMode.includes("project-local")) tags.push("PROJECT_LOCAL");

  return [...new Set(tags)];
}

function countTools(predicate) {
  return registry.tools.filter(predicate).length;
}

function toolchainStats() {
  const tagCounts = new Map();
  for (const tool of registry.tools) {
    for (const tag of toolchainDisplayTags(tool)) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const semgrep = registry.tools.find((tool) => tool.tool === "Semgrep");
  return [
    ["Generated", registry.generatedAt],
    ["Registry SHA-256", registryHash],
    ["Records", registry.tools.length],
    ["Semgrep", semgrep?.detectedVersion ?? "not present"],
    ["Installed", countTools((tool) => tool.installed)],
    ["Version verified", tagCounts.get("VERSION_VERIFIED") ?? 0],
    ["Smoke tested", tagCounts.get("SMOKE_TESTED") ?? 0],
    ["Campaign executed", tagCounts.get("EVIDENCE_PRODUCING") ?? 0],
    ["Evidence producing", tagCounts.get("EVIDENCE_PRODUCING") ?? 0],
    ["Canonical pipeline", tagCounts.get("CANONICAL_PIPELINE") ?? 0],
    ["Container-only", countTools((tool) => tool.installationMode === "container")],
    ["Project-local", tagCounts.get("PROJECT_LOCAL") ?? 0],
    ["Superseded", tagCounts.get("SUPERSEDED") ?? 0],
    ["Version review required", tagCounts.get("VERSION_REVIEW_REQUIRED") ?? 0],
    ["Unavailable", tagCounts.get("UNAVAILABLE") ?? 0],
  ];
}

function evidenceCitation(record) {
  return `Fenrua Evidence:
Artifact: ${record.id}
Hash: ${record.hash}
Source revision: ${record.sourceCommit ?? "n/a"}
Evidence revision: ${record.evidenceCommit ?? "n/a"}
Verified: ${record.verified}
Scope: ${record.limitation}`;
}

function chainRail(className, label = "Live block updates") {
  return `<div class="${attr(className)}" aria-label="${attr(label)}">
        <article class="header-chain-card" data-chain-card="978">
          <div class="chain-card-top">
            <span>FENc978</span>
            <strong><i class="live-dot" aria-hidden="true"></i><span data-chain-field="978-status">Loading</span></strong>
          </div>
          <div class="header-chain-block">
            <span>Latest block</span>
            <strong data-chain-field="978-block">Loading</strong>
            <small data-chain-field="978-checked">loading</small>
            <small data-chain-field="978-source">Evidence source: loading</small>
            <small data-chain-field="978-confidence">Confidence: loading</small>
          </div>
          <div class="chain-progress-rail" aria-hidden="true"><i></i></div>
        </article>
        <article class="header-chain-card" data-chain-card="521">
          <div class="chain-card-top">
            <span>FENn521</span>
            <strong><i class="live-dot" aria-hidden="true"></i><span data-chain-field="521-status">Loading</span></strong>
          </div>
          <div class="header-chain-block">
            <span>Latest block</span>
            <strong data-chain-field="521-block">Loading</strong>
            <small data-chain-field="521-checked">loading</small>
            <small data-chain-field="521-source">Evidence source: loading</small>
            <small data-chain-field="521-confidence">Confidence: loading</small>
          </div>
          <div class="chain-progress-rail" aria-hidden="true"><i></i></div>
        </article>
        <span class="sr-only" data-chain-meta="feed-status">loading</span>
        <span class="sr-only" data-chain-meta="generated">loading</span>
        <span class="sr-only" data-chain-meta="countdown">loading</span>
        <span class="sr-only" data-chain-meta="announcer" role="status" aria-live="polite" aria-atomic="true"></span>
      </div>`;
}

function layout({ title, description, current, body, scripts = "", canonicalPath, headerLive = false, robots = "index,follow" }) {
  const canonical = canonicalPath ?? (current === "Overview" ? "/" : `/${current.toLowerCase()}/`);
  const navHtml = nav
    .map(([label, href]) => `<a href="${href}"${current === label ? ' aria-current="page"' : ""}>${label}</a>`)
    .join("\n        ");
  const headerClass = headerLive ? "site-header site-header-live" : "site-header";
  const headerRail = headerLive ? `\n      ${chainRail("header-chain-rail mobile-chain-rail")}` : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="description" content="${attr(description)}" />
    <meta name="robots" content="${attr(robots)}" />
    <meta name="theme-color" content="#0d0d0d" />
    <link rel="canonical" href="https://fenrua.ai${canonical}" />
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": "https://fenrua.ai/#organization",
        "name": "Fenrua Labs",
        "alternateName": "Fenrua",
        "url": "https://fenrua.ai/",
        "description": "Fenrua is building open Layer 0 AI security infrastructure with public evidence, maturity-labelled primitives, and reproducible verification records.",
        "sameAs": ["https://github.com/fenrualabs"]
      }
    </script>
    <title>${esc(title)}</title>
    <link rel="icon" href="/assets/sigil.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/styles.css" />
    ${scripts}
  </head>
  <body>
    <a class="skip-link" href="#content">Skip to content</a>
    <header class="${headerClass}" aria-label="Site header">
      <a class="brand" href="/" aria-label="Fenrua home">
        <img src="/assets/sigil.svg" width="40" height="40" alt="" />
        <span>
          <strong>Fenrua</strong>
          <small>Layer 0 AI security infrastructure</small>
        </span>
      </a>
      <nav class="site-nav" aria-label="Primary navigation">
        ${navHtml}
      </nav>${headerRail}
    </header>
    <main id="content">
${body}
    </main>
    <footer class="site-footer">
      <div>
        <strong>Fenrua Labs</strong>
        <span>Evidence-first, source-first, maturity-labelled infrastructure.</span>
      </div>
      <div class="footer-social">
        <p>Public claims are bounded by public evidence.</p>
        <div class="footer-links">
          <a href="/evidence/">Evidence</a>
          <a href="/toolchain/">Toolchain</a>
          <a href="/docs/FENRUA_LAYER0_WEBSITE_IMPLEMENTATION_REPORT.md">Implementation report</a>
          <a href="https://github.com/fenrualabs/fenrua-kernel">Kernel repository</a>
        </div>
      </div>
    </footer>
  </body>
</html>
`;
}

function routeHero(eyebrow, title, text, cta = "") {
  return `      <section class="route-hero" aria-labelledby="page-title">
        <p class="eyebrow">${esc(eyebrow)}</p>
        <h1 id="page-title">${esc(title)}</h1>
        <p>${esc(text)}</p>
        ${cta}
      </section>`;
}

function writeRoute(route, html) {
  const file = route === "" ? path.join(root, "index.html") : path.join(root, route, "index.html");
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function cardGrid(items) {
  return `<div class="route-grid">${items
    .map(
      (item) => `<article>
          <span>${esc(item.kicker)}</span>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.text)}</p>
          ${item.href ? `<a href="${item.href}">${esc(item.link ?? "Open")}</a>` : ""}
        </article>`
    )
    .join("\n        ")}</div>`;
}

function table(headers, rows, extraClass = "") {
  return `<div class="registry ${extraClass}" role="region" tabindex="0">
          <table>
            <thead><tr>${headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
            <tbody>
${rows.join("\n")}
            </tbody>
          </table>
        </div>`;
}

function chainProgressSection() {
  return `<section id="chain-progress" class="section-shell chain-progress desktop-chain-progress" aria-labelledby="chain-progress-title">
        <div class="section-heading">
          <p class="eyebrow">READ-ONLY LIVE OBSERVATION</p>
          <h2 id="chain-progress-title">Chain 978 + Chain N521</h2>
          <p>Live block observations are public status signals only. They do not prove contract safety, bytecode identity, reserve state, or deployment correctness.</p>
        </div>
        <div class="status-band" aria-label="Live chain feed status">
          <span>Feed <strong data-chain-meta="feed-status">loading</strong></span>
          <span>Generated <strong data-chain-meta="generated">loading</strong></span>
          <span>Refresh <strong data-chain-meta="countdown">loading</strong></span>
          <span class="sr-only" data-chain-meta="announcer" role="status" aria-live="polite" aria-atomic="true"></span>
        </div>
        <div class="chain-grid">
          <article class="chain-card" data-chain-card="978">
            <div class="chain-card-top">
              <span>FENc978</span>
              <strong><i class="live-dot" aria-hidden="true"></i><span data-chain-field="978-status">Loading</span></strong>
            </div>
            <h3>Chain 978</h3>
            <dl>
              <div><dt>Chain identity</dt><dd data-chain-field="978-chain-id">978 - pending</dd></div>
              <div><dt>Latest observed block</dt><dd data-chain-field="978-block">Loading</dd></div>
              <div><dt>Evidence source</dt><dd data-chain-field="978-source">loading</dd></div>
              <div><dt>Confidence</dt><dd data-chain-field="978-confidence">loading</dd></div>
              <div><dt>Observed</dt><dd data-chain-field="978-checked">loading</dd></div>
            </dl>
            <div class="chain-progress-meter" aria-label="Chain 978 next verification progress">
              <div class="chain-progress-meter-top">
                <span><i class="chain-progress-glyph" aria-hidden="true"></i>Next verification</span>
                <strong data-chain-field="978-progress">loading</strong>
              </div>
              <div class="chain-progress-rail" aria-hidden="true"><i></i></div>
            </div>
          </article>
          <article class="chain-card" data-chain-card="521">
            <div class="chain-card-top">
              <span>FENn521</span>
              <strong><i class="live-dot" aria-hidden="true"></i><span data-chain-field="521-status">Loading</span></strong>
            </div>
            <h3>Chain N521</h3>
            <dl>
              <div><dt>Chain identity</dt><dd data-chain-field="521-chain-id">521 - pending</dd></div>
              <div><dt>Latest observed block</dt><dd data-chain-field="521-block">Loading</dd></div>
              <div><dt>Evidence source</dt><dd data-chain-field="521-source">loading</dd></div>
              <div><dt>Confidence</dt><dd data-chain-field="521-confidence">loading</dd></div>
              <div><dt>Observed</dt><dd data-chain-field="521-checked">loading</dd></div>
            </dl>
            <div class="chain-progress-meter" aria-label="Chain N521 next verification progress">
              <div class="chain-progress-meter-top">
                <span><i class="chain-progress-glyph" aria-hidden="true"></i>Next verification</span>
                <strong data-chain-field="521-progress">loading</strong>
              </div>
              <div class="chain-progress-rail" aria-hidden="true"><i></i></div>
            </div>
          </article>
        </div>
      </section>`;
}

function home() {
  return layout({
    title: "Fenrua | Layer 0 AI Security Infrastructure",
    description: "Fenrua is the public evidence surface for the open security kernel beneath autonomous AI systems.",
    current: "Overview",
    scripts: '<script src="/kernel-status.js" defer></script>',
    headerLive: true,
    body: `${routeHero(
      "LAYER 0 AI SECURITY UTILITY INFRASTRUCTURE",
      "The security kernel beneath autonomous AI.",
      "Fenrua provides identity, authority, integrity, policy, evidence, verification, containment, and recovery primitives for AI agents, models, tools, runtimes, applications, chains, and infrastructure.",
      `<div class="cta-row"><a class="button button-primary" href="/architecture/">Explore architecture</a><a class="button button-secondary" href="/verify/">Verify locally</a><a class="button button-secondary" href="/toolchain/">Inspect toolchain</a></div>`
    )}
      ${chainProgressSection()}
      <section class="section-shell" aria-labelledby="home-answers">
        <div class="section-heading">
          <p class="eyebrow">FIVE-MINUTE ORIENTATION</p>
          <h2 id="home-answers">What reviewers need first</h2>
          <p>The homepage is intentionally a routing surface. Deep technical detail lives on dedicated pages so evidence, maturity, and limitations stay inspectable.</p>
        </div>
        ${cardGrid([
          { kicker: "WHAT", title: "Fenrua is a security substrate", text: "It is not a chatbot, marketplace, generic chain, wallet surface, or certification authority.", href: "/architecture/", link: "Architecture" },
          { kicker: "WHY LAYER 0", title: "It sits beneath AI execution", text: "Independent systems need identity, authority, integrity, policy, evidence, verification, containment, and recovery before autonomous execution can be trusted.", href: "/kernel/", link: "Kernel primitives" },
          { kicker: "TODAY", title: "Reference surfaces are public", text: "The website, evidence registry, toolchain lock, telemetry checks, and schema foundations are available with maturity labels.", href: "/status/", link: "Status" },
          { kicker: "EVIDENCE", title: "Claims are source-linked", text: "Every significant public claim points to a source, timestamp, maturity label, and limitation.", href: "/evidence/", link: "Evidence registry" },
          { kicker: "NEXT", title: "Developers start locally", text: "The verifier page and developer quick-start show the local workflow without pretending a live verifier exists.", href: "/developers/", link: "Quick start" },
        ])}
      </section>
      <section class="section-shell split-section" aria-labelledby="home-boundary">
        <div>
          <p class="eyebrow">NON-CLAIM</p>
          <h2 id="home-boundary">Evidence-lock integrity</h2>
          <p>Tool and dependency versions are preserved to match the inspected evidence environment. No post-evidence updates are implied.</p>
        </div>
        <div class="constraint-list">
          <p><strong>Semgrep:</strong> detected <code>1.169.0</code>.</p>
          <p><strong>SnarkJS:</strong> detected <code>0.7.6</code>; <code>1.13.8</code> is <code>underscore</code>.</p>
          <p><strong>Contract boundary:</strong> refreshed contract evidence is pending; no stale deployment claim is finalized.</p>
        </div>
      </section>`,
  });
}

function architecture() {
  return layout({
    title: "Fenrua Architecture",
    description: "Fenrua architecture, stack position, operating flows, and Layer 0 boundaries.",
    current: "Architecture",
    body: `${routeHero("OPERATING-SYSTEM MODEL", "Architecture", "Fenrua is organized as kernel space and user space, with stable machine-readable interfaces and public evidence boundaries.")}
      <section class="section-shell">
        <div class="stack-diagram" role="img" aria-label="Fenrua stack diagram">
          <span>USERS, OPERATORS, ORGANISATIONS</span>
          <span>AI APPLICATIONS AND WORKFLOWS</span>
          <span>AGENTS, MODELS, TOOLS, ORCHESTRATORS</span>
          <span>COMPUTE, DATA, APIS, CLOUD, CHAINS</span>
          <span>FENRUA USER-SPACE INTEGRATIONS</span>
          <strong>FENRUA SECURITY KERNEL</strong>
          <code>IDENTITY · AUTHORITY · INTEGRITY · POLICY · EVIDENCE · VERIFICATION · CONTAINMENT · RECOVERY</code>
        </div>
        ${cardGrid([
          { kicker: "01", title: "Pre-execution policy evaluation", text: "Entity, operator, environment, tool, and action are checked against authority policy." },
          { kicker: "02", title: "Tool-call authorization", text: "Allowed, denied, scoped, and human-approval actions are explicit." },
          { kicker: "03", title: "Runtime-integrity verification", text: "Source, build, lockfile, image, model, policy, and deployment manifests are compared." },
          { kicker: "04", title: "Evidence-bundle creation", text: "Inputs, outputs, decisions, commands, findings, hashes, and limitations become records." },
          { kicker: "05", title: "Revocation and quarantine", text: "Invalid, stale, drifted, revoked, or incomplete evidence fails closed." },
          { kicker: "06", title: "Research-to-kernel translation", text: "Research observations are promoted only through claims, non-claims, tests, evidence, utilities, and regressions." },
        ])}
      </section>`,
  });
}

function kernel() {
  return layout({
    title: "Fenrua Security Kernel",
    description: "Fenrua security kernel primitives, responsibilities, state transitions, and fail-closed behavior.",
    current: "Kernel",
    body: `${routeHero("KERNEL SPACE", "Security Kernel", "The kernel owns the security primitives beneath autonomous AI execution. Each primitive carries its own maturity label and evidence boundary.")}
      <section class="section-shell">
        ${cardGrid([
          { kicker: "Specification", title: "Identity", text: "AI entities, artifacts, builds, models, tools, operators, deployments, and evidence bundles." },
          { kicker: "Specification", title: "Authority", text: "Allow, deny, approval, scope, expiry, delegation, and revocation." },
          { kicker: "Reference", title: "Integrity", text: "Source, build, dependency, runtime image, policy, manifest, and environment comparisons." },
          { kicker: "Specification", title: "Policy", text: "Filesystem, network, tool, repository, secret, database, signing, deployment, and failure-mode controls." },
          { kicker: "Implemented surface", title: "Evidence", text: "Inputs, outputs, tool calls, decisions, builds, tests, findings, incidents, and recovery events." },
          { kicker: "Reference", title: "Verification", text: "Hashes, signatures, manifests, completeness, runtime conformity, audit scope, and release lineage." },
          { kicker: "Specification", title: "Containment", text: "Fail-closed behavior for missing, invalid, stale, drifted, revoked, or incomplete state." },
          { kicker: "Doctrine", title: "Recovery", text: "Revocation, quarantine, key rotation, rollback, evidence continuity, and controlled re-entry." },
        ])}
      </section>
      <section class="section-shell split-section">
        <div><p class="eyebrow">STATE TRANSITION</p><h2>Kernel lifecycle</h2></div>
        <pre><code>unregistered -> registered -> policy_bound -> evidence_required
-> verified_with_limitations -> active
-> revoked | quarantined | superseded -> recovered</code></pre>
      </section>`,
  });
}

function utilities() {
  const rows = [
    ["Fenrua Identity", "Bind entities and artifacts to manifests.", "Identity is not a security verdict.", "Specification"],
    ["Fenrua Authority", "Represent allowed, denied, and approval-gated actions.", "Enforcement depends on integration.", "Specification"],
    ["Fenrua Attest", "Create signed evidence bundles.", "Not external certification.", "Reference implementation"],
    ["Fenrua Verify", "Validate manifests, hashes, signatures, and completeness.", "Checks supplied artifacts only.", "Prototype foundation"],
    ["Fenrua Trace", "Preserve action, tool-call, approval, and incident lineage.", "Trace integrity, not prediction.", "Research"],
    ["Fenrua Gate", "Fail closed on unsafe execution state.", "Requires runtime adapter.", "Planned"],
    ["Fenrua Revoke", "Publish revocation and quarantine state.", "No live service claimed.", "Doctrine"],
    ["Fenrua Registry", "Anchor entity, evidence, and release state.", "Contract refresh pending.", "Research"],
  ].map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`);
  return layout({
    title: "Fenrua Utilities",
    description: "Fenrua utility catalogue with purpose, security boundaries, and maturity labels.",
    current: "Utilities",
    body: `${routeHero("USER SPACE", "Utilities", "Utilities adapt the kernel to developer workflows. No fake launch controls are exposed.")}
      <section class="section-shell">
        ${table(["Utility", "Purpose", "Boundary", "Maturity"], rows)}
      </section>`,
  });
}

function researchIndex() {
  const rows = researchItems.map(
    (item) => `<tr>
      <td><a href="/research/${item.slug}/">${esc(item.title)}</a><br><small>${esc(item.category)}</small></td>
      <td>${esc(item.claim)}</td>
      <td>${esc(item.nonClaim)}</td>
      <td>${esc(item.primitive)}</td>
      <td>${esc(item.maturity)}</td>
    </tr>`
  );
  return layout({
    title: "Fenrua Research Registry",
    description: "Fenrua research records with claims, non-claims, threats, tooling, evidence, and limitations.",
    current: "Research",
    body: `${routeHero("RESEARCH TO INFRASTRUCTURE", "Research Registry", "Research appears publicly only when its claim, non-claim, threat, invariant, evidence, tooling, maturity, and limitations are adjacent.")}
      <section class="section-shell">
        ${table(["Research", "Claim", "Non-Claim", "Primitive", "Maturity"], rows)}
      </section>`,
  });
}

function researchPage(item) {
  const recordId = `fenrua-research:${item.slug}`;
  const defaults = {
    date: item.slug === "toolchain-evidence-lock" ? generatedDate : "2026-07-12",
    sourceRevision: "390f7aeef778ce93db12e16028bc3a788b643c2d",
    evidenceRevision: item.slug === "toolchain-evidence-lock" ? registryHash : "85ecc97c026b01b576d735501795951dd293b3ca",
    severity: item.slug === "pn521-cross-limb-borrow" ? "High regression severity; evidence surface only" : "Public-trust boundary",
    problem: item.threat,
    assumptions: "Public page exposes only sanitized, source-linked evidence. Private endpoints, secrets, and raw witness material remain out of scope.",
    trigger: item.regression,
    rootCause: item.slug === "pn521-cross-limb-borrow"
      ? "Cross-limb borrow handling required permanent regression coverage."
      : "Public claims can drift when evidence, tooling, or telemetry are not adjacent to limitations.",
    referenceImplementation: item.implementation,
    toolsUsed: item.tooling,
    toolVersions: item.slug === "toolchain-evidence-lock"
      ? "See /data/toolchain-registry.json; Semgrep 1.169.0; SnarkJS snarkjs@0.7.6."
      : "Node.js v24.18.0 plus pinned fenrua-kernel evidence links.",
    results: item.evidence,
    evidenceConfirmation: item.slug === "read-only-chain-observation"
      ? "Browser payload states sanitized read-only observation only; it does not claim contract, bytecode, reserve, or deployment assurance."
      : "Review confidence is represented only where linked public evidence exists.",
    evidenceHash: item.slug === "toolchain-evidence-lock" ? registryHash : "See linked evidence artifact.",
    fixRevision: item.slug === "pn521-cross-limb-borrow" ? "390f7aeef778ce93db12e16028bc3a788b643c2d" : "Current website route generation.",
    regressionFixture: item.slug === "pn521-cross-limb-borrow" ? "regression_001_p521_sub_overflow.bin" : item.regression,
    kernelImpact: `${item.primitive} primitive boundary clarified.`,
    utilityImpact: "Public interface remains maturity-labelled and limitation-adjacent.",
    reproduction: item.commands.join("\n"),
  };
  const fields = [
    ["Record ID", recordId],
    ["Title", item.title],
    ["Category", item.category],
    ["Date", defaults.date],
    ["Source revision", defaults.sourceRevision],
    ["Evidence revision", defaults.evidenceRevision],
    ["Primitive affected", item.primitive],
    ["Maturity", item.maturity],
    ["Severity", defaults.severity],
    ["Problem statement", defaults.problem],
    ["Claim", item.claim],
    ["Non-claim", item.nonClaim],
    ["Assumptions", defaults.assumptions],
    ["Threat", item.threat],
    ["Invariant", item.invariant],
    ["Trigger", defaults.trigger],
    ["Root cause", defaults.rootCause],
    ["Reference implementation", defaults.referenceImplementation],
    ["Tools used", defaults.toolsUsed],
    ["Tool versions", defaults.toolVersions],
    ["Commands", item.commands.join("; ")],
    ["Results", defaults.results],
    ["Evidence confirmation", defaults.evidenceConfirmation],
    ["Evidence hash", defaults.evidenceHash],
    ["Fix revision", defaults.fixRevision],
    ["Regression fixture", defaults.regressionFixture],
    ["Kernel impact", defaults.kernelImpact],
    ["Utility impact", defaults.utilityImpact],
    ["Remaining limitations", item.limitations],
    ["Supersession", item.supersession],
    ["Reproduction instructions", defaults.reproduction],
  ].map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`);
  return layout({
    title: `${item.title} | Fenrua Research`,
    description: `${item.title} research record.`,
    current: "Research",
    canonicalPath: `/research/${item.slug}/`,
    body: `${routeHero("RESEARCH RECORD", item.title, `${item.category} · ${item.primitive}`)}
      <section class="section-shell">
        ${table(["Field", "Record"], fields)}
      </section>`,
  });
}

function verify() {
  const corpusRows = verificationResults.map(([code, meaning, file]) => `<tr>
      <td><code>${esc(code)}</code></td>
      <td>${esc(meaning)}</td>
      <td><a href="/examples/verification-results/${attr(file)}">${esc(file)}</a></td>
      <td>${code === "PASS" ? "Execution may continue within scope." : "Execution must pause, degrade, fail closed, or require review as declared in the fixture."}</td>
    </tr>`);
  return layout({
    title: "Fenrua Verify",
    description: "Fenrua public verifier foundation with examples, deterministic output, schemas, and local CLI flow.",
    current: "Verify",
    body: `${routeHero("PUBLIC VERIFIER FOUNDATION", "Verify", "No live server-side verifier is claimed. The public flow is local, deterministic, schema-first, and limitation-aware.")}
      <section class="section-shell split-section">
        <div>
          <p class="eyebrow">LOCAL CLI WALKTHROUGH</p>
          <h2>Run the current checks</h2>
          <p>Use the repository validation suite and schema examples. The example verifier output is deterministic and explicitly marks runtime attestation as unverified.</p>
        </div>
        <pre><code>npm run validate
node scripts/test-toolchain-registry.mjs

# Example artifacts
examples/entity-manifest.example.json
examples/authority-policy.example.json
examples/evidence-bundle.example.json
examples/verification-result.example.json</code></pre>
      </section>
      <section class="section-shell">
        <div class="doc-grid">
          <a href="/examples/entity-manifest.example.json">Entity manifest example</a>
          <a href="/examples/authority-policy.example.json">Authority policy example</a>
          <a href="/examples/evidence-bundle.example.json">Evidence bundle example</a>
          <a href="/examples/verification-result.example.json">Verification result example</a>
          <a href="/examples/verification-results/pass.example.json">PASS fixture</a>
          <a href="/examples/verification-results/fail-closed.example.json">FAIL_CLOSED fixture</a>
          <a href="/docs/FENRUA_ENTITY_MANIFEST_SPEC.md">Entity manifest schema</a>
          <a href="/docs/FENRUA_AUTHORITY_POLICY_SPEC.md">Authority policy schema</a>
          <a href="/docs/FENRUA_EVIDENCE_BUNDLE_SPEC.md">Evidence bundle schema</a>
          <a href="/docs/FENRUA_VERIFICATION_RESULT_SPEC.md">Verification result schema</a>
          <a href="/docs/FENRUA_VERIFY_RESULT_CORPUS.md">Result corpus report</a>
        </div>
      </section>
      <section class="section-shell split-section">
        <div><p class="eyebrow">DETERMINISTIC OUTPUT</p><h2>Example result</h2></div>
        <pre><code>{
  "result": "PASS_WITH_LIMITATIONS",
  "manifestSchema": "valid",
  "identity": "verified",
  "signatures": "verified",
  "artifactIntegrity": "verified",
  "policyIntegrity": "verified",
  "evidenceCompleteness": "partial",
  "runtimeConformity": "unverified",
  "revocationStatus": "active"
}</code></pre>
      </section>
      <section class="section-shell">
        ${table(["Code", "Meaning", "Fixture", "Safety consequence"], corpusRows)}
      </section>`,
  });
}

function developers() {
  return layout({
    title: "Fenrua Developers",
    description: "Fenrua developer quick-start, schemas, compatibility, versioning, and local verification flow.",
    current: "Developers",
    body: `${routeHero("TEN-MINUTE QUICK START", "Developers", "Start with the architecture, inspect schemas, run local validation, then map claims to evidence.")}
      <section class="section-shell">
        ${cardGrid([
          { kicker: "01", title: "Install", text: "Use Node 24 and the repository package manager. This website has no runtime package dependencies." },
          { kicker: "02", title: "Validate", text: "Run npm run validate to check static links, public discovery, chain API sanitization, kernel telemetry, and toolchain registry." },
          { kicker: "03", title: "Read schemas", text: "Entity manifest, authority policy, evidence bundle, and verification result specs are public.", href: "/verify/", link: "Schemas and examples" },
          { kicker: "04", title: "Inspect evidence", text: "Use the evidence registry and toolchain lock to connect claims to source, timestamp, maturity, and limitations.", href: "/evidence/", link: "Evidence" },
          { kicker: "05", title: "Respect compatibility", text: "Unsupported schema versions fail closed with UNSUPPORTED_SCHEMA rather than partial interpretation." },
          { kicker: "06", title: "Do not overclaim", text: "No SDK, live verifier, policy engine, runtime gate, or contract assurance is claimed until evidence exists." },
        ])}
      </section>
      <section class="section-shell split-section">
        <div><p class="eyebrow">COMMANDS</p><h2>Local baseline</h2></div>
        <pre><code>git clone https://github.com/fenrualabs/fenrua-web.git
cd fenrua-web
node --version  # v24 required
npm install
npm run validate
node scripts/test-toolchain-registry.mjs
node scripts/test-verify-examples.mjs</code></pre>
      </section>
      <section class="section-shell split-section">
        <div>
          <p class="eyebrow">REPRODUCTION PROOF</p>
          <h2>Expected result</h2>
          <p>A clean checkout should complete validation with static route, chain API sanitization, kernel telemetry, toolchain registry, and verify-corpus checks passing. The failing fixture is intentionally represented as <code>FAIL_CLOSED</code>.</p>
        </div>
        <div class="doc-grid">
          <a href="/docs/FENRUA_DEVELOPER_REPRODUCTION_REPORT.md">Developer reproduction report</a>
          <a href="/examples/verification-results/pass.example.json">Passing fixture</a>
          <a href="/examples/verification-results/fail-closed.example.json">Failing fixture</a>
        </div>
      </section>`,
  });
}

function evidence() {
  const rows = evidenceRecords.map(
    (record) => `<tr id="${attr(record.id)}">
      <td><code>${esc(record.id)}</code><br>${esc(record.artifact)}<br><small>${esc(record.type)}</small></td>
      <td>${esc(record.claim)}</td>
      <td><code>${esc(record.hash)}</code><button type="button" data-copy="${attr(record.hash)}">Copy hash</button></td>
      <td><a href="${attr(record.sourceUrl)}">${esc(record.source)}</a><br><small>${esc(record.environment)}</small></td>
      <td><code>${esc(record.sourceCommit)}</code><br><small>Evidence: <code>${esc(record.evidenceCommit)}</code></small></td>
      <td>${esc(record.producer)}<br><small>${esc(record.toolchainSubset)}</small></td>
      <td><code>${esc(record.command)}</code></td>
      <td>${esc(record.verified)}<br><small>Maturity: ${esc(record.maturity)} · Revocation: ${esc(record.revocationState)}</small></td>
      <td>${esc(record.supersedes)} / ${esc(record.supersededBy)}</td>
      <td>${esc(record.limitation)}<button type="button" data-copy="${attr(evidenceCitation(record))}">Copy citation</button></td>
    </tr>`
  );
  return layout({
    title: "Fenrua Evidence Registry",
    description: "Fenrua public evidence registry with claims, hashes, provenance, supersession, maturity, and limitations.",
    current: "Evidence",
    scripts: '<script src="/toolchain/toolchain.js" defer></script>',
    body: `${routeHero("PUBLIC EVIDENCE", "Evidence Registry", "Every significant claim is tied to source, timestamp, maturity, limitation, provenance, and copyable hash.")}
      <section class="section-shell">
        ${table(["Artifact", "Claim", "Hash", "Source", "Revisions", "Producer", "Command", "Verified / Revocation", "Supersession", "Limitation"], rows)}
      </section>`,
  });
}

function status() {
  const rows = [
    ["Homepage", "success", "Routing surface", "index.html", generatedDate, "static route validation", "npm run validate", "Live chain observations remain read-only public telemetry.", "Browser viewport matrix"],
    ["Architecture", "success", "Specification", "/architecture/", generatedDate, "static route validation", "npm run validate", "Architecture is descriptive, not a deployed control plane.", "Independent architecture review"],
    ["Kernel", "success", "Specification/reference mix", "/kernel/", generatedDate, "static route validation", "npm run validate", "Primitive maturity varies by row.", "Per-primitive evidence expansion"],
    ["Utilities", "success", "Catalogue", "/utilities/", generatedDate, "static route validation", "npm run validate", "No fake live utility service is claimed.", "SDK or CLI evidence"],
    ["Research registry", "success", "Evidence surface", "/research/", generatedDate, "static route validation", "npm run validate", "Dedicated pages expose current reproduction limits.", "Independent reproduction"],
    ["Verify examples", "partial", "Prototype foundation", "/verify/", generatedDate, "fixture corpus validation", "node scripts/test-verify-examples.mjs", "No hosted verifier or upload model exists.", "Real verifier implementation"],
    ["Developer quick start", "success", "Reproducibility guide", "/developers/", generatedDate, "clean checkout report", "npm run validate", "Node 24 required.", "Tagged release reproduction"],
    ["Toolchain registry", "success", "Read-only live", "data/toolchain-registry.json", generatedDate, "registry validation", "node scripts/test-toolchain-registry.mjs", "Version capture is not security proof.", "New frozen evidence bundle"],
    ["Evidence registry", "success", "Evidence surface", "/evidence/", generatedDate, "static route validation", "npm run validate", "Evidence provenance is scoped to public artifacts.", "External evidence review"],
    ["Chain 978 observation", "success", "Read-only live", "/api/chain-progress", "live", "10 second refresh, 60 second freshness", "node scripts/test-chain-progress.mjs", "Evidence-backed live observation; not contract, bytecode, reserve, or deployment assurance.", "Contract evidence refresh boundary"],
    ["Chain N521 observation", "success", "Read-only live", "/api/chain-progress", "live", "10 second refresh, 60 second freshness", "node scripts/test-chain-progress.mjs", "Evidence-backed live observation; not contract, bytecode, reserve, or deployment assurance.", "Contract evidence refresh boundary"],
    ["Contract evidence", "pending evidence", "Pending refreshed bundle", "docs/FENRUA_CONTRACT_EVIDENCE_REFRESH_BOUNDARY.md", generatedDate, "manual evidence gate", "none", "No current contract, bytecode, reserve, or deployment claim.", "Frozen contract evidence bundle"],
    ["Public repository", "success", "Source surface", "https://github.com/fenrualabs/fenrua-web", generatedDate, "git provenance", "git rev-parse HEAD", "Repository state changes after each deployment.", "Tagged release"],
    ["Schema set", "success", "Specification", "/docs/", generatedDate, "example corpus validation", "node scripts/test-verify-examples.mjs", "Schemas are examples/specifications, not a hosted validator.", "Schema validator package"],
  ].map(
    (r) => `<tr><td>${esc(r[0])}</td><td>${statusBadge(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td>${esc(r[5])}</td><td><code>${esc(r[6])}</code></td><td>${esc(r[7])}</td><td>${esc(r[8])}</td></tr>`
  );
  return layout({
    title: "Fenrua Status",
    description: "Fenrua status system with loading, success, partial, stale, failure, paused, and maintenance states.",
    current: "Status",
    body: `${routeHero("STATE SYSTEM", "Status", "Every telemetry widget must expose state, timestamp, source, retry behavior, and explanation.")}
      <section class="section-shell">
        <div class="toolchain-summary state-grid">
          ${statusCards
            .map(
              ([state, label, explanation, retry]) => `<article data-state="${attr(state)}">
                <span>${esc(state)}</span>
                <strong>${esc(label)}</strong>
                <p>${esc(explanation)}</p>
                <small>Source: status contract · Timestamp: ${generatedDate} · Retry: ${esc(retry)}</small>
              </article>`
            )
            .join("\n")}
        </div>
      </section>
      <section class="section-shell">
        ${table(["Component", "Operational state", "Maturity", "Source", "Timestamp", "Freshness policy", "Last successful check", "Current limitation", "Next evidence gate"], rows)}
      </section>`,
  });
}

function toolchain() {
  const tools = registry.tools;
  const rows = tools.map((tool, index) => {
    const tags = toolchainDisplayTags(tool);
    const search = [
      tool.tool,
      tool.detectedVersion,
      tool.category,
      tool.function,
      tool.installationMode,
      tool.status,
      ...tags,
      tool.limitations,
      ...(tool.pipeline ?? []),
      ...(tool.commands ?? []),
    ].join(" ");
    return `<tr data-tool-row data-page="${Math.floor(index / 25) + 1}" data-search="${attr(search.toLowerCase())}" data-status="${attr(tool.status)}" data-tags="${attr(tags.join(" "))}" data-mode="${attr(tool.installationMode)}" data-category="${attr(tool.category)}" data-installed="${tool.installed}" data-evidence="${tool.evidenceProduced}">
      <td>${esc(tool.tool)}<br><small>${esc(tool.function)}</small></td>
      <td><code>${esc(tool.detectedVersion)}</code><button type="button" data-copy="${attr(tool.detectedVersion)}">Copy version</button></td>
      <td>${esc(tool.category)}</td>
      <td>${esc(tool.installationMode)}</td>
      <td>${tags.map((tag) => `<span class="status-badge">${esc(tag)}</span>`).join("<br>")}</td>
      <td>${tool.evidenceProduced ? "yes" : "no"}<br><small>${esc(tool.evidencePath)}</small></td>
      <td>${(tool.commands ?? []).map((command) => `<code>${esc(command)}</code>`).join("<br>")}</td>
      <td>${esc(tool.limitations)}</td>
    </tr>`;
  });
  const categories = [...new Set(tools.map((tool) => tool.category))].sort();
  const statCards = toolchainStats()
    .map(([label, value]) => `<article>
          <span>${esc(label)}</span>
          <strong>${label === "Registry SHA-256" ? `<code>${esc(value)}</code>` : esc(value)}</strong>
        </article>`)
    .join("\n        ");
  return layout({
    title: "Fenrua Toolchain Registry",
    description: "Server-rendered Fenrua toolchain registry with exact detected versions, filters, pagination, downloads, timestamp, and integrity hash.",
    current: "Toolchain",
    scripts: '<script src="/toolchain/toolchain.js" defer></script>',
    body: `${routeHero("SERVER-RENDERED REGISTRY", "Toolchain", "The registry is useful before JavaScript runs. JavaScript only adds filtering, pagination, and copy controls.", `<div class="cta-row"><a class="button button-primary" href="/data/toolchain-registry.json">Download JSON</a><a class="button button-secondary" href="/docs/FENRUA_TOOLCHAIN_LOCK.md">Download Markdown lock</a></div>`)}
      <section class="section-shell">
        <div class="toolchain-meta toolchain-summary">
          ${statCards}
          <article>
            <span>Evidence-lock</span>
            <strong>no post-evidence updates</strong>
          </article>
        </div>
        <p class="table-note"><button type="button" data-copy="${attr(registryHash)}">Copy registry hash</button> The displayed taxonomy is derived from frozen registry fields. A version or list command is <strong>VERSION_VERIFIED</strong>, not campaign execution.</p>
      </section>
      <section class="section-shell">
        <div class="registry-tools toolchain-tools">
          <label for="tool-search">Search tools</label>
          <input id="tool-search" type="search" autocomplete="off" placeholder="Search tool, command, category, status, or limitation..." />
          <div class="filter-groups" aria-label="Toolchain filters">
            <button type="button" data-filter="all" aria-pressed="true">All</button>
            <button type="button" data-filter="detected">Detected</button>
            <button type="button" data-filter="version-verified">Version verified</button>
            <button type="button" data-filter="smoke-tested">Smoke tested</button>
            <button type="button" data-filter="campaign-executed">Campaign executed</button>
            <button type="button" data-filter="evidence">Evidence-producing</button>
            <button type="button" data-filter="canonical-pipeline">Canonical pipeline</button>
            <button type="button" data-filter="container">Container-only</button>
            <button type="button" data-filter="project-local">Project-local</button>
            <button type="button" data-filter="exploratory">Exploratory</button>
            <button type="button" data-filter="superseded">Superseded</button>
            <button type="button" data-filter="version-review">Version review required</button>
            <button type="button" data-filter="unavailable">Unavailable</button>
            ${categories.map((category) => `<button type="button" data-category-filter="${attr(category)}">${esc(category.replace(" and ", " & "))}</button>`).join("\n            ")}
          </div>
          <div class="pagination-controls" aria-label="Toolchain pagination">
            <button type="button" data-page-action="prev">Previous</button>
            <span data-page-status>Page 1</span>
            <button type="button" data-page-action="next">Next</button>
          </div>
        </div>
        ${table(["Tool", "Detected Version", "Category", "Mode", "Delivery Tags", "Evidence", "Command", "Limitations"], rows, "toolchain-table")}
        <p class="empty-state" id="toolchain-empty" hidden>No tools match the active filter.</p>
      </section>`,
  });
}

function legacyPage(route) {
  return layout({
    title: `Legacy Fenrua ${route} Route`,
    description: "Superseded Fenrua public route archive notice.",
    current: "Overview",
    canonicalPath: `/${route}/`,
    robots: "noindex,nofollow",
    body: `${routeHero("LEGACY / SUPERSEDED", "Legacy route", "This route belongs to a superseded Fenrua public estate and has no current applicability. The canonical current site is the Layer 0 AI Security Utility Infrastructure interface.")}
      <section class="section-shell split-section">
        <div>
          <p class="eyebrow">ROUTE CLASSIFICATION</p>
          <h2>${esc(route)}</h2>
          <p>This archive notice avoids silently presenting old Nexus, FENswap, presale, wallet, legal, support, accessibility, or security language as current.</p>
        </div>
        <div class="constraint-list">
          <p><strong>Classification:</strong> Legacy archive.</p>
          <p><strong>Superseded by:</strong> <a href="/">Current Fenrua Layer 0 overview</a>.</p>
          <p><strong>Current applicability:</strong> None.</p>
          <p><strong>Indexing:</strong> noindex, nofollow.</p>
          <p><strong>Legal boundary:</strong> This page does not create or replace final legal terms.</p>
        </div>
      </section>`,
  });
}

writeRoute("", home());
writeRoute("architecture", architecture());
writeRoute("kernel", kernel());
writeRoute("utilities", utilities());
writeRoute("research", researchIndex());
for (const item of researchItems) writeRoute(path.join("research", item.slug), researchPage(item));
writeRoute("verify", verify());
writeRoute("developers", developers());
writeRoute("evidence", evidence());
writeRoute("status", status());
writeRoute("toolchain", toolchain());
for (const route of legacyRoutes) writeRoute(route, legacyPage(route));

const sitemapRoutes = ["", "architecture", "kernel", "utilities", "research", ...researchItems.map((item) => `research/${item.slug}`), "verify", "developers", "toolchain", "evidence", "status"];
writeFileSync(
  path.join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes
  .map(
    (route) => `  <url>
    <loc>https://fenrua.ai/${route ? `${route}/` : ""}</loc>
    <lastmod>${generatedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`
);

console.log(
  JSON.stringify({
    status: "ok",
    routes: sitemapRoutes.length,
    tools: registry.tools.length,
    registryHash,
  })
);
