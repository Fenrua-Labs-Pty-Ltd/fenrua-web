import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "data", "toolchain-registry.json");
const siteEvidencePath = path.join(root, "data", "site-evidence.json");
const companyIdentityPath = path.join(root, "data", "company-identity.json");
const documentRegisterPath = path.join(root, "data", "public-document-register.json");
const kernelStatusPath = path.join(root, "kernel-status.js");
const publicModelPaths = {
  ontology: path.join(root, "data", "product-ontology.json"),
  capabilities: path.join(root, "data", "capability-register.json"),
  claims: path.join(root, "data", "claim-register.json"),
  evidence: path.join(root, "data", "evidence-taxonomy.json"),
  assurance: path.join(root, "data", "assurance-language.json"),
  services: path.join(root, "data", "public-service-catalogue.json"),
};
const registryRaw = readFileSync(registryPath, "utf8");
const registry = JSON.parse(registryRaw);
const registryHash = createHash("sha256").update(registryRaw).digest("hex");
const siteEvidenceRaw = readFileSync(siteEvidencePath, "utf8");
const siteEvidence = JSON.parse(siteEvidenceRaw);
const company = JSON.parse(readFileSync(companyIdentityPath, "utf8"));
const publicModel = Object.fromEntries(
  Object.entries(publicModelPaths).map(([key, file]) => [key, JSON.parse(readFileSync(file, "utf8"))])
);
const productOntology = publicModel.ontology;
const capabilityRegister = publicModel.capabilities;
const claimRegister = publicModel.claims;
const evidenceTaxonomy = publicModel.evidence;
const assuranceLanguage = publicModel.assurance;
const publicServiceCatalogue = publicModel.services;
if (
  !Array.isArray(productOntology.entities)
  || !Array.isArray(capabilityRegister.capabilities)
  || !Array.isArray(claimRegister.claims)
  || !Array.isArray(evidenceTaxonomy.classes)
  || !Array.isArray(evidenceTaxonomy.evidenceRecords)
  || !Array.isArray(assuranceLanguage.contracts)
  || !Array.isArray(publicServiceCatalogue.services)
) {
  throw new Error("The canonical public model must expose complete versioned arrays before routes are generated.");
}
const capabilitiesById = new Map(capabilityRegister.capabilities.map((capability) => [capability.id, capability]));
const claimsById = new Map(claimRegister.claims.map((claim) => [claim.id, claim]));
const evidenceById = new Map(evidenceTaxonomy.evidenceRecords.map((record) => [record.id, record]));
if (
  !Array.isArray(company.publicProfiles)
  || company.publicProfiles.length !== 3
  || !company.publicProfiles.every((profile) => (
    typeof profile.provider === "string"
    && typeof profile.label === "string"
    && typeof profile.url === "string"
    && profile.url.startsWith("https://")
  ))
) {
  throw new Error("data/company-identity.json must contain the three verified public profiles.");
}
const documentRegister = JSON.parse(readFileSync(documentRegisterPath, "utf8"));
const kernelStatusSource = readFileSync(kernelStatusPath, "utf8");
const kernelStatusMatch = kernelStatusSource.match(/\/\* KERNEL_STATUS_START \*\/\s*const kernelStatus = (\{[\s\S]*?\});\s*\/\* KERNEL_STATUS_END \*\//);
if (!kernelStatusMatch) throw new Error("kernel-status.js does not contain a parseable generated snapshot.");
const kernelStatus = JSON.parse(kernelStatusMatch[1]);
const kernelTelemetry = kernelStatus.telemetry;
if (!kernelTelemetry || !Array.isArray(kernelTelemetry.regressions)) throw new Error("kernel-status.js does not contain public regression metadata.");
const siteEvidenceHash = createHash("sha256").update(siteEvidenceRaw).digest("hex");
const generatedIso = siteEvidence.generatedAt;
if (typeof generatedIso !== "string" || !Number.isFinite(Date.parse(generatedIso))) {
  throw new Error("data/site-evidence.json must contain a valid generatedAt timestamp.");
}
const contentModifiedDate = siteEvidence.contentModifiedDate;
if (
  typeof contentModifiedDate !== "string"
  || !/^\d{4}-\d{2}-\d{2}$/.test(contentModifiedDate)
  || !Number.isFinite(Date.parse(`${contentModifiedDate}T00:00:00Z`))
) {
  throw new Error("data/site-evidence.json must contain a valid contentModifiedDate.");
}
if (
  !Array.isArray(siteEvidence.legalOperatingRecord?.offerings)
  || siteEvidence.legalOperatingRecord.offerings.length !== 7
  || !Array.isArray(siteEvidence.legalOperatingRecord.technologyScope)
  || !Array.isArray(siteEvidence.legalOperatingRecord.requestHandling)
) {
  throw new Error("data/site-evidence.json must contain the approved seven-row Legal operating record and supporting factual sections.");
}
const generatedDate = contentModifiedDate;
const checkMode = process.argv.includes("--check");
const staleGeneratedFiles = [];

function compactIdentifier(value) {
  return String(value).replaceAll(/\s/g, "");
}

function validAbn(value) {
  const digits = compactIdentifier(value).split("").map(Number);
  if (digits.length !== 11 || digits.some((digit) => !Number.isInteger(digit))) return false;
  digits[0] -= 1;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  return digits.reduce((sum, digit, index) => sum + digit * weights[index], 0) % 89 === 0;
}

function validAcn(value) {
  const digits = compactIdentifier(value).split("").map(Number);
  if (digits.length !== 9 || digits.some((digit) => !Number.isInteger(digit))) return false;
  const weighted = digits.slice(0, 8).reduce((sum, digit, index) => sum + digit * (8 - index), 0);
  return (10 - (weighted % 10)) % 10 === digits[8];
}

if (company.schemaVersion !== "fenrua.company-identity.v1" || !validAbn(company.abn) || !validAcn(company.acn)) {
  throw new Error("data/company-identity.json contains an invalid schema, ABN, or ACN.");
}

const kernelSnapshotDate = kernelTelemetry.sourceReport.reportGeneratedAtUtc.slice(0, 10);
const snapshotCommit = kernelTelemetry.snapshotCommit;
const evidenceRevision = kernelTelemetry.frozenEvidenceRevision;
const kernelEvidenceRecord = (artifact) => {
  const record = kernelStatus.evidence.find((item) => item.artifact === artifact);
  if (!record) throw new Error(`kernel-status.js is missing ${artifact}.`);
  return record;
};
const manifestRecord = kernelEvidenceRecord("Genesis Manifest Record");
const differentialRecord = kernelEvidenceRecord("Differential Validation");

const nav = [
  ["Platform", "/platform"],
  ["Developers", "/developers"],
  ["Research", "/research"],
  ["Trust", "/trust"],
  ["Operations", "/operations"],
  ["Company", "/company"],
];

const sectionNavigation = {
  Platform: [
    ["Platform overview", "/platform"],
    ["Architecture", "/architecture"],
    ["Security Kernel", "/kernel"],
    ["Utilities", "/utilities"],
    ["Deployment profiles", "/architecture/deployment"],
    ["Efficiency evidence", "/docs/FENRUA_AI_EFFICIENCY_EVIDENCE_STANDARD.md"],
  ],
  Developers: [
    ["Developers", "/developers"],
    ["Start", "/start"],
    ["Verify locally", "/verify"],
    ["Toolchain", "/toolchain"],
    ["Schemas and examples", "/verify"],
  ],
  Research: [
    ["Research registry", "/research"],
    ["P/N521", "/research/pn521-cross-limb-borrow"],
    ["Toolchain evidence lock", "/research/toolchain-evidence-lock"],
    ["Observation boundary", "/research/read-only-chain-observation"],
  ],
  Trust: [
    ["Trust overview", "/trust"],
    ["Claims", "/trust/claims"],
    ["Evidence classes", "/trust/evidence-classes"],
    ["Evidence", "/evidence"],
    ["Release verification", "/audit"],
    ["Security reporting", "/security"],
    ["Accessibility", "/accessibility"],
  ],
  Operations: [
    ["Operations overview", "/operations"],
    ["Status", "/status"],
    ["Signed observations", "/operations/observations"],
    ["Release records", "/audit"],
    ["Service catalogue", "/operations#service-catalogue"],
  ],
  Company: [
    ["Company overview", "/company"],
    ["Legal and company", "/legal"],
    ["Support", "/support"],
    ["Public data flow", "/docs/PUBLIC_DATA_FLOW.md"],
  ],
};

const routeLabels = {
  "": "Home",
  architecture: "Architecture",
  components: "Components",
  runtime: "Runtime",
  deployment: "Deployment",
  "trust-boundaries": "Trust boundaries",
  "data-and-provenance": "Data and provenance",
  recovery: "Recovery",
  evolution: "Evolution",
  developers: "Developers",
  evidence: "Evidence",
  "evidence-classes": "Evidence classes",
  audit: "Release verification",
  operations: "Operations",
  observations: "Signed observations",
  platform: "Platform",
  trust: "Trust",
  company: "Company",
  start: "Start",
  status: "Status",
  legal: "Legal and company",
  support: "Support",
  security: "Security reporting",
  accessibility: "Accessibility",
  verify: "Verify locally",
  toolchain: "Toolchain",
  utilities: "Utilities",
  kernel: "Security Kernel",
  research: "Research",
};

const evidenceRecords = [
  {
    id: "current-public-release-evidence",
    artifact: "Current Public Release Evidence",
    type: "static release scope",
    claim: "The current public static site is bound to a source commit and content-hashed artifact set at release build time.",
    status: "active",
    maturity: "Current public release",
    source: "data/site-evidence.json",
    hash: siteEvidenceHash,
    sourceUrl: "/data/site-evidence.json",
    created: generatedDate,
    verified: generatedDate,
    environment: "fenrua-web public static surface",
    sourceCommit: "generated at release build",
    evidenceCommit: "see /.well-known/fenrua-release.json",
    producer: "generate-release-manifest.mjs",
    toolchainSubset: "Node.js, deterministic static validation",
    command: "npm run build:release",
    supersedes: "legacy placeholder audit records",
    supersededBy: "none",
    revocationState: "active",
    limitation: "This evidence excludes dynamic observations, APIs, live block-card data, and all protected systems.",
  },
  {
    id: "repository-sync-snapshot",
    artifact: "Repository Sync Snapshot",
    type: "kernel snapshot",
    claim: "Published kernel evidence metadata is a point-in-time snapshot pinned to an immutable repository commit.",
    status: "active",
    maturity: "Historical public evidence",
    source: "kernel-status.js",
    hash: snapshotCommit,
    sourceUrl: kernelStatus.versionCommitUrl,
    created: kernelSnapshotDate,
    verified: kernelSnapshotDate,
    environment: "public Git repository",
    sourceCommit: snapshotCommit,
    evidenceCommit: evidenceRevision,
    producer: "sync-kernel-status.mjs",
    toolchainSubset: "git, Node.js",
    command: "node scripts/test-kernel-telemetry.mjs",
    supersedes: "none",
    supersededBy: "none",
    revocationState: "historical",
    limitation: "Point-in-time kernel artifact evidence for the named revisions. /audit covers the current website release artifact set only; it does not supersede, reproduce, or re-attest this kernel evidence.",
  },
  {
    id: "frozen-evidence-revision",
    artifact: "Frozen Evidence Revision",
    type: "evidence commit",
    claim: "Genesis report source revision is separated from the sync snapshot.",
    status: "active",
    maturity: "Historical public evidence",
    source: "kernel-status.js",
    hash: evidenceRevision,
    sourceUrl: kernelStatus.evidenceRevisionUrl,
    created: kernelSnapshotDate,
    verified: kernelSnapshotDate,
    environment: "public Git repository",
    sourceCommit: snapshotCommit,
    evidenceCommit: evidenceRevision,
    producer: "sync-kernel-status.mjs",
    toolchainSubset: "git, Node.js",
    command: "node scripts/test-kernel-telemetry.mjs",
    supersedes: "none",
    supersededBy: "none",
    revocationState: "historical",
    limitation: "Point-in-time kernel artifact evidence for the named revisions. /audit covers the current website release artifact set only; it does not supersede, reproduce, or re-attest this kernel evidence.",
  },
  {
    id: "genesis-manifest-record",
    artifact: "Genesis Manifest Record",
    type: "manifest",
    claim: "Genesis manifest integrity is publicly linked.",
    status: "active",
    maturity: "Historical public evidence",
    source: "kernel-status.js",
    hash: manifestRecord.copyValue,
    sourceUrl: manifestRecord.sourceUrl,
    created: kernelSnapshotDate,
    verified: kernelSnapshotDate,
    environment: "public Git repository",
    sourceCommit: snapshotCommit,
    evidenceCommit: evidenceRevision,
    producer: "fenrua-kernel genesis report",
    toolchainSubset: "Node.js, native P/N521 tests",
    command: "node scripts/test-kernel-telemetry.mjs",
    supersedes: "none",
    supersededBy: "none",
    revocationState: "historical",
    limitation: "Point-in-time kernel artifact evidence for the named revisions. /audit covers the current website release artifact set only; it does not supersede, reproduce, or re-attest this kernel evidence.",
  },
  {
    id: "differential-validation",
    artifact: "Differential Validation",
    type: "validation report",
    claim: "Native and sanitizer differential campaigns passed for the published evidence revision.",
    status: "active",
    maturity: "Historical public evidence",
    source: "kernel-status.js",
    hash: differentialRecord.copyValue,
    sourceUrl: differentialRecord.sourceUrl,
    created: kernelSnapshotDate,
    verified: kernelSnapshotDate,
    environment: "fenrua-kernel public audit artifact",
    sourceCommit: snapshotCommit,
    evidenceCommit: evidenceRevision,
    producer: "fenrua-kernel audit suite",
    toolchainSubset: "CMake, native tests, sanitizer differential tests",
    command: "node scripts/test-kernel-telemetry.mjs",
    supersedes: "none",
    supersededBy: "none",
    revocationState: "historical",
    limitation: "Point-in-time kernel artifact evidence for the named revisions. /audit covers the current website release artifact set only; it does not supersede, reproduce, or re-attest this kernel evidence.",
  },
  {
    id: "toolchain-evidence-lock",
    artifact: "Toolchain Evidence Lock",
    type: "toolchain registry",
    claim: "Detected tool versions are preserved to match the inspected evidence environment.",
    status: "historical",
    maturity: "Historical toolchain evidence",
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
    revocationState: "historical",
    limitation: "Frozen toolchain capture; it is not current deployment provenance or security proof.",
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
    maturity: "Frozen point-in-time evidence",
    limitations: "Version capture does not prove security findings.",
  },
  {
    slug: "read-only-chain-observation",
    title: "Read-Only Chain Observation Boundary",
    category: "Chain research",
    primitive: "Verification",
    claim: "Chain 978 and Chain N521 can be exposed only as independently signed, bounded read-only observations.",
    nonClaim: "A chain observation does not prove contract safety, bytecode identity, reserve state, or deployment correctness.",
    threat: "Public telemetry could be mistaken for contract assurance.",
    invariant: "No private endpoint, admin URL, RPC credential, peer detail, validator identity, or signing key appears in browser payloads.",
    implementation: "api/chain-progress.js, fixed per-chain observation-key endpoints, and scripts/test-chain-progress.mjs.",
    tooling: "Node.js API test harness and sanitized response assertions.",
    commands: ["node scripts/test-chain-progress.mjs"],
    evidence: "chain-progress public-feed test output.",
    regression: "Query requests are rejected, private topology fields are excluded, and only the bounded observation schema is accepted.",
    supersession: "Active; bounded observations remain separate from public release evidence.",
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

const statusPlanes = [
  ["Publication status", "Static release commits, artifact manifests, and release verification records.", "/audit"],
  ["Platform service health", "Only measured deployed services belong here. No unmeasured specification is presented as health.", "/operations#service-catalogue"],
  ["Dependency health", "Only a measured dependency can receive a current state. The public source currently publishes no generic dependency-health dashboard.", "/operations"],
  ["Signed external observation status", "Bounded signed observation state is visible only after its independent verification contract succeeds.", "/status"],
  ["Security incident status", "No public incident history is fabricated. Private security reporting has its own scoped handling boundary.", "/security"],
  ["Maintenance and change status", "Release and rollback changes are controlled through source-bound records and owner-authorised hosting actions.", "/audit"],
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

function assuranceScope(mode, claimIds, content) {
  const ids = Array.isArray(claimIds) ? claimIds : [];
  if (mode === "claims") {
    if (ids.length === 0) throw new Error("A claim-bound assurance scope must name at least one claim.");
    for (const id of ids) {
      if (!claimsById.has(id)) throw new Error(`Assurance scope references unknown claim ${id}.`);
    }
  } else if (mode === "capability") {
    if (ids.length !== 1) throw new Error("A capability assurance scope must name exactly one capability.");
    if (!capabilitiesById.has(ids[0])) throw new Error(`Assurance scope references unknown capability ${ids[0]}.`);
  } else if (mode === "taxonomy") {
    if (ids.length > 0) throw new Error("An assurance taxonomy scope cannot name claims.");
  } else {
    throw new Error(`Unsupported assurance scope mode ${mode}.`);
  }
  return `<!-- fenrua-assurance-scope:${mode}:${ids.join(",") || "-"}:start -->${content}<!-- fenrua-assurance-scope:end -->`;
}

function copyAttr(value) {
  return attr(value).replaceAll("\n", "&#10;");
}

function statusBadge(value, label = value) {
  return `<span class="status-badge status-${attr(value.toLowerCase().replaceAll(" ", "-"))}">${esc(label)}</span>`;
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
  if (hasExecutedCampaign(tool)) tags.push("CAMPAIGN_EXECUTED");
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

function hasExecutedCampaign(tool) {
  if (!tool.executed || !tool.evidenceProduced) return false;
  return (tool.commands ?? []).some((command) => /(?:npm run (?:validate|test(?::[\w-]+)?))|(?:node scripts\/(?:check|test)-[\w-]+\.mjs)|(?:playwright test)/i.test(command));
}

function toolchainEvidenceLinks(tool) {
  if (!tool.evidenceProduced) return `<small>No evidence-producing record is declared for this tool.</small>`;
  const sourceRevision = evidenceRecords.find((record) => record.id === "toolchain-evidence-lock")?.sourceCommit ?? "not recorded";
  const campaign = hasExecutedCampaign(tool)
    ? (tool.commands ?? []).filter((command) => /validate|test|check/i.test(command)).join(" · ")
    : "No validation campaign is declared by the frozen record.";
  return `<div class="tool-evidence-links">
        <p><strong>Campaign:</strong> <code>${esc(campaign)}</code></p>
        <p><strong>Artifact:</strong> <a href="/data/toolchain-registry.json">Frozen registry entry</a> · <small>${esc(tool.evidencePath)}</small></p>
        <p><strong>Claim:</strong> <a href="/trust/claims#claim-toolchain-version-capture">Toolchain version-capture boundary</a></p>
        <p><strong>Source revision:</strong> <a href="/evidence#toolchain-evidence-lock"><code>${esc(sourceRevision)}</code></a></p>
        <p><strong>Limitation:</strong> ${esc(tool.limitations)}</p>
      </div>`;
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
    ["Evidence producing", tagCounts.get("EVIDENCE_PRODUCING") ?? 0],
    ["Campaign executed", tagCounts.get("CAMPAIGN_EXECUTED") ?? 0],
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
            <strong><i class="live-dot" aria-hidden="true"></i><span data-chain-field="978-status">Awaiting signed observation</span></strong>
          </div>
          <div class="header-chain-block">
            <span>Latest block</span>
            <strong data-chain-field="978-block">No current observation</strong>
            <small data-chain-field="978-checked">No current signed observation</small>
            <small data-chain-field="978-source">Evidence source: not asserted in static output</small>
            <small data-chain-field="978-activity">Signed activity: not asserted in static output</small>
          </div>
          <div class="chain-progress-rail" aria-hidden="true"><i></i></div>
        </article>
        <article class="header-chain-card" data-chain-card="521">
          <div class="chain-card-top">
            <span>FENn521</span>
            <strong><i class="live-dot" aria-hidden="true"></i><span data-chain-field="521-status">Awaiting signed observation</span></strong>
          </div>
          <div class="header-chain-block">
            <span>Latest block</span>
            <strong data-chain-field="521-block">No current observation</strong>
            <small data-chain-field="521-checked">No current signed observation</small>
            <small data-chain-field="521-source">Evidence source: not asserted in static output</small>
            <small data-chain-field="521-activity">Signed activity: not asserted in static output</small>
          </div>
          <div class="chain-progress-rail" aria-hidden="true"><i></i></div>
        </article>
        <span class="sr-only" data-chain-meta="feed-status">awaiting signed observation</span>
        <span class="sr-only" data-chain-meta="generated">no current observation asserted</span>
        <span class="sr-only" data-chain-meta="countdown">no refresh without JavaScript</span>
      </div>`;
}

function commercialBoundarySection() {
  const boundary = siteEvidence.commercialBoundary;
  if (!boundary || !Array.isArray(boundary.paragraphs)) throw new Error("site-evidence.json must define commercialBoundary paragraphs.");
  return `      <section class="section-shell split-section commercial-boundary" aria-labelledby="commercial-boundary-title">
        <div>
          <p class="eyebrow">ACCESS-ONLY SERVICES</p>
          <h2 id="commercial-boundary-title">${esc(boundary.title)}</h2>
        </div>
        <div class="constraint-list">
          ${boundary.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("\n          ")}
          <p><a href="/docs/ACCESS_ONLY_COMMERCIAL_BOUNDARY.md">Read the public service and agreement boundary</a>.</p>
        </div>
      </section>`;
}

const organizationJsonLd = JSON.stringify(
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://fenrua.ai/#organization",
    name: company.legalName,
    legalName: company.legalName,
    alternateName: [company.displayName, "Fenrua"],
    url: "https://fenrua.ai/",
    logo: "https://fenrua.ai/assets/fenrua-header-logo.jpg",
    foundingDate: company.registrationDate,
    taxID: `ABN ${company.abn}`,
    identifier: [
      { "@type": "PropertyValue", propertyID: "ABN", value: company.abn },
      { "@type": "PropertyValue", propertyID: "ACN", value: company.acn },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: company.registeredOffice.locality,
      addressRegion: company.registeredOffice.region,
      postalCode: company.registeredOffice.postalCode,
      addressCountry: company.registeredOffice.country,
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "business enquiries",
      email: company.publicContact,
    },
    description: "Fenrua Labs researches, develops, and provides AI efficiency infrastructure software and related technology services.",
    sameAs: company.publicProfiles.map((profile) => profile.url),
  },
  null,
  2
).replaceAll("<", "\\u003c");

function pageDiscoveryJsonLd({ title, description, canonical, current }) {
  const pageUrl = `https://fenrua.ai${canonical}`;
  const segments = canonical.split("/").filter(Boolean);
  const breadcrumbs = [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://fenrua.ai/" },
    ...segments.map((segment, index) => ({
      "@type": "ListItem",
      position: index + 2,
      name:
        index === segments.length - 1
          ? current
          : segment.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      item: `https://fenrua.ai/${segments.slice(0, index + 1).join("/")}`,
    })),
  ];
  const graph = [
    {
      "@type": "WebSite",
      "@id": "https://fenrua.ai/#website",
      url: "https://fenrua.ai/",
      name: "Fenrua",
      inLanguage: "en-AU",
      publisher: { "@id": "https://fenrua.ai/#organization" },
    },
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
      description,
      inLanguage: "en-AU",
      dateModified: contentModifiedDate,
      isPartOf: { "@id": "https://fenrua.ai/#website" },
      about: { "@id": "https://fenrua.ai/#organization" },
      breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: breadcrumbs,
    },
  ];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2).replaceAll("<", "\\u003c");
}

function sectionForCurrent(current) {
  if (["Architecture", "Kernel", "Utilities"].includes(current)) return "Platform";
  if (["Developers", "Verify", "Toolchain"].includes(current)) return "Developers";
  if (current === "Research") return "Research";
  if (["Evidence", "Audit", "Security", "Accessibility"].includes(current)) return "Trust";
  if (current === "Status") return "Operations";
  if (["Legal", "Support"].includes(current)) return "Company";
  return null;
}

function breadcrumbNavigation(canonical, current) {
  if (canonical === "/") return "";
  const segments = canonical.split("/").filter(Boolean);
  const crumbs = [
    ["Home", "/"],
    ...segments.map((segment, index) => {
      const isCurrent = index === segments.length - 1;
      const label = isCurrent ? current : (routeLabels[segment] ?? segment.replaceAll("-", " "));
      return [label, `/${segments.slice(0, index + 1).join("/")}`];
    }),
  ];
  return `      <nav class="breadcrumb-nav" aria-label="Breadcrumb">
        <ol>
          ${crumbs.map(([label, href], index) => index === crumbs.length - 1
            ? `<li aria-current="page">${esc(label)}</li>`
            : `<li><a href="${attr(href)}">${esc(label)}</a></li>`).join("\n          ")}
        </ol>
      </nav>`;
}

function localNavigation(section, canonical) {
  const links = section ? sectionNavigation[section] : null;
  if (!links) return "";
  return `      <nav class="section-nav" aria-label="${attr(`${section} section`)}">
        <span>${esc(section)}</span>
        <div>
          ${links.map(([label, href]) => {
            const isCurrent = href.split("#")[0] === canonical;
            return `<a href="${attr(href)}"${isCurrent ? ' aria-current="page"' : ""}>${esc(label)}</a>`;
          }).join("\n          ")}
        </div>
      </nav>`;
}

function layout({ title, description, current, body, scripts = "", canonicalPath, section = sectionForCurrent(current), headerLive = false, robots = "index,follow" }) {
  const canonical = canonicalPath ?? (current === "Overview" ? "/" : `/${current.toLowerCase()}`);
  const canonicalUrl = `https://fenrua.ai${canonical}`;
  const searchDirectives = robots.includes("noindex")
    ? robots
    : `${robots},max-snippet:-1,max-image-preview:large,max-video-preview:-1`;
  const navHtml = nav
    .map(([label, href]) => `<a href="${href}"${section === label ? ' aria-current="page"' : ""}>${label}</a>`)
    .join("\n        ");
  const headerClass = headerLive ? "site-header site-header-live" : "site-header";
  const headerRail = headerLive
    ? `\n      ${chainRail("header-chain-rail mobile-chain-rail", "Live block updates")}`
    : "";
  const liveAnnouncer = headerLive && current !== "Status"
    ? '<span class="sr-only" data-chain-meta="announcer" role="status" aria-live="polite" aria-atomic="true"></span>'
    : "";
  const pageScripts = [
    headerLive ? '<script src="/kernel-status.js" defer></script>' : "",
    scripts,
  ].filter(Boolean).join("\n    ");
  return `<!doctype html>
<html lang="en-AU">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="description" content="${attr(description)}" />
    <meta name="robots" content="${attr(robots)}" />
    <meta name="googlebot" content="${attr(searchDirectives)}" />
    <meta name="bingbot" content="${attr(searchDirectives)}" />
    <meta name="theme-color" content="#0d0d0d" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="en_AU" />
    <meta property="og:site_name" content="Fenrua" />
    <meta property="og:title" content="${attr(title)}" />
    <meta property="og:description" content="${attr(description)}" />
    <meta property="og:url" content="${attr(canonicalUrl)}" />
    <meta property="og:image" content="https://fenrua.ai/assets/fenrua-header-logo.jpg" />
    <meta property="og:image:alt" content="Fenrua logo" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${attr(title)}" />
    <meta name="twitter:description" content="${attr(description)}" />
    <meta name="twitter:image" content="https://fenrua.ai/assets/fenrua-header-logo.jpg" />
    <meta name="twitter:image:alt" content="Fenrua logo" />
    <link rel="canonical" href="${attr(canonicalUrl)}" />
    <link rel="alternate" hreflang="en-AU" href="${attr(canonicalUrl)}" />
    <link rel="alternate" hreflang="x-default" href="${attr(canonicalUrl)}" />
    <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
    <script type="application/ld+json">${organizationJsonLd}</script>
    <script type="application/ld+json">${pageDiscoveryJsonLd({ title, description, canonical, current })}</script>
    <title>${esc(title)}</title>
    <link rel="icon" href="/assets/fenrua-header-logo.jpg" type="image/jpeg" />
    <link rel="stylesheet" href="/styles.css" />
    <script src="/technical-data.js" defer></script>
${pageScripts ? `    ${pageScripts}\n` : ""}
  </head>
  <body>
    <a class="skip-link" href="#content">Skip to content</a>
    <span class="sr-only" data-copy-announcer role="status" aria-live="polite" aria-atomic="true"></span>
    ${liveAnnouncer}
    <header class="${headerClass}" aria-label="Site header">
      <a class="brand" href="/" aria-label="Fenrua Protocol home">
        <img src="/assets/fenrua-header-logo.jpg" width="40" height="40" alt="" />
        <span>
          <strong>Fenrua Protocol</strong>
          <small>by Fenrua Labs Pty Ltd</small>
        </span>
      </a>
      <nav class="site-nav" aria-label="Primary navigation">
        ${navHtml}
      </nav>${headerRail}
    </header>
    <main id="content">
${breadcrumbNavigation(canonical, current)}
${localNavigation(section, canonical)}
${body}
    </main>
    <footer class="site-footer">
      <div>
        <strong>${esc(company.legalName)}</strong>
        <span>ABN ${esc(company.abn)} · ACN ${esc(company.acn)}</span>
        <span>Evidence-first, source-first, maturity-labelled infrastructure.</span>
      </div>
      <div class="footer-social">
        <p>Business enquiries: <a href="mailto:${attr(company.publicContact)}">${esc(company.publicContact)}</a></p>
        <div class="footer-links" aria-label="Company links and verified public profiles">
          <a href="/company">Company</a>
          <a href="/#commercial-boundary-title">Service boundary</a>
          ${company.publicProfiles.map((profile) => `<a href="${attr(profile.url)}" rel="me">${esc(profile.label)}</a>`).join("\n          ")}
          <a href="/audit">Release verification</a>
          <a href="/evidence">Evidence</a>
          <a href="/toolchain">Toolchain</a>
          <a href="/.well-known/fenrua-release.json">Release manifest</a>
          <a href="https://github.com/fenrualabs/fenrua-kernel">Kernel repository</a>
        </div>
      </div>
    </footer>
  </body>
</html>
`;
}

function routeHero(eyebrow, title, text, cta = "") {
  return `      <section class="route-hero route-hero-solo" aria-labelledby="page-title">
        <div class="route-hero-copy">
          <p class="eyebrow">${esc(eyebrow)}</p>
          <h1 id="page-title">${esc(title)}</h1>
          <p>${esc(text)}</p>
          ${cta}
        </div>
      </section>`;
}

function displayDate(value) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`)
  );
}

function writeGenerated(file, contents) {
  const normalized = contents.replace(/[ \t]+$/gm, "");
  if (checkMode) {
    if (!existsSync(file) || readFileSync(file, "utf8") !== normalized) staleGeneratedFiles.push(path.relative(root, file));
    return;
  }
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, normalized);
}

function writeRoute(route, html) {
  const file = route === "" ? path.join(root, "index.html") : path.join(root, route, "index.html");
  writeGenerated(file, html);
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

function modelDownloads() {
  const records = [
    ["Product ontology", "/data/product-ontology.json"],
    ["Capability register", "/data/capability-register.json"],
    ["Claim register", "/data/claim-register.json"],
    ["Evidence taxonomy", "/data/evidence-taxonomy.json"],
    ["Assurance language contract", "/data/assurance-language.json"],
    ["Public service catalogue", "/data/public-service-catalogue.json"],
  ];
  return `<div class="doc-grid model-downloads" aria-label="Machine-readable public records">
          ${records.map(([label, href]) => `<a href="${href}">${esc(label)} JSON</a>`).join("\n          ")}
        </div>`;
}

function capabilityCards(capabilityIds, routeById = {}) {
  return cardGrid(capabilityIds.map((id) => {
    const capability = capabilitiesById.get(id);
    if (!capability) throw new Error(`Unknown capability requested by a public route: ${id}`);
    return {
      kicker: `${capability.maturity} · ${capability.availability}`,
      title: capability.name,
      text: `${capability.summary} Limitation: ${capability.limitations[0]}`,
      href: routeById[id],
      link: routeById[id] ? "Inspect boundary" : undefined,
    };
  }));
}

function capabilityRecord(capability) {
  const claimLinks = capability.claimIds.length
    ? capability.claimIds.map((id) => {
      const claim = claimsById.get(id);
      return claim ? `<a href="/trust/claims#${attr(claim.anchor)}">${esc(id)}</a>` : `<code>${esc(id)}</code>`;
    }).join(", ")
    : "No current public claims are recorded.";
  return assuranceScope("capability", [capability.id], `<article class="capability-record" id="${attr(capability.id)}" data-capability-id="${attr(capability.id)}">
          <div class="capability-record-heading">
            <div><span>${esc(capability.category)}</span><h3>${esc(capability.name)}</h3></div>
            <p>${esc(capability.maturity)} · ${esc(capability.availability)}</p>
          </div>
          <p>${esc(capability.summary)}</p>
          <dl>
            <div><dt>Lifecycle</dt><dd>${esc(capability.lifecycle)}</dd></div>
            <div><dt>Owner</dt><dd>${esc(capability.owner)}</dd></div>
            <div><dt>Review date</dt><dd>${esc(capability.lastReviewed)}</dd></div>
            <div><dt>Claims</dt><dd>${claimLinks}</dd></div>
          </dl>
          <p><strong>Limitation:</strong> ${esc(capability.limitations[0])}</p>
          <p><strong>Non-claim:</strong> ${esc(capability.nonClaims[0])}</p>
          <p><strong>Promotion gate:</strong> ${esc(capability.promotionGate)}</p>
        </article>`);
}

function claimRecord(claim) {
  const capability = capabilitiesById.get(claim.subjectId);
  if (!capability) throw new Error(`Claim ${claim.id} has no known capability.`);
  const evidenceLinks = claim.evidenceIds.map((id) => {
    const evidence = evidenceById.get(id);
    return evidence
      ? `<a href="/data/evidence-taxonomy.json"><code>${esc(id)}</code></a>`
      : `<code>${esc(id)}</code>`;
  }).join(", ");
  return assuranceScope("claims", [claim.id], `<article class="claim-record" id="${attr(claim.anchor)}" data-claim-id="${attr(claim.id)}" data-claim-record data-claim-search="${attr(`${claim.statement} ${capability.name} ${claim.assuranceVerb} ${claim.evidenceClass}`.toLowerCase())}">
          <div class="claim-record-heading">
            <p><code>${esc(claim.id)}</code></p>
            <span>${esc(claim.assertionState)}</span>
          </div>
          <h3>${esc(claim.statement)}</h3>
          <dl>
            <div><dt>Capability</dt><dd><a href="#${attr(capability.id)}">${esc(capability.name)}</a></dd></div>
            <div><dt>Maturity</dt><dd>${esc(capability.maturity)} · ${esc(capability.availability)}</dd></div>
            <div><dt>Assurance verb</dt><dd>${esc(claim.assuranceVerb)}</dd></div>
            <div><dt>Evidence class</dt><dd>${esc(claim.evidenceClass)}</dd></div>
            <div><dt>Valid from</dt><dd>${esc(claim.validFrom)}</dd></div>
            <div><dt>Expiry / supersession</dt><dd>${esc(claim.expiresAt ?? "No expiry recorded")} · ${esc(claim.supersededBy ?? "Current")}</dd></div>
            <div><dt>Evidence</dt><dd>${evidenceLinks}</dd></div>
          </dl>
          <p><strong>Scope:</strong> ${esc(claim.scope)}</p>
          <p><strong>Limitation:</strong> ${esc(claim.limitations[0])}</p>
        </article>`);
}

function evidenceClassCard(evidenceClass) {
  return `<article class="evidence-class-card" id="${attr(evidenceClass.id)}">
          <span>${esc(evidenceClass.id)}</span>
          <h3>${esc(evidenceClass.name)}</h3>
          <p>${esc(evidenceClass.purpose)}</p>
          <dl>
            <div><dt>Authority</dt><dd>${esc(evidenceClass.authority)}</dd></div>
            <div><dt>Integrity</dt><dd>${esc(evidenceClass.integrityMethod)}</dd></div>
            <div><dt>Freshness</dt><dd>${esc(evidenceClass.freshnessModel)}</dd></div>
            <div><dt>Disclosure</dt><dd>${esc(evidenceClass.disclosureBoundary)}</dd></div>
          </dl>
          <p><strong>Does not prove:</strong> ${esc(evidenceClass.doesNotProve.join(" "))}</p>
        </article>`;
}

function table(headers, rows, extraClass = "", label = "Data table") {
  return `<div class="registry ${extraClass}" role="region" tabindex="0" aria-label="${attr(label)}">
          <table>
            <thead><tr>${headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
            <tbody>
${rows.join("\n")}
            </tbody>
          </table>
        </div>`;
}

function codeBlock(label, code, language = "text") {
  return `<div class="code-panel" data-code-panel data-wrap="false">
          <div class="code-panel-toolbar">
            <span>${esc(label)}</span>
            <div>
              <button type="button" data-copy="${copyAttr(code)}" data-copy-label="Code copied">Copy</button>
              <button type="button" data-wrap-toggle aria-pressed="false">Wrap lines</button>
            </div>
          </div>
          <pre data-language="${attr(language)}"><code data-code-value>${esc(code)}</code></pre>
        </div>`;
}

function chainProgressSection() {
  return `<section id="chain-progress" class="section-shell chain-progress desktop-chain-progress" aria-labelledby="chain-progress-title">
        <div class="section-heading">
          <p class="eyebrow">SIGNED READ-ONLY OBSERVATION</p>
          <h2 id="chain-progress-title">Signed Chain Observation Boundary</h2>
          <p>Each chain is presented from its own independently signed bounded observation when one validates; otherwise its state remains waiting or unavailable. An observation does not prove contract safety, bytecode identity, reserve state, or deployment correctness.</p>
        </div>
        <div class="status-band" aria-label="Live chain feed status">
          <span>Feed <strong data-chain-meta="feed-status">awaiting signed observation</strong></span>
          <span>Generated <strong data-chain-meta="generated">no current observation asserted</strong></span>
          <span>Refresh <strong data-chain-meta="countdown">no refresh without JavaScript</strong></span>
        </div>
        <div class="chain-grid">
          <article class="chain-card" data-chain-card="978">
            <div class="chain-card-top">
              <span>FENc978</span>
              <strong><i class="live-dot" aria-hidden="true"></i><span data-chain-field="978-status">Awaiting signed observation</span></strong>
            </div>
            <h3>Chain 978</h3>
            <dl>
              <div><dt>Chain identity</dt><dd data-chain-field="978-chain-id">978 - pending</dd></div>
              <div><dt>Latest observed block</dt><dd data-chain-field="978-block">No current observation</dd></div>
              <div><dt>Evidence source</dt><dd data-chain-field="978-source">Not asserted in static output</dd></div>
              <div><dt>Confidence</dt><dd data-chain-field="978-confidence">Not asserted</dd></div>
              <div><dt>Observed</dt><dd data-chain-field="978-checked">No current signed observation</dd></div>
              <div><dt>Signed activity</dt><dd data-chain-field="978-activity">Not asserted in static output</dd></div>
            </dl>
            <div class="chain-progress-meter" aria-label="Chain 978 next signed observation progress">
              <div class="chain-progress-meter-top">
                <span><i class="chain-progress-glyph" aria-hidden="true"></i>Next verification</span>
                <strong data-chain-field="978-progress">awaiting signed observation</strong>
              </div>
              <div class="chain-progress-rail" aria-hidden="true"><i></i></div>
            </div>
          </article>
          <article class="chain-card" data-chain-card="521">
            <div class="chain-card-top">
              <span>FENn521</span>
              <strong><i class="live-dot" aria-hidden="true"></i><span data-chain-field="521-status">Awaiting signed observation</span></strong>
            </div>
            <h3>Chain N521</h3>
            <dl>
              <div><dt>Chain identity</dt><dd data-chain-field="521-chain-id">521 - pending</dd></div>
              <div><dt>Latest observed block</dt><dd data-chain-field="521-block">No current observation</dd></div>
              <div><dt>Evidence source</dt><dd data-chain-field="521-source">Not asserted in static output</dd></div>
              <div><dt>Confidence</dt><dd data-chain-field="521-confidence">Not asserted</dd></div>
              <div><dt>Observed</dt><dd data-chain-field="521-checked">No current signed observation</dd></div>
              <div><dt>Signed activity</dt><dd data-chain-field="521-activity">Not asserted in static output</dd></div>
            </dl>
            <div class="chain-progress-meter" aria-label="Chain N521 next signed observation progress">
              <div class="chain-progress-meter-top">
                <span><i class="chain-progress-glyph" aria-hidden="true"></i>Next verification</span>
                <strong data-chain-field="521-progress">awaiting signed observation</strong>
              </div>
              <div class="chain-progress-rail" aria-hidden="true"><i></i></div>
            </div>
          </article>
        </div>
      </section>`;
}

const architectureViews = [
  {
    slug: "context",
    title: "System context",
    description: "Fenrua system context, public boundaries, actors, and evidence responsibilities.",
    summary: "This view separates the public evidence interface, local technical work, agreement-specific services, and external systems. It is a scope map, not a deployment inventory.",
    nodes: [
      ["External", "Technical reviewers and contributors", "Read public records and reproduce documented local checks."],
      ["Current", "Public website and evidence interface", "Publishes static records, release references, and limitation-aware documentation."],
      ["Reference", "Local developer or CI workflow", "Uses versioned source, schemas, fixtures, and deterministic checks."],
      ["Agreement-specific", "Client technical work", "Exists only under an applicable service agreement and is not described as a public product."],
    ],
    boundary: "The public site does not expose client systems, private topology, credentials, transactional interfaces, or a hosted authorization service.",
  },
  {
    slug: "components",
    title: "Logical components",
    description: "Fenrua logical components, evidence boundaries, and current maturity labels.",
    summary: "Logical components are presented as distinct evidence, policy, verification, and recovery responsibilities. A component label does not establish a deployed service.",
    nodes: [
      ["Specification", "Security Kernel", "Defines responsibility and fail-closed conditions for identity, authority, integrity, policy, evidence, verification, containment, and recovery."],
      ["Prototype", "Local verifier foundation", "Provides local fixtures and result-code examples without a hosted verifier claim."],
      ["Reference", "Public release evidence", "Binds listed static artifacts to a release checkout and validation scope."],
      ["Planned", "Local Trust Gate", "Has no public implementation, CLI, SDK, API, or release artifact recorded."],
    ],
    boundary: "Current source specifications and public records are not a claim that every logical component is independently deployed or production approved.",
  },
  {
    slug: "runtime",
    title: "Runtime sequence",
    description: "Fenrua reference runtime sequence and fail-closed evidence boundary.",
    summary: "The reference sequence explains how a local workflow can evaluate supplied artifacts. It describes a design boundary, not a live multi-tenant runtime.",
    nodes: [
      ["Reference", "Entity manifest", "Supplies declared identity and artifact context."],
      ["Specification", "Authority policy", "Defines scoped allow, deny, approval, expiry, and revocation semantics."],
      ["Reference", "Local deterministic decision", "Produces an explicit result or fail-closed outcome from supplied inputs."],
      ["Specification", "Evidence bundle and receipt", "Captures scope, digests, limitations, and reproducible result material."],
    ],
    boundary: "The website does not execute this sequence for visitors, accept files, make authorization decisions, or manage production keys.",
  },
  {
    slug: "deployment",
    title: "Deployment profiles",
    description: "Fenrua chain-free reference deployment and optional observation profile.",
    summary: "The complete reference profile is chain-free and local-first. Optional signed observations are publication or ordering inputs only; they do not create authorization or prove deployment correctness.",
    nodes: [
      ["Reference", "Local developer or CI", "Runs local checks from supplied source and fixtures without a required public chain."],
      ["Specification", "Entity manifest", "Provides declared identity, artifact context, and schema version."],
      ["Specification", "Authority policy", "Provides scoped decision rules, expiry, and revocation semantics."],
      ["Reference", "Local deterministic decision", "Produces an explicit scoped result or fail-closed outcome from supplied inputs."],
      ["Reference", "Evidence bundle", "Captures declared inputs, digests, result material, and limitations."],
      ["Reference", "Local signature verification", "Checks the supplied signature and digest material within the declared local scope."],
      ["Reference", "Receipt export", "Exports a reproducible receipt without requiring a public chain or hosted verifier."],
      ["Optional external", "Signed observation publication", "May expose a bounded observation after its own signature and freshness checks."],
    ],
    boundary: "No public chain is required for local verification. The reference design supports offline operation from supplied local inputs; revocation freshness still depends on a declared local source and its stated limitation. An optional observation can publish or order a record, but cannot create authorization.",
  },
  {
    slug: "trust-boundaries",
    title: "Trust boundaries",
    description: "Fenrua trust boundaries, control ownership, and roots of trust.",
    summary: "Trust is scoped to named artifacts, signatures, policies, public records, and review boundaries. The page never collapses a signed observation into general system assurance.",
    nodes: [
      ["Current", "Public artifact boundary", "Only generated public files and declared records are released through the static surface."],
      ["Specification", "Evidence and policy boundary", "Claims require scoped evidence and cannot be strengthened by page presentation alone."],
      ["External", "Independent review boundary", "No external review, certification, or production approval is implied unless a matching evidence record exists."],
      ["Optional external", "Observation boundary", "A signed observation remains bounded to its declared contract, key, sequence, and freshness state."],
    ],
    boundary: "Private infrastructure, signing material, customer environments, and unmeasured runtime behaviour remain outside the public trust boundary.",
  },
  {
    slug: "data-and-provenance",
    title: "Data and provenance",
    description: "Fenrua public data classes, evidence provenance, and disclosure boundaries.",
    summary: "This view distinguishes public static records, bounded observation fields, agreement-specific information, and protected operational material. Public evidence is point-in-time and limitation-aware.",
    nodes: [
      ["Current", "Public records", "Schemas, source-controlled JSON, documentation, release manifests, and public evidence references."],
      ["Reference", "Local files", "A future local workflow can evaluate user-supplied artifacts without sending them to the public website."],
      ["Agreement-specific", "Client information", "Exists only in the applicable delivery context and is not published in public records."],
      ["Agreement-specific", "Tenancy and isolation boundary", "Client work remains in a separate agreement-specific delivery context; no multi-tenant public control plane is claimed."],
      ["Protected", "Private operations", "Credentials, protected topology, signing material, and raw witness material are excluded from the public estate."],
    ],
    boundary: "A published hash, record, or signed observation supports only its stated integrity and provenance scope; it does not disclose or prove protected systems.",
  },
  {
    slug: "recovery",
    title: "Recovery and containment",
    description: "Fenrua containment, revocation, recovery, and rollback reference boundaries.",
    summary: "Failure handling is designed around explicit invalid, stale, revoked, incomplete, or superseded states. The site publishes the decision boundary, not an invented incident history.",
    nodes: [
      ["Specification", "Fail-closed decision", "Missing or invalid required state produces an explicit non-success outcome."],
      ["Reference", "Revocation and quarantine", "Superseded or revoked artifacts are retained only with their state and replacement context."],
      ["Current", "Release rollback discipline", "A previous source-bound static release can be selected through the approved provider process after owner review."],
      ["Planned", "Operational incident process", "No public uptime, SLO, or incident theatre is claimed before measured service history exists."],
    ],
    boundary: "The page does not claim automatic recovery, key rotation completion, live continuity, or a public operational service beyond the evidence available.",
  },
  {
    slug: "evolution",
    title: "Evolution states",
    description: "Fenrua current, reference, specification, research, and planned evolution states.",
    summary: "Every major surface is labelled by its actual state so that public documentation cannot be mistaken for a production capability roadmap.",
    nodes: [
      ["Current", "Public evidence interface", "Static pages and machine-readable records are available for inspection."],
      ["Reference", "Release and observation boundaries", "Reference implementations and bounded interfaces have stated limitations."],
      ["Specification and research", "Kernel and utility concepts", "Source materials define responsibilities, but require integration and further evidence for promotion."],
      ["Planned", "Local Trust Gate", "No usable public product interface is represented until its separate product gate is satisfied."],
    ],
    boundary: "A future direction is not an availability claim, a release commitment, a service-level commitment, or an external assurance statement.",
  },
];

function architectureView(view) {
  return layout({
    title: `Fenrua Architecture: ${view.title}`,
    description: view.description,
    current: view.title,
    canonicalPath: `/architecture/${view.slug}`,
    section: "Platform",
    body: assuranceScope("claims", ["claim.observation.signed-read-only"], `${routeHero("ARCHITECTURE VIEW", view.title, view.summary)}
      <section class="section-shell" aria-labelledby="${attr(`${view.slug}-diagram-title`)}">
        <div class="section-heading"><p class="eyebrow">SEMANTIC SYSTEM VIEW</p><h2 id="${attr(`${view.slug}-diagram-title`)}">${esc(view.title)} map</h2><p>Each step carries its state in text. The diagram remains readable without colour or client JavaScript.</p></div>
        <ol class="architecture-diagram" aria-label="${attr(`${view.title} component map`)}">
          ${view.nodes.map(([state, name, detail], index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${esc(name)}</strong><p>${esc(detail)}</p></div><em>${esc(state)}</em></li>`).join("\n          ")}
        </ol>
        <p class="diagram-text-equivalent"><strong>Text equivalent:</strong> ${esc(view.nodes.map(([state, name]) => `${name} is ${state.toLowerCase()}`).join("; "))}.</p>
      </section>
      <section class="section-shell split-section" aria-labelledby="${attr(`${view.slug}-boundary-title`)}">
        <div><p class="eyebrow">CURRENT IMPLEMENTATION BOUNDARY</p><h2 id="${attr(`${view.slug}-boundary-title`)}">What this view does and does not state</h2></div>
        <div class="constraint-list"><p>${esc(view.boundary)}</p><p>Inspect the <a href="/trust/claims">claim register</a> and <a href="/trust/evidence-classes">evidence classes</a> for the records that govern public assurance language.</p></div>
      </section>`),
  });
}

function platform() {
  return layout({
    title: "Fenrua Platform",
    description: "Fenrua platform orientation, current capabilities, boundaries, and architecture routes.",
    current: "Platform",
    canonicalPath: "/platform",
    section: "Platform",
    body: `${routeHero("PLATFORM ORIENTATION", "Platform", "Fenrua is a public evidence interface and an AI efficiency infrastructure direction. The platform view separates what is inspectable today from specifications, research, and planned work.", `<div class="cta-row"><a class="button button-primary" href="/architecture">Read architecture</a><a class="button button-secondary" href="/start">Choose a starting path</a></div>`)}
      <section class="section-shell" aria-labelledby="platform-capabilities"><div class="section-heading"><p class="eyebrow">CURRENT CAPABILITY STATES</p><h2 id="platform-capabilities">Maturity stays attached to the record</h2><p>These summaries are generated from the canonical capability register. A public page, specification, or record is not promoted into a service merely by being visible here.</p></div>
        ${capabilityCards(["capability.public-website", "capability.security-kernel-specification", "capability.utility-catalogue", "capability.local-verifier", "capability.local-trust-gate"], { "capability.security-kernel-specification": "/kernel", "capability.utility-catalogue": "/utilities", "capability.local-verifier": "/verify" })}
      </section>
      <section class="section-shell split-section" aria-labelledby="platform-efficiency-evidence"><div><p class="eyebrow">MEASUREMENT BOUNDARY</p><h2 id="platform-efficiency-evidence">Efficiency claims require a reproducible method</h2><p>The public platform does not publish a measured AI-efficiency benchmark. The standard defines the workload, baseline, environment, quality, uncertainty, and artifact inputs required before a future performance claim can be made.</p></div><div class="doc-grid"><a href="/docs/FENRUA_AI_EFFICIENCY_EVIDENCE_STANDARD.md">AI efficiency evidence standard</a><a href="/trust/claims">Inspect current claim boundaries</a></div></section>
      <section class="section-shell" aria-labelledby="platform-next"><div class="section-heading"><p class="eyebrow">NEXT BY ROLE</p><h2 id="platform-next">Inspect before integrating</h2><p>Technical reviewers can trace claims and evidence. Developers can reproduce local checks. Service discussions remain agreement-specific and do not become public self-service workflows.</p></div>
        ${modelDownloads()}
      </section>`,
  });
}

function trust() {
  return layout({
    title: "Fenrua Trust",
    description: "Fenrua claims, evidence classes, release verification, and public trust boundaries.",
    current: "Trust",
    canonicalPath: "/trust",
    section: "Trust",
    body: assuranceScope("claims", ["claim.observation.signed-read-only"], `${routeHero("TRUST BOUNDARIES", "Trust", "Public trust is expressed through scoped claims, evidence classes, release records, and explicit non-claims. It is not a generic assurance badge.", `<div class="cta-row"><a class="button button-primary" href="/trust/claims">Inspect claims</a><a class="button button-secondary" href="/trust/evidence-classes">Read evidence classes</a></div>`)}
      <section class="section-shell" aria-labelledby="trust-records"><div class="section-heading"><p class="eyebrow">MACHINE-READABLE RECORDS</p><h2 id="trust-records">Trace public statements to their boundary</h2><p>Claims link to capability and evidence records. Stronger assurance language is governed by a versioned public contract rather than presentation alone.</p></div>
        ${modelDownloads()}
      </section>
      <section class="section-shell" aria-labelledby="trust-limits"><div class="section-heading"><p class="eyebrow">LIMITATIONS</p><h2 id="trust-limits">Separate release, observation, and runtime evidence</h2><p>A release manifest binds listed public artifacts. A signed observation has its own bounded contract. Neither establishes system-wide safety, authorization, or independent certification.</p></div>
        ${cardGrid([{ kicker: "RELEASE", title: "Static artifact binding", text: "Use the release verification route to inspect commit, artifact, method, exclusions, and expiration boundaries.", href: "/audit", link: "Release verification" }, { kicker: "OBSERVATION", title: "Bounded public monitor", text: "Signed observations remain separate from release records and are evaluated only under their declared key, sequence, and freshness semantics.", href: "/status", link: "Status monitor" }, { kicker: "REPORTING", title: "Private vulnerability path", text: "Security reporting uses the published private contact boundary and does not turn public documentation into a security certification.", href: "/security", link: "Security reporting" }])}
      </section>`),
  });
}

function operations() {
  const rows = publicServiceCatalogue.services.map((service) => `<tr>
      <td data-label="Service">${esc(service.name)}</td>
      <td data-label="Availability">${esc(service.availability)}</td>
      <td data-label="Interface">${esc(service.interface.type)}</td>
      <td data-label="SLO state">${esc(service.sloState)}</td>
      <td data-label="Incident state">${esc(service.incidentState)}</td>
      <td data-label="Known limitation">${esc(service.knownLimitation)}</td>
    </tr>`);
  return layout({
    title: "Fenrua Operations",
    description: "Fenrua publication, service, dependency, observation, and operational status boundaries.",
    current: "Operations",
    canonicalPath: "/operations",
    section: "Operations",
    body: assuranceScope("claims", ["claim.observation.signed-read-only"], `${routeHero("OPERATIONS BOUNDARY", "Operations", "Publication, services, dependencies, signed observations, incidents, and maintenance are separate planes. Only records backed by current public evidence are listed.", `<div class="cta-row"><a class="button button-primary" href="/status">Open status</a><a class="button button-secondary" href="/operations/observations">Observation boundary</a></div>`)}
      <section class="section-shell" aria-labelledby="operations-planes"><div class="section-heading"><p class="eyebrow">STATUS PLANES</p><h2 id="operations-planes">Do not collapse one status into another</h2><p>Publication describes static release artifacts. Service health describes measured services only. Signed observations remain read-only external evidence. SLO not yet defined is more honest than an invented percentage, and no incident history is fabricated.</p></div>
        ${cardGrid(statusPlanes.map(([title, text, href], index) => ({ kicker: String(index + 1).padStart(2, "0"), title, text, href, link: "Inspect boundary" })))}
      </section>
      <section class="section-shell" aria-labelledby="service-catalogue"><div class="section-heading"><p class="eyebrow">SERVICE CATALOGUE</p><h2 id="service-catalogue">Real public and agreement-specific surfaces</h2><p>These records are generated from the public service catalogue. They are not a public product catalogue or an availability promise beyond the stated interface.</p></div>
        ${table(["Service", "Availability", "Interface", "SLO state", "Incident state", "Known limitation"], rows, "status-table service-catalogue-table", "Public service catalogue")}
      </section>`),
  });
}

function companyHub() {
  return layout({
    title: "Fenrua Company",
    description: "Fenrua Labs company identity, public contact, legal boundary, and service orientation.",
    current: "Company",
    canonicalPath: "/company",
    section: "Company",
    body: `${routeHero("COMPANY AND SERVICE BOUNDARY", "Company", "Fenrua Labs Pty Ltd is the registered operator named on the public estate. Public information supports technical review and service discovery, not self-service contracting or financial products.", `<div class="cta-row"><a class="button button-primary" href="/legal">Legal and company record</a><a class="button button-secondary" href="/support">Support boundary</a></div>`)}
      <section class="section-shell split-section" aria-labelledby="company-identity"><div><p class="eyebrow">PUBLIC IDENTITY</p><h2 id="company-identity">Registered operator and public channels</h2><p>Company details and public profiles are maintained in the canonical company identity record. Contact channels below are public, factual, and scoped to their purpose.</p></div>
        <div class="constraint-list"><p><strong>${esc(company.legalName)}</strong><br />ABN ${esc(company.abn)} · ACN ${esc(company.acn)}</p><p><strong>Business enquiries:</strong> <a href="mailto:${attr(company.publicContact)}">${esc(company.publicContact)}</a></p><p><strong>Security reporting:</strong> <a href="/security">Use the public security reporting boundary</a>.</p></div>
      </section>
      <section class="section-shell" aria-labelledby="company-boundary"><div class="section-heading"><p class="eyebrow">SERVICE BOUNDARY</p><h2 id="company-boundary">Public records, agreement-specific delivery</h2><p>Research, software, infrastructure access, hosting, integration, technical support, and evidence-aware workflows may be delivered only within the relevant agreement. The public site does not represent a client portal, checkout, trading venue, wallet, token offering, or financial-return product.</p></div>
        ${cardGrid([{ kicker: "LEGAL", title: "Operating record", text: "Read the current public company and service record, including explicit non-financial-product boundaries.", href: "/legal", link: "Legal and company" }, { kicker: "SUPPORT", title: "Technical enquiries", text: "Public support directs people to the correct published channel and does not accept sensitive material in public forms.", href: "/support", link: "Support boundary" }, { kicker: "DATA FLOW", title: "Public data handling", text: "The public data-flow document states known public flows and the remaining owner or legal review dependencies.", href: "/docs/PUBLIC_DATA_FLOW.md", link: "Data flow" }])}
      </section>`,
  });
}

function start() {
  const roles = [
    ["Developer", "Fenrua currently provides source-controlled schemas, fixtures, and local validation foundations.", "Read the local verifier boundary and run the repository validation path.", "Claim and evidence records plus deterministic examples.", "No public Local Trust Gate package or hosted verifier is available.", "npm run validate", "/developers"],
    ["Security engineer", "Fenrua publishes a scoped security kernel specification and a private reporting boundary.", "Review trust boundaries, claim limitations, and the current release verification scope.", "Security, evidence, and release records.", "No general production-safety certification is claimed.", "npm run validate", "/security"],
    ["Researcher", "Fenrua publishes research records only with adjacent claims, non-claims, evidence, and limitations.", "Inspect a research record and its reproduction commands.", "Research registry and source-linked evidence.", "Research publication is not production promotion.", "node scripts/test-verify-examples.mjs", "/research"],
    ["Enterprise technical leader", "Fenrua documents public platform and agreement-specific service boundaries separately.", "Assess architecture, evidence, data flow, and support scope before a service discussion.", "Architecture views, service catalogue, and company record.", "No public SLO, uptime, or self-service service contract is represented.", "npm run validate", "/operations"],
    ["University or educator", "Fenrua provides readable public specifications, examples, and research records for technical study.", "Use the source examples and evidence classes to teach scope-aware verification.", "Schemas, fixtures, and public documentation.", "Documentation is not a hosted lab environment or a formal course.", "node scripts/test-verify-examples.mjs", "/verify"],
    ["Open-source contributor", "Fenrua's public repositories expose source and documented contribution channels.", "Inspect the repository boundary, run local checks, and use the public security path for vulnerabilities.", "Repository history, schemas, and release verification records.", "Public source does not expose protected operational systems or signing material.", "npm run validate", "/developers"],
    ["General technical reviewer", "Fenrua makes public claims, evidence classes, release scope, and limitations inspectable.", "Start with claims, then trace a record to evidence and current capability state.", "Claim register, evidence taxonomy, and release manifest.", "A public record never proves more than its declared scope.", "npm run validate", "/trust"],
  ];
  return layout({
    title: "Start with Fenrua",
    description: "Role-based Fenrua technical starting paths with evidence, limitations, and local next steps.",
    current: "Start",
    canonicalPath: "/start",
    section: "Developers",
    body: `${routeHero("ROLE-BASED ORIENTATION", "Start", "Choose a path by the question you need to answer. Every path states the current public surface, available evidence, known limits, and a shortest reproducible next step.")}
      <section class="section-shell role-path-list" aria-labelledby="start-paths"><div class="section-heading"><p class="eyebrow">STARTING PATHS</p><h2 id="start-paths">Technical orientation without conversion language</h2><p>These paths use current public records only. They do not imply an investment, account, token, or hosted-product journey.</p></div>
        ${roles.map(([role, current, today, evidence, unavailable, command, href]) => `<article><h3>${esc(role)}</h3><dl><div><dt>Currently</dt><dd>${esc(current)}</dd></div><div><dt>Today</dt><dd>${esc(today)}</dd></div><div><dt>Evidence</dt><dd>${esc(evidence)}</dd></div><div><dt>Not available</dt><dd>${esc(unavailable)}</dd></div></dl>${codeBlock("Shortest reproducible step", command, "bash")}<a href="${attr(href)}">Continue as a ${esc(role)}</a></article>`).join("\n        ")}
      </section>`,
  });
}

function observations() {
  const chain978 = capabilitiesById.get("capability.observation-978");
  const chainN521 = capabilitiesById.get("capability.observation-n521");
  return layout({
    title: "Fenrua Signed Observations",
    description: "Fenrua bounded signed observation contract, public limitations, and availability state.",
    current: "Signed observations",
    canonicalPath: "/operations/observations",
    section: "Operations",
    body: assuranceScope("claims", ["claim.observation.signed-read-only", "claim.observation.observed-block-label"], `${routeHero("OBSERVATION BOUNDARY", "Signed observations", "Observation records are separate from publication and service status. Static output never asserts a current chain state; the monitor route reports a result only after its bounded verification contract succeeds.", `<div class="cta-row"><a class="button button-primary" href="/status">Open current monitor</a><a class="button button-secondary" href="/trust/claims">Read the claim records</a></div>`)}
      <section class="section-shell" aria-labelledby="observation-capabilities"><div class="section-heading"><p class="eyebrow">CURRENT CAPABILITY RECORDS</p><h2 id="observation-capabilities">Read-only and evidence-bound</h2><p>Chain 978 and Chain N521 have independent records. The N521 record remains unavailable until its gateway and public verification key are independently configured.</p></div>
        <div class="capability-record-list">${capabilityRecord(chain978)}${capabilityRecord(chainN521)}</div>
      </section>
      <section class="section-shell split-section" aria-labelledby="observation-nonclaims"><div><p class="eyebrow">EXPLICIT NON-CLAIMS</p><h2 id="observation-nonclaims">An observation is not authorization</h2></div><div class="constraint-list"><p>A signed observation does not prove contract safety, bytecode identity, reserve state, finality, deployment correctness, chain availability, or production approval.</p><p>It does not accept transactions, forward public RPC, expose private mesh information, or replace a local policy decision.</p></div></section>`),
  });
}

function trustClaims() {
  return layout({
    title: "Fenrua Public Claims",
    description: "Fenrua public claims with capability maturity, evidence classes, validity, and limitations.",
    current: "Claims",
    canonicalPath: "/trust/claims",
    section: "Trust",
    scripts: '<script src="/claim-filter.js" defer></script>',
    body: `${routeHero("PUBLIC CLAIM REGISTER", "Claims", "Each significant public statement is represented as a record with a capability, maturity, evidence class, validity state, and limitation. All records remain visible when JavaScript is unavailable.")}
      <section class="section-shell" aria-labelledby="claim-search-title"><div class="section-heading"><p class="eyebrow">LOCAL RECORD FILTER</p><h2 id="claim-search-title">Inspect claims without remote search</h2><p>Filtering runs entirely in the browser against the static rendered records. Download the exact machine-readable input for independent inspection.</p></div>
        <label class="claim-search-label" for="claim-search">Search public claims</label><input id="claim-search" data-claim-filter type="search" autocomplete="off" placeholder="Search statement, capability, assurance verb, or evidence class" /><p data-claim-filter-status role="status" aria-live="polite" aria-atomic="true">${claimRegister.claims.length} claims shown</p><p><a href="/data/claim-register.json">Download claim register JSON</a></p>
      </section>
      <section class="section-shell claim-record-list" aria-labelledby="claim-records"><div class="section-heading"><p class="eyebrow">CLAIM RECORDS</p><h2 id="claim-records">Current public assertions</h2><p>Claims with an expiration or supersession state must not be read as current after that state changes. Each record carries a limitation beside the assertion.</p></div>
        ${claimRegister.claims.map((claim) => claimRecord(claim)).join("\n        ")}
      </section>
      <section class="section-shell capability-record-list" aria-labelledby="claim-capabilities"><div class="section-heading"><p class="eyebrow">CAPABILITY CONTEXT</p><h2 id="claim-capabilities">What each claim can and cannot support</h2><p>Capability records preserve lifecycle, maturity, availability, limitations, non-claims, and promotion gates independently of page copy.</p></div>
        ${capabilityRegister.capabilities.map((capability) => capabilityRecord(capability)).join("\n        ")}
      </section>`,
  });
}

function trustEvidenceClasses() {
  return layout({
    title: "Fenrua Evidence Classes",
    description: "Fenrua evidence classes, assurance boundaries, freshness models, and non-proof statements.",
    current: "Evidence classes",
    canonicalPath: "/trust/evidence-classes",
    section: "Trust",
    body: assuranceScope("taxonomy", [], `${routeHero("EVIDENCE TAXONOMY", "Evidence classes", "Evidence is classified by purpose, authority, integrity method, freshness, disclosure boundary, and what it does not prove. No class automatically becomes independent assurance.")}
      <section class="section-shell" aria-labelledby="evidence-class-list"><div class="section-heading"><p class="eyebrow">PUBLIC TAXONOMY</p><h2 id="evidence-class-list">Eleven bounded evidence classes</h2><p>The taxonomy separates specification, test, build, release, runtime, operational, observation, incident, independent reproduction, external review, and regulatory or compliance evidence.</p></div>
        <div class="evidence-class-list">${evidenceTaxonomy.classes.map((record) => evidenceClassCard(record)).join("\n        ")}</div>
      </section>
      <section class="section-shell split-section"><div><p class="eyebrow">ASSURANCE LANGUAGE</p><h2>Terms require a contract</h2><p>Terms such as observed, signed, tested, verified, reviewed, audited, certified, and production-approved have explicit minimum evidence contracts.</p></div><div class="constraint-list"><p>The contract records the minimum inputs for each term and also states what that term does not mean. Inspect the complete input rather than treating a label as proof.</p><p><a href="/data/assurance-language.json">Download assurance language JSON</a></p></div></section>`),
  });
}

function home() {
  return layout({
    title: "Fenrua Protocol | AI Efficiency Infrastructure",
    description: "Fenrua Labs researches, develops, and provides AI efficiency infrastructure software and related technology services.",
    current: "Overview",
    headerLive: true,
    body: `${routeHero(
      "AI EFFICIENCY INFRASTRUCTURE",
      "AI efficiency infrastructure for verifiable systems.",
      "Fenrua researches, develops, and provides software and related technology services spanning AI efficiency, infrastructure, evidence, identity, authority, integrity, policy, verification, containment, recovery, hosting, and integration.",
      `<div class="cta-row"><a class="button button-primary" href="/platform">Explore platform</a><a class="button button-secondary" href="/start">Choose a starting path</a><a class="button button-secondary" href="/trust">Inspect trust records</a></div>`,
      false
    )}
      ${chainProgressSection()}
      <section class="section-shell" aria-labelledby="home-answers">
        <div class="section-heading">
          <p class="eyebrow">FIVE-MINUTE ORIENTATION</p>
          <h2 id="home-answers">What reviewers need first</h2>
          <p>The homepage is intentionally a routing surface. Deep technical detail lives on dedicated pages so evidence, maturity, and limitations stay inspectable.</p>
        </div>
        ${cardGrid([
          { kicker: "WHAT", title: "Fenrua is an infrastructure protocol", text: "It is a research, software, and technology-services foundation for efficient, verifiable AI systems; security is one technical discipline within the broader architecture.", href: "/platform", link: "Platform" },
          { kicker: "WHY LAYER 0", title: "It sits beneath AI execution", text: "Independent systems need identity, authority, integrity, policy, evidence, verification, containment, and recovery before autonomous execution can be trusted.", href: "/kernel", link: "Kernel primitives" },
          { kicker: "TODAY", title: "Reference surfaces are public", text: "The website, evidence registry, toolchain lock, telemetry checks, and schema foundations are available with maturity labels.", href: "/operations", link: "Operations" },
          { kicker: "EVIDENCE", title: "Claims are source-linked", text: "Every significant public claim points to a source, timestamp, maturity label, and limitation.", href: "/trust", link: "Trust records" },
          { kicker: "NEXT", title: "Developers start locally", text: "The verifier page and developer quick-start show the local workflow without pretending a live verifier exists.", href: "/start", link: "Choose a path" },
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
          <p><strong>Commercial boundary:</strong> ${esc(siteEvidence.commercialBoundary.paragraphs[0])} <a href="/legal">Read the Legal and Company Centre</a>.</p>
        </div>
      </section>
      ${commercialBoundarySection()}`,
  });
}

function architecture() {
  return layout({
    title: "Fenrua Architecture",
    description: "Fenrua architecture, stack position, operating flows, and Layer 0 boundaries.",
    current: "Architecture",
    body: assuranceScope("claims", ["claim.observation.signed-read-only"], `${routeHero("OPERATING-SYSTEM MODEL", "Architecture", "Fenrua is organized as kernel space and user space, with stable machine-readable interfaces and public evidence boundaries.")}
      <section class="section-shell">
        <div class="section-heading"><p class="eyebrow">CONTROL FLOW</p><h2>Security workflow</h2></div>
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
      </section>
      <section class="section-shell" aria-labelledby="architecture-views">
        <div class="section-heading"><p class="eyebrow">VIEWPOINTS</p><h2 id="architecture-views">Inspect the boundary from each relevant angle</h2><p>These routes use semantic diagrams and explicit state labels. They distinguish current public records, reference designs, specifications, research, planned work, agreement-specific delivery, and external dependencies.</p></div>
        ${cardGrid(architectureViews.map((view, index) => ({ kicker: String(index + 1).padStart(2, "0"), title: view.title, text: view.summary, href: `/architecture/${view.slug}`, link: "Open viewpoint" })))}
      </section>`),
  });
}

function kernel() {
  return layout({
    title: "Fenrua Security Kernel",
    description: "Fenrua security kernel primitives, responsibilities, state transitions, and fail-closed behavior.",
    current: "Kernel",
    body: `${routeHero("KERNEL SPACE", "Security Kernel", "The kernel owns the security primitives beneath autonomous AI execution. Each primitive carries its own maturity label and evidence boundary.")}
      <section class="section-shell">
        <div class="section-heading"><p class="eyebrow">PRIMITIVES</p><h2>Kernel responsibilities</h2></div>
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
        ${codeBlock("Lifecycle state machine", `unregistered -> registered -> policy_bound -> evidence_required
-> verified_with_limitations -> active
-> revoked | quarantined | superseded -> recovered`, "text")}
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
    ["Fenrua Registry", "Anchor entity, evidence, and release state.", "No public contract or financial offering is claimed.", "Research"],
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

function researchDate(item) {
  return item.slug === "toolchain-evidence-lock" ? generatedDate : "2026-07-12";
}

function researchIndex() {
  const rows = researchItems.map(
    (item) => `<tr>
      <td><a href="/research/${item.slug}">${esc(item.title)}</a><br><small>${esc(item.category)}</small></td>
      <td>${esc(item.claim)}</td>
      <td>${esc(item.nonClaim)}</td>
      <td>${esc(item.primitive)}</td>
      <td>${esc(item.maturity)}</td>
    </tr>`
  );
  const cards = researchItems.map((item) => `<article class="research-record-card">
        <p class="eyebrow">${esc(item.category)}</p>
        <h2><a href="/research/${item.slug}">${esc(item.title)}</a></h2>
        <dl>
          <div><dt>Record ID</dt><dd><code>fenrua-research:${esc(item.slug)}</code></dd></div>
          <div><dt>Maturity</dt><dd>${esc(item.maturity)}</dd></div>
          <div><dt>Date</dt><dd>${esc(researchDate(item))}</dd></div>
        </dl>
        <p><strong>Claim:</strong> ${esc(item.claim)}</p>
        <p><strong>Primary limitation:</strong> ${esc(item.limitations)}</p>
        <a href="/research/${item.slug}">Open record</a>
      </article>`).join("\n        ");
  return layout({
    title: "Fenrua Research Registry",
    description: "Fenrua research records with claims, non-claims, threats, tooling, evidence, and limitations.",
    current: "Research",
    body: `${routeHero("RESEARCH TO INFRASTRUCTURE", "Research Registry", "Research appears publicly only when its claim, non-claim, threat, invariant, evidence, tooling, maturity, and limitations are adjacent.")}
      <section class="section-shell">
        <p class="mobile-data-notice"><strong>Mobile view is optimised for record-by-record inspection.</strong> Desktop offers the full comparison layout. All evidence remains available here.</p>
        ${table(["Research", "Claim", "Non-Claim", "Primitive", "Maturity"], rows, "research-table")}
        <div class="research-card-list" aria-label="Research mobile records">
          ${cards}
        </div>
      </section>`,
  });
}

function researchPage(item) {
  const recordId = `fenrua-research:${item.slug}`;
  const defaults = {
    date: researchDate(item),
    sourceRevision: snapshotCommit,
    evidenceRevision: item.slug === "toolchain-evidence-lock" ? registryHash : evidenceRevision,
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
    fixRevision: item.slug === "pn521-cross-limb-borrow" ? snapshotCommit : "Current website route generation.",
    regressionFixture: item.slug === "pn521-cross-limb-borrow" ? "regression_001_p521_sub_overflow.bin" : item.regression,
    kernelImpact: `${item.primitive} primitive boundary clarified.`,
    utilityImpact: "Public interface remains maturity-labelled and limitation-adjacent.",
    reproduction: item.commands.join("\n"),
  };
  const tocItems = [
    ["summary", "Summary"],
    ["claim", "Claim"],
    ["non-claim", "Non-claim"],
    ["threat", "Threat / invariant"],
    ["tooling", "Tooling"],
    ["commands", "Commands"],
    ["evidence", "Evidence"],
    ["regression", "Regression"],
    ["limitations", "Limitations"],
    ["reproduction", "Reproduction"],
  ];
  return layout({
    title: `${item.title} | Fenrua Research`,
    description: `${item.title} research record.`,
    current: "Research",
    canonicalPath: `/research/${item.slug}`,
    body: `${routeHero("RESEARCH RECORD", item.title, `${item.category} · ${item.primitive}`)}
      <section class="section-shell research-record-shell">
        <p class="mobile-data-notice"><strong>Mobile view is optimised for record-by-record inspection.</strong> Use the section menu below; desktop keeps the full route context visible.</p>
        <details class="record-toc">
          <summary>Record sections</summary>
          <nav aria-label="Research record sections">
            ${tocItems.map(([id, label]) => `<a href="#${attr(id)}">${esc(label)}</a>`).join("")}
          </nav>
        </details>
        <article class="record-section" id="summary">
          <p class="eyebrow">SUMMARY</p>
          <h2>Record summary</h2>
          <dl class="record-facts">
            <div><dt>Record ID</dt><dd><code>${esc(recordId)}</code></dd></div>
            <div><dt>Category</dt><dd>${esc(item.category)}</dd></div>
            <div><dt>Date</dt><dd>${esc(defaults.date)}</dd></div>
            <div><dt>Source revision</dt><dd><code>${esc(defaults.sourceRevision)}</code></dd></div>
            <div><dt>Evidence revision</dt><dd><code>${esc(defaults.evidenceRevision)}</code></dd></div>
            <div><dt>Primitive</dt><dd>${esc(item.primitive)}</dd></div>
            <div><dt>Maturity</dt><dd>${esc(item.maturity)}</dd></div>
            <div><dt>Severity</dt><dd>${esc(defaults.severity)}</dd></div>
          </dl>
        </article>
        <article class="record-section" id="claim">
          <p class="eyebrow">CLAIM</p>
          <h2>Primary claim</h2>
          <p>${esc(item.claim)}</p>
        </article>
        <article class="record-section" id="non-claim">
          <p class="eyebrow">NON-CLAIM</p>
          <h2>Boundary</h2>
          <p>${esc(item.nonClaim)}</p>
          <p>${esc(defaults.assumptions)}</p>
        </article>
        <article class="record-section" id="threat">
          <p class="eyebrow">THREAT / INVARIANT</p>
          <h2>Threat model</h2>
          <p><strong>Threat:</strong> ${esc(item.threat)}</p>
          <p><strong>Invariant:</strong> ${esc(item.invariant)}</p>
          <p><strong>Trigger:</strong> ${esc(defaults.trigger)}</p>
          <p><strong>Root cause:</strong> ${esc(defaults.rootCause)}</p>
        </article>
        <article class="record-section" id="tooling">
          <p class="eyebrow">TOOLING</p>
          <h2>Tools and implementation</h2>
          <p><strong>Reference implementation:</strong> ${esc(defaults.referenceImplementation)}</p>
          <p><strong>Tools used:</strong> ${esc(defaults.toolsUsed)}</p>
          <p><strong>Tool versions:</strong> ${esc(defaults.toolVersions)}</p>
        </article>
        <article class="record-section" id="commands">
          <p class="eyebrow">COMMANDS</p>
          <h2>Verification commands</h2>
          ${codeBlock("Research commands", item.commands.join("\n"), "bash")}
        </article>
        <article class="record-section" id="evidence">
          <p class="eyebrow">EVIDENCE</p>
          <h2>Evidence and result</h2>
          <p><strong>Results:</strong> ${esc(defaults.results)}</p>
          <p><strong>Evidence confirmation:</strong> ${esc(defaults.evidenceConfirmation)}</p>
          <p><strong>Evidence hash:</strong> <code>${esc(defaults.evidenceHash)}</code></p>
          <p><strong>Fix revision:</strong> <code>${esc(defaults.fixRevision)}</code></p>
        </article>
        <article class="record-section" id="regression">
          <p class="eyebrow">REGRESSION</p>
          <h2>Regression fixture</h2>
          <p>${esc(defaults.regressionFixture)}</p>
          <p><strong>Kernel impact:</strong> ${esc(defaults.kernelImpact)}</p>
          <p><strong>Utility impact:</strong> ${esc(defaults.utilityImpact)}</p>
        </article>
        <article class="record-section" id="limitations">
          <p class="eyebrow">LIMITATIONS</p>
          <h2>Remaining limitations</h2>
          <p>${esc(item.limitations)}</p>
          <p><strong>Supersession:</strong> ${esc(item.supersession)}</p>
        </article>
        <article class="record-section" id="reproduction">
          <p class="eyebrow">REPRODUCTION</p>
          <h2>Reproduction instructions</h2>
          ${codeBlock("Reproduction", defaults.reproduction, "bash")}
        </article>
      </section>`,
  });
}

function verify() {
  const corpusRows = verificationResults.map(([code, meaning, file]) => `<tr>
      <td><code>${esc(code)}</code></td>
      <td>${esc(meaning)}</td>
      <td><a href="/examples/verification-results/${attr(file)}">${esc(file)}</a></td>
      <td>Legacy scenario only; it does not authorise or instruct execution.</td>
    </tr>`);
  return layout({
    title: "Fenrua Verify",
    description: "Fenrua public verification foundation with historical scenarios, documentation, and repository validation.",
    current: "Verify",
    body: `${routeHero("LEGACY VERIFICATION CORPUS", "Verify", "No live server-side verifier is claimed. The current scenario corpus is historical reference material, not a Trust Gate result, decision, or execution interface.")}
      <section class="section-shell split-section">
        <div>
          <p class="eyebrow">REPOSITORY VALIDATION WALKTHROUGH</p>
          <h2>Run the current repository checks</h2>
          <p>Use the repository validation suite and explanatory examples. The foundation result example explicitly marks runtime attestation as unverified; the legacy scenario corpus does not make an authorisation or execution decision.</p>
        </div>
        ${codeBlock("Local verifier commands", `npm run validate
node scripts/test-toolchain-registry.mjs

# Example artifacts
examples/entity-manifest.example.json
examples/authority-policy.example.json
examples/evidence-bundle.example.json
examples/verification-result.example.json`, "bash")}
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
          <a href="/docs/FENRUA_VERIFY_RESULT_CORPUS.md">Legacy corpus disposition</a>
        </div>
      </section>
      <section class="section-shell split-section">
        <div><p class="eyebrow">FOUNDATION RESULT EXAMPLE</p><h2>Example verification result</h2></div>
        ${codeBlock("Verification result JSON", `{
  "result": "PASS_WITH_LIMITATIONS",
  "manifestSchema": "valid",
  "identity": "verified",
  "signatures": "verified",
  "artifactIntegrity": "verified",
  "policyIntegrity": "verified",
  "evidenceCompleteness": "partial",
  "runtimeConformity": "unverified",
  "revocationStatus": "active"
}`, "json")}
      </section>
      <section class="section-shell">
        ${table(["Code", "Scenario meaning", "Legacy fixture", "Contract boundary"], corpusRows)}
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
        <div class="section-heading"><p class="eyebrow">WORKFLOW</p><h2>Developer workflow</h2></div>
        ${cardGrid([
          { kicker: "01", title: "Install", text: "Use Node 24 and the repository package manager. This website has no runtime package dependencies." },
          { kicker: "02", title: "Validate", text: "Run npm run validate to check static links, public discovery, chain API sanitization, kernel telemetry, and toolchain registry." },
          { kicker: "03", title: "Read schemas", text: "Entity manifest, authority policy, evidence bundle, and verification result specs are public.", href: "/verify", link: "Schemas and examples" },
          { kicker: "04", title: "Inspect evidence", text: "Use the evidence registry and release manifest to connect claims to source, timestamp, maturity, and limitations.", href: "/evidence", link: "Evidence" },
          { kicker: "05", title: "Respect compatibility", text: "Unsupported schema versions fail closed with UNSUPPORTED_SCHEMA rather than partial interpretation." },
          { kicker: "06", title: "Respect the service boundary", text: "No public token, investment, trading, or financial-return product is claimed." },
        ])}
      </section>
      <section class="section-shell split-section">
        <div><p class="eyebrow">COMMANDS</p><h2>Local baseline</h2></div>
        ${codeBlock("Clean checkout baseline", `git clone https://github.com/fenrualabs/fenrua-web.git
cd fenrua-web
node --version  # v24 required
npm ci
npm run validate
node scripts/test-toolchain-registry.mjs
node scripts/test-verify-examples.mjs`, "bash")}
      </section>
      <section class="section-shell split-section">
        <div>
          <p class="eyebrow">REPRODUCTION PROOF</p>
          <h2>Expected result</h2>
          <p>A clean checkout should complete validation with static route, chain API sanitization, kernel telemetry, toolchain registry, and verify-corpus checks passing. The failing fixture is intentionally represented as <code>FAIL_CLOSED</code>.</p>
        </div>
        <div class="doc-grid">
          <a href="/verify">Verification schemas and examples</a>
          <a href="/examples/verification-results/pass.example.json">Passing fixture</a>
          <a href="/examples/verification-results/fail-closed.example.json">Failing fixture</a>
        </div>
      </section>
      <section class="section-shell split-section">
        <div><p class="eyebrow">COMPATIBILITY AND CONTRIBUTION</p><h2>Keep the public boundary reproducible</h2><p>The supported local path uses Node 24 and the committed npm lockfile. Unsupported schema versions fail closed rather than being guessed. Public contributions belong in the repository; private vulnerabilities belong in the security reporting channel.</p></div>
        <div class="doc-grid">
          <a href="https://github.com/fenrualabs/fenrua-web">Repository contribution channel</a>
          <a href="/security">Private vulnerability reporting</a>
          <a href="/trust/claims">Capability and claim records</a>
          <a href="/data/capability-register.json">Download capability register JSON</a>
        </div>
      </section>`,
  });
}

function evidence() {
  const evidenceGroups = [
    {
      kicker: "01",
      title: "Current release evidence",
      text: "The release manifest and audit bind the current static artifact set at a point in time. Freshness ends when a later source-bound release supersedes it.",
      href: "/audit",
      link: "Release verification",
    },
    {
      kicker: "02",
      title: "Historical research evidence",
      text: "Kernel snapshots, regression records, and the frozen toolchain capture remain historical source evidence. They retain their named revision and limitation rather than becoming current release proof.",
      href: "/research",
      link: "Research records",
    },
    {
      kicker: "03",
      title: "Observation evidence",
      text: "Signed observations are short-lived and shown only through the bounded monitor after signature, sequence, and freshness checks. Static pages do not retain a current observation claim.",
      href: "/operations/observations",
      link: "Observation boundary",
    },
    {
      kicker: "04",
      title: "Independent evidence",
      text: "No independent reproduction or external-review record is currently published. A source record or internal test is not relabelled as independent assurance.",
      href: "/trust/evidence-classes",
      link: "Evidence-class limits",
    },
    {
      kicker: "05",
      title: "Superseded or revoked evidence",
      text: "No current registry entry is presented as revoked. Superseded records remain visible only with their replacement context and must not be read as current evidence.",
      href: "/audit",
      link: "Document status",
    },
  ];
  const rows = evidenceRecords.map(
    (record) => `<tr id="${attr(record.id)}">
      <td data-label="Artifact"><code>${esc(record.id)}</code><br>${esc(record.artifact)}<br><small>${esc(record.type)}</small></td>
      <td data-label="Claim">${esc(record.claim)}</td>
      <td data-label="Hash"><div class="hash-copy"><code class="hash-value">${esc(record.hash)}</code><button type="button" data-copy="${copyAttr(record.hash)}" data-copy-label="Full SHA copied">Copy hash</button></div></td>
      <td data-label="Source"><a href="${attr(record.sourceUrl)}">${esc(record.source)}</a><br><small>${esc(record.environment)}</small></td>
      <td data-label="Revisions"><div class="hash-stack"><code class="hash-value">${esc(record.sourceCommit)}</code><small>Evidence: <code class="hash-value">${esc(record.evidenceCommit)}</code></small></div></td>
      <td data-label="Producer">${esc(record.producer)}<br><small>${esc(record.toolchainSubset)}</small></td>
      <td data-label="Command"><code>${esc(record.command)}</code></td>
      <td data-label="Verified / Revocation">${esc(record.verified)}<br><small>Maturity: ${esc(record.maturity)} · Revocation: ${esc(record.revocationState)}</small></td>
      <td data-label="Supersession">${esc(record.supersedes)} / ${esc(record.supersededBy)}</td>
      <td data-label="Limitation">${esc(record.limitation)}<button type="button" data-copy="${copyAttr(evidenceCitation(record))}" data-copy-label="Evidence citation copied">Copy citation</button></td>
    </tr>`
  );
  const regressionRows = kernelTelemetry.regressions.map(
    (regression) => `<tr>
      <td data-label="Regression"><code>${esc(regression.id)}</code><br><small>${esc(regression.classification)}</small></td>
      <td data-label="Scope">${esc(regression.domain)} · ${esc(regression.operation)}</td>
      <td data-label="Result">${statusBadge(regression.status, regression.status.toUpperCase())}</td>
      <td data-label="Fixture">${esc(regression.fixture.name)} · ${esc(regression.fixture.bytes)} bytes<br><code class="hash-value">${esc(regression.fixture.sha256)}</code><button type="button" data-copy="${copyAttr(regression.fixture.sha256)}" data-copy-label="Fixture SHA copied">Copy hash</button></td>
      <td data-label="Evidence"><a href="${attr(regression.fixture.url)}">Fixture</a> · <a href="${attr(regression.report.url)}">Regression report</a><br><small>Record SHA-256 <code class="hash-value">${esc(regression.report.recordSha256)}</code><br>File SHA-256 <code class="hash-value">${esc(regression.report.fileSha256)}</code></small></td>
    </tr>`
  );
  return layout({
    title: "Fenrua Evidence Registry",
    description: "Fenrua public evidence registry with claims, hashes, provenance, supersession, maturity, and limitations.",
    current: "Evidence",
    scripts: '<script src="/toolchain/toolchain.js" defer></script>',
    body: assuranceScope("claims", ["claim.observation.signed-read-only"], `${routeHero("PUBLIC EVIDENCE", "Evidence Registry", "Current public release evidence is separated from historical source evidence and every record states its limitation.", `<div class="cta-row"><a class="button button-primary" href="/audit">Read current audit</a><a class="button button-secondary" href="/.well-known/fenrua-release.json">Release manifest</a></div>`)}
      <section class="section-shell" aria-labelledby="evidence-groups"><div class="section-heading"><p class="eyebrow">EVIDENCE STATE</p><h2 id="evidence-groups">Freshness and supersession stay visible</h2><p>Evidence type, freshness, authority, and what a record does not prove are separate dimensions. Empty categories remain explicit rather than being filled with a stronger claim.</p></div>
        ${cardGrid(evidenceGroups)}
      </section>
      <section class="section-shell">
        ${table(["Artifact", "Claim", "Hash", "Source", "Revisions", "Producer", "Command", "Verified / Revocation", "Supersession", "Limitation"], rows, "evidence-table", "Public evidence registry")}
      </section>
      <section class="section-shell">
        <div class="section-heading">
          <p class="eyebrow">PERMANENT REGRESSION</p>
          <h2>Published kernel regression snapshot</h2>
          <p>This table is generated from the validated, point-in-time kernel snapshot pinned to <code class="hash-value">${esc(snapshotCommit)}</code>. The scheduled synchronization updates this rendered table only after the public records and their internal hashes pass validation. It does not expose operands, witness material, raw fixture bytes, proving artifacts, private paths, or secrets.</p>
        </div>
        ${table(["Regression", "Scope", "Result", "Fixture", "Pinned evidence"], regressionRows, "regression-table", "Published permanent kernel regressions")}
      </section>`),
  });
}

function legal() {
  const boundary = siteEvidence.commercialBoundary;
  const operatingRecord = siteEvidence.legalOperatingRecord;
  const registryLinks = company.registrySources
    .map(
      (source) => `<p><strong>${esc(source.authority)}:</strong> <a href="${attr(source.url)}">Official registry source</a>${source.lookup ? ` · Lookup <code>${esc(source.lookup)}</code>` : ""}<br><small>${esc(source.scope)}</small></p>`
    )
    .join("\n          ");
  const offeringRows = operatingRecord.offerings.map(
    (record) => `<tr>
      <td data-label="Category">${esc(record.category)}</td>
      <td data-label="Current status">${statusBadge(record.badgeState, record.status)}</td>
      <td data-label="Public description">${esc(record.description)}</td>
    </tr>`
  );
  return layout({
    title: "Legal and Company Centre | Fenrua Labs",
    description: "Verified Fenrua Labs company identity, current public service scope, evidence boundaries, and contact information.",
    current: "Legal",
    canonicalPath: "/legal",
    body: `${routeHero("REGISTERED OPERATOR", "Legal and Company Centre", "Verified company identity and the current public scope for research, development, AI efficiency infrastructure software, related technology services, evidence, and contact.")}
      <section class="section-shell" aria-labelledby="company-identity-title">
        <div class="section-heading">
          <p class="eyebrow">COMPANY IDENTITY</p>
          <h2 id="company-identity-title">${esc(company.legalName)}</h2>
          <p>Registry details last verified ${esc(displayDate(company.lastVerified))}. No street address, director details, private contact data, or non-public registry material is published here.</p>
        </div>
        <dl class="record-facts company-facts">
          <div><dt>Australian Business Number</dt><dd><strong>ABN ${esc(company.abn)}</strong></dd></div>
          <div><dt>Australian Company Number</dt><dd><strong>ACN ${esc(company.acn)}</strong></dd></div>
          <div><dt>Company status</dt><dd>${esc(company.companyStatus)}</dd></div>
          <div><dt>Company type</dt><dd>${esc(company.companyType)}</dd></div>
          <div><dt>ABR entity type</dt><dd>${esc(company.entityType)}</dd></div>
          <div><dt>Registered</dt><dd>${esc(displayDate(company.registrationDate))}</dd></div>
          <div><dt>ABN status</dt><dd>${esc(company.abnStatus)}</dd></div>
          <div><dt>GST status</dt><dd>${esc(company.gstStatus)}</dd></div>
          <div><dt>Registered-office locality</dt><dd>${esc(company.registeredOffice.locality)} ${esc(company.registeredOffice.region)} ${esc(company.registeredOffice.postalCode)}, Australia</dd></div>
          <div><dt>Main business location</dt><dd>${esc(company.mainBusinessLocation.region)} ${esc(company.mainBusinessLocation.postalCode)}, Australia</dd></div>
          <div><dt>Company registry authority</dt><dd>${esc(company.regulator)}</dd></div>
          <div><dt>Next ASIC review</dt><dd>${esc(displayDate(company.nextReviewDate))} <small>(point-in-time registry record)</small></dd></div>
        </dl>
        <div class="constraint-list registry-source-list">
          ${registryLinks}
          <p><a href="/data/company-identity.json">Download the machine-readable company identity record</a>.</p>
        </div>
      </section>
      <section class="section-shell" aria-labelledby="legal-operating-record-title">
        <div class="section-heading">
          <p class="eyebrow">CURRENT OPERATING RECORD</p>
          <h2 id="legal-operating-record-title">What is public, offered, agreement-specific, or outside the current site</h2>
          <p>These labels describe the present operating model. They are not internal approval gates, future launch promises, or restrictions on ordinary Fenrua Labs business activity.</p>
        </div>
        ${table(["Category", "Current status", "Public description"], offeringRows, "status-table legal-operating-table", "Fenrua current operating and offering record")}
      </section>
      <section class="section-shell split-section" aria-labelledby="agreement-status-title">
        <div>
          <p class="eyebrow">BUSINESS OPERATIONS</p>
          <h2 id="agreement-status-title">Research and technology services</h2>
        </div>
        <div class="constraint-list">
          ${boundary.serviceAgreementBoundary.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("\n          ")}
          <p><strong>Current website state:</strong> public company information, technical documentation, evidence records, service discovery, and bounded read-only observation functions. Fenrua Labs may separately contract, invoice, receive payment, and deliver services through ordinary business arrangements.</p>
        </div>
      </section>
      <section class="section-shell split-section" aria-labelledby="commercial-operations-title">
        <div><p class="eyebrow">COMMERCIAL OPERATIONS</p><h2 id="commercial-operations-title">Ordinary business activity</h2></div>
        <div class="constraint-list">${boundary.businessOperationsBoundary.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("\n          ")}</div>
      </section>
      <section class="section-shell split-section" aria-labelledby="technology-scope-title">
        <div><p class="eyebrow">TECHNOLOGY SCOPE</p><h2 id="technology-scope-title">AI efficiency infrastructure and related services</h2></div>
        <div class="constraint-list">${operatingRecord.technologyScope.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("\n          ")}</div>
      </section>
      <section class="section-shell split-section" aria-labelledby="evidence-boundary-title">
        <div><p class="eyebrow">EVIDENCE SCOPE</p><h2 id="evidence-boundary-title">Point-in-time public records</h2></div>
        <div class="constraint-list">
          <p>Each public evidence record is limited to its named artifacts, revisions, timestamps, hashes, validation steps, maturity, and stated limitations.</p>
          <p>Periodic synchronization validates published records and internal bindings; it does not rerun the underlying research and validation work or attest live services, protected systems, private client environments, signing keys, private gateways, validators, private meshes, or operational controls beyond the record's stated scope.</p>
        </div>
      </section>
      <section class="section-shell split-section" aria-labelledby="request-handling-title">
        <div><p class="eyebrow">CURRENT REQUEST HANDLING</p><h2 id="request-handling-title">Public endpoint and contact facts</h2></div>
        <div class="constraint-list">${operatingRecord.requestHandling.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("\n          ")}</div>
      </section>
      <section class="section-shell split-section" aria-labelledby="contact-title">
        <div><p class="eyebrow">CONTACT</p><h2 id="contact-title">Public business contact</h2></div>
        <div class="constraint-list">
          <p>Business and collaboration enquiries: <a href="mailto:${attr(company.publicContact)}">${esc(company.publicContact)}</a>.</p>
          <p>Do not send private keys, credentials, witness material, client-confidential data, or unredacted vulnerability details through public channels.</p>
          <p>This centre records company identity and the current public operating scope. It does not amend any service terms, privacy notice, or client-specific agreement that applies in its own context.</p>
        </div>
      </section>`,
  });
}

function support() {
  return layout({
    title: "Fenrua Support and Contact",
    description: "Public Fenrua Labs contact routes and safe information-handling boundaries.",
    current: "Support",
    canonicalPath: "/support",
    body: `${routeHero("PUBLIC CONTACT", "Support and Contact", "Use the channel that matches the request and keep protected material out of public messages.")}
      <section class="section-shell">
        <div class="section-heading">
          <p class="eyebrow">CONTACT ROUTES</p>
          <h2>Choose a public channel</h2>
        </div>
        ${cardGrid([
          { kicker: "BUSINESS", title: "Partnerships and service enquiries", text: company.publicContact, href: `mailto:${company.publicContact}`, link: "Email Fenrua Labs" },
          { kicker: "WEBSITE SECURITY", title: "Private vulnerability report", text: "Use GitHub private vulnerability reporting for fenrua-web. Do not place exploit details in a public issue.", href: "https://github.com/fenrualabs/fenrua-web/security/advisories/new", link: "Open private report" },
          { kicker: "KERNEL SECURITY", title: "Kernel vulnerability report", text: "Use the kernel repository's private reporting channel for P/N521 or kernel findings.", href: "https://github.com/fenrualabs/fenrua-kernel/security/advisories/new", link: "Open private report" },
        ])}
      </section>
      <section class="section-shell split-section">
        <div><p class="eyebrow">HANDLING BOUNDARY</p><h2>What not to send</h2></div>
        <div class="constraint-list">
          <p>Do not email or publish private keys, credentials, access tokens, raw witness material, protected topology, personal information, or client-confidential data.</p>
          <p>Public repositories and evidence pages are not client-support systems. Service-specific support, response commitments, and data handling are governed only by the applicable subscription terms or client agreement.</p>
        </div>
      </section>`,
  });
}

function security() {
  return layout({
    title: "Fenrua Security Reporting",
    description: "Private vulnerability reporting channels and public evidence limitations for Fenrua Labs repositories.",
    current: "Security",
    canonicalPath: "/security",
    body: `${routeHero("RESPONSIBLE REPORTING", "Security Reporting", "Report vulnerabilities privately so they can be reproduced, contained, and documented without exposing users or protected systems.")}
      <section class="section-shell split-section">
        <div><p class="eyebrow">PRIVATE CHANNELS</p><h2>Repository-specific reporting</h2></div>
        <div class="constraint-list">
          <p><strong>Website and observation gateway:</strong> <a href="https://github.com/fenrualabs/fenrua-web/security/advisories/new">fenrua-web private vulnerability report</a>.</p>
          <p><strong>Kernel and P/N521 research artifacts:</strong> <a href="https://github.com/fenrualabs/fenrua-kernel/security/advisories/new">fenrua-kernel private vulnerability report</a>.</p>
          <p>Include the affected revision, exact reproduction steps, observed impact, and the minimum evidence required to validate the issue. Redact secrets and personal or client-confidential information.</p>
        </div>
      </section>
      <section class="section-shell split-section">
        <div><p class="eyebrow">ASSURANCE BOUNDARY</p><h2>Public evidence is scoped</h2></div>
        <div class="constraint-list">
          <p>A passing public artifact, test, hash, workflow, or audit record is evidence only for its stated revision and scope. It is not a perpetual security guarantee, external certification, or attestation of protected runtime systems.</p>
          <p>No response time, remediation deadline, bounty, safe-harbour term, or reward is promised by this page. Any such commitment must be separately published or agreed.</p>
        </div>
      </section>`,
  });
}

function accessibility() {
  return layout({
    title: "Fenrua Accessibility",
    description: "Fenrua public website accessibility features, testing scope, and contact route.",
    current: "Accessibility",
    canonicalPath: "/accessibility",
    body: `${routeHero("PUBLIC ACCESS", "Accessibility", "The public technical estate is designed for keyboard access, responsive inspection, readable contrast, and explicit status language.")}
      <section class="section-shell">
        <div class="section-heading">
          <p class="eyebrow">ACCESS FEATURES</p>
          <h2>Public interface practices</h2>
        </div>
        ${cardGrid([
          { kicker: "NAVIGATION", title: "Keyboard-first structure", text: "Skip links, landmarks, focus-visible controls, and keyboard-scrollable technical tables are part of the tested interface." },
          { kicker: "VIEWPORTS", title: "Responsive evidence", text: "Technical records preserve labels and limitations on narrow screens instead of hiding evidence columns." },
          { kicker: "CONTRAST", title: "System-aware presentation", text: "Dark-mode tokens, forced-colours support, and visible focus states are covered by repository checks." },
        ])}
      </section>
      <section class="section-shell split-section">
        <div><p class="eyebrow">LIMITATIONS AND CONTACT</p><h2>Report an access barrier</h2></div>
        <div class="constraint-list">
          <p>Automated and browser checks do not establish conformance for every assistive technology, browser, document, or user need.</p>
          <p>Report a reproducible public-site barrier to <a href="mailto:${attr(company.publicContact)}">${esc(company.publicContact)}</a>, including the route, browser or assistive technology, and the action that could not be completed.</p>
          <p>Audit and test-output reports are retained outside this source repository under the <a href="/docs/EXTERNAL_ARTIFACT_POLICY.md">external audit-artifact policy</a>.</p>
        </div>
      </section>`,
  });
}

function documentUrl(value) {
  return value.startsWith("/") ? value : `/${value}`;
}

function audit() {
  const records = documentRegister.records;
  if (!Array.isArray(records)) throw new Error("public-document-register.json must contain a records array.");
  const rows = records.map((record) => {
    const replacement = record.replacementPath ? `<a href="${attr(documentUrl(record.replacementPath))}">${esc(record.replacementPath)}</a>` : "—";
    const archive = record.path ? `<a href="${attr(documentUrl(record.path))}"><code>${esc(record.path)}</code></a>` : "—";
    return `<tr>
      <td data-label="Record"><code>${esc(record.id)}</code></td>
      <td data-label="Status">${statusBadge(record.status)}</td>
      <td data-label="Current / archive">${archive}</td>
      <td data-label="Replacement">${replacement}</td>
      <td data-label="Archived">${esc(record.archivedAt ?? "Current")}</td>
      <td data-label="Current artifact SHA-256"><code class="hash-value">${esc(record.artifactSha256 ?? record.hashBinding ?? "Included in release manifest")}</code></td>
      <td data-label="Original superseded SHA-256"><code class="hash-value">${esc(record.originalContentSha256 ?? "—")}</code></td>
    </tr>`;
  });
  const scope = siteEvidence.scope ?? {};
  return layout({
    title: "Fenrua Public Release Verification",
    description: "Current public static release evidence, document status, access-only commercial boundary, and explicit limitations.",
    current: "Audit",
    canonicalPath: "/audit",
    body: `${routeHero("CURRENT PUBLIC RELEASE", "Release Integrity Verification", "This page identifies the public static release evidence and its limits. It does not attest to dynamic observations, live block-card data, or protected systems.", `<div class="cta-row"><a class="button button-primary" href="/.well-known/fenrua-release.json">Open release manifest</a><a class="button button-secondary" href="/data/public-document-register.json">Download document register</a></div>`)}
      <section class="section-shell" aria-labelledby="release-verification-subject">
        <div class="section-heading"><p class="eyebrow">VERIFICATION SUBJECT</p><h2 id="release-verification-subject">Scope before assurance</h2><p>The release record is a public static-artifact verification surface. It is not a runtime, service-health, security-review, or authorization assertion.</p></div>
        <dl class="record-facts">
          <div><dt>Subject</dt><dd>Fenrua public static artifact set</dd></div>
          <div><dt>Source commit</dt><dd>Bound by the release manifest generated from the exact release checkout</dd></div>
          <div><dt>Artifact set</dt><dd>Listed files and SHA-256 values in the public release manifest</dd></div>
          <div><dt>Method</dt><dd>Deterministic static generation, repository validation, and manifest self-integrity checks</dd></div>
          <div><dt>Independent trust anchor</dt><dd>Retained site-evidence record digest: <code>${esc(siteEvidenceHash)}</code></dd></div>
          <div><dt>Time of observation</dt><dd>${esc(generatedIso)}</dd></div>
          <div><dt>Expiration / supersession</dt><dd>Superseded by a later source-bound release record; this page does not make future release claims</dd></div>
        </dl>
      </section>
      <section class="section-shell split-section">
        <div>
          <p class="eyebrow">STATIC RELEASE SCOPE</p>
          <h2>What this evidence binds</h2>
          <p>The release manifest is generated from the exact release checkout. It contains only a source commit, public static artifacts, content hashes, validation scope, and stated limitations.</p>
        </div>
        <div class="constraint-list">
          ${(scope.included ?? []).map((item) => `<p>${esc(item)}</p>`).join("\n          ")}
          <p><strong>Site evidence SHA-256:</strong> <code>${esc(siteEvidenceHash)}</code></p>
        </div>
      </section>
      <section class="section-shell split-section">
        <div>
          <p class="eyebrow">EXCLUSIONS</p>
          <h2>What remains outside public release proof</h2>
        </div>
        <div class="constraint-list">
          ${(scope.excluded ?? []).map((item) => `<p>${esc(item)}</p>`).join("\n          ")}
        </div>
      </section>
      <section class="section-shell">
        <div class="section-heading">
          <p class="eyebrow">DOCUMENT STATUS</p>
          <h2>Current, archived, and superseded public records</h2>
          <p>Archived records are retained only for continuity and are not current release evidence.</p>
        </div>
        ${table(["Record", "Status", "Current / archive", "Replacement", "Archived", "Current artifact SHA-256", "Original superseded SHA-256"], rows, "evidence-table", "Public document register")}
      </section>`,
  });
}

function status() {
  const staticRows = [
    ["Homepage", "success", "Published", "Routing surface", "index.html", "Static release artifact", "static route validation", "Live chain observations remain separate read-only public telemetry.", "Browser viewport matrix"],
    ["Architecture", "success", "Published", "Specification", "/architecture", "Static release artifact", "static route validation", "Architecture is descriptive, not a deployed control plane.", "Independent architecture review"],
    ["Kernel", "success", "Published", "Specification/reference mix", "/kernel", "Static release artifact", "static route validation", "Primitive maturity varies by row.", "Per-primitive evidence expansion"],
    ["Utilities", "success", "Published", "Catalogue", "/utilities", "Static release artifact", "static route validation", "No fake live utility service is claimed.", "SDK or CLI evidence"],
    ["Research registry", "success", "Published", "Evidence surface", "/research", "Static release artifact", "static route validation", "Dedicated pages expose current reproduction limits.", "Independent reproduction"],
    ["Verify examples", "partial", "Partial", "Prototype foundation", "/verify", "Fixture corpus", "fixture corpus validation", "No hosted verifier or upload model exists.", "Real verifier implementation"],
    ["Developer quick start", "success", "Published", "Reproducibility guide", "/developers", "Static release artifact", "clean checkout report", "Node 24 required.", "Tagged release reproduction"],
    ["Toolchain registry", "success", "Published", "Read-only release evidence", "data/toolchain-registry.json", "Frozen registry input", "registry validation", "Version capture is not security proof.", "New frozen evidence bundle"],
    ["Evidence registry", "success", "Published", "Evidence surface", "/evidence", "Static release artifact", "static route validation", "Evidence provenance is scoped to public artifacts.", "External evidence review"],
    ["Commercial boundary statement", "success", "Published", "Research and technology services", "/docs/ACCESS_ONLY_COMMERCIAL_BOUNDARY.md", "Public operating statement", "public boundary and company-identity validation", "The public site is an information and service-discovery surface; commercial services may be separately contracted and paid.", "Capability-specific interface records if a self-service feature is introduced"],
    ["Public repository", "success", "Published", "Source surface", "https://github.com/fenrualabs/fenrua-web", "Release provenance", "git provenance", "Repository state changes after each deployment.", "Tagged release"],
    ["Schema set", "success", "Published", "Specification", "/docs/", "Static specification set", "example corpus validation", "Schemas are examples/specifications, not a hosted validator.", "Schema validator package"],
  ].map(
    (r) => `<tr>
      <td data-label="Release record">${esc(r[0])}</td>
      <td data-label="Publication state">${statusBadge(r[1], r[2])}</td>
      <td data-label="Maturity">${esc(r[3])}</td>
      <td data-label="Public artifact"><span class="status-artifact-value" title="${attr(r[4])}">${esc(r[4])}</span></td>
      <td data-label="Evidence basis">${esc(r[5])}</td>
      <td data-label="Validation scope">${esc(r[6])}</td>
      <td data-label="Current limitation">${esc(r[7])}</td>
      <td data-label="Next evidence gate">${esc(r[8])}</td>
    </tr>`
  );
  const monitorRows = [
    ["978", "Chain 978 observation", "A current observation is not activation history, contract assurance, bytecode identity, reserve proof, deployment assurance, or a safety guarantee."],
    ["521", "Chain N521 observation", "A current observation is not activation history, contract assurance, bytecode identity, reserve proof, deployment assurance, or a safety guarantee."],
  ]
    .map(
      ([chain, title, limitation]) => `<tr data-status-monitor-row="${attr(chain)}">
        <td data-label="Public monitor"><strong>${esc(title)}</strong><br><small>Bounded public observation</small></td>
        <td data-label="Current public state"><span class="status-badge" data-status-monitor-state>Checking</span></td>
        <td data-label="Last signed observation" data-status-monitor-time>Checking for a signed public observation.</td>
        <td data-label="Signed sequence" data-status-monitor-sequence>Not yet verified</td>
        <td data-label="Observed block" data-status-monitor-block>Not yet verified</td>
        <td data-label="Evidence basis" data-status-monitor-source>Public monitor pending</td>
        <td data-label="Freshness" data-status-monitor-freshness>Awaiting monitor response</td>
        <td data-label="Scope limitation">${esc(limitation)}</td>
      </tr>`
    );
  return layout({
    title: "Fenrua Status",
    description: "Fenrua public signed-observation monitor and static release-status reference.",
    current: "Status",
    scripts: '<script src="/status-monitor.js" defer></script>',
    body: assuranceScope("claims", ["claim.observation.signed-read-only", "claim.observation.observed-block-label"], `${routeHero("STATUS AND PUBLIC OBSERVATIONS", "Status", "Current signed observations are monitored separately from static release records. A release record is never presented as a chain event or activation time.")}
      <section class="section-shell">
        <div class="toolchain-summary state-grid">
          ${statusCards
            .map(
              ([state, label, explanation, retry]) => `<article data-state="${attr(state)}">
                <span>${esc(state)}</span>
                <strong>${esc(label)}</strong>
                <p>${esc(explanation)}</p>
                <small>Reference definition · Retry: ${esc(retry)}</small>
              </article>`
            )
            .join("\n")}
        </div>
      </section>
      <section class="section-shell" aria-labelledby="status-planes-title">
        <div class="section-heading"><p class="eyebrow">STATUS PLANE BOUNDARIES</p><h2 id="status-planes-title">What each status can and cannot mean</h2><p>Publication, service, dependency, observation, incident, and maintenance status remain separate. This page does not publish uptime or an SLO because the required measured service history is not available.</p></div>
        ${cardGrid(statusPlanes.map(([title, text, href], index) => ({ kicker: String(index + 1).padStart(2, "0"), title, text, href, link: "Open related record" })))}
      </section>
      <section class="section-shell">
        <div class="section-heading">
          <p class="eyebrow">LIVE SIGNED OBSERVATIONS</p>
          <h2>Current public monitor</h2>
          <p>Each chain row is populated only from the bounded public observation endpoint. “Last signed observation” is that chain’s signed observation time, not an activation event or release-build time.</p>
        </div>
        <p class="status-monitor-meta" data-status-monitor-meta>Checking the bounded public monitor. No current chain state is asserted until a signed observation is returned.</p>
        <span class="sr-only" data-status-monitor-announcer role="status" aria-live="polite" aria-atomic="true"></span>
        <p class="mobile-data-notice"><strong>Mobile view is optimised for record-by-record inspection.</strong> Monitor rows preserve exact UTC observation times, signed sequence, and freshness scope.</p>
        ${table(["Public monitor", "Current public state", "Last signed observation", "Signed sequence", "Observed block", "Evidence basis", "Freshness", "Scope limitation"], monitorRows, "status-table status-monitor-table", "Current public signed observations")}
      </section>
      <section class="section-shell">
        <div class="section-heading">
          <p class="eyebrow">STATIC RELEASE RECORDS</p>
          <h2>Public release inventory</h2>
          <p>These are static publication records, not runtime monitors. They intentionally have no per-row event timestamp; use the <a href="/.well-known/fenrua-release.json">current release manifest</a> for source-commit and artifact-hash evidence.</p>
        </div>
        <p class="mobile-data-notice"><strong>Static release records are not live checks.</strong> Their validation scope and limitations remain visible without implying a current event.</p>
        ${table(["Release record", "Publication state", "Maturity", "Public artifact", "Evidence basis", "Validation scope", "Current limitation", "Next evidence gate"], staticRows, "status-table static-release-table", "Static public release records")}
      </section>`),
  });
}

function toolchain() {
  const tools = registry.tools;
  const rowAttributes = (tool, index, tags, search) =>
    `data-page="${Math.floor(index / 25) + 1}" data-search="${attr(search.toLowerCase())}" data-status="${attr(tool.status)}" data-tags="${attr(tags.join(" "))}" data-mode="${attr(tool.installationMode)}" data-category="${attr(tool.category)}" data-installed="${tool.installed}" data-evidence="${tool.evidenceProduced}" data-tool-name="${attr(tool.tool.toLowerCase())}"`;
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
    return `<tr data-tool-row ${rowAttributes(tool, index, tags, search)}>
      <td>${esc(tool.tool)}<br><small>${esc(tool.function)}</small></td>
      <td><code>${esc(tool.detectedVersion)}</code><button type="button" data-copy="${copyAttr(tool.detectedVersion)}" data-copy-label="Full version copied">Copy version</button></td>
      <td>${esc(tool.category)}</td>
      <td>${esc(tool.installationMode)}</td>
      <td><div class="tag-stack">${tags.map((tag) => `<span class="status-badge">${esc(tag)}</span>`).join("")}</div></td>
      <td data-label="Evidence links">${toolchainEvidenceLinks(tool)}</td>
      <td><div class="command-list">${(tool.commands ?? []).map((command) => `<code>${esc(command)}</code>`).join("")}</div></td>
      <td><div class="table-prose">${esc(tool.limitations)}</div></td>
    </tr>`;
  });
  const mobileCards = tools.map((tool, index) => {
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
    const primaryStatus = tags.includes("VERSION_VERIFIED")
      ? "Version verified"
      : tags.includes("UNAVAILABLE")
        ? "Unavailable"
        : tags.includes("DETECTED")
          ? "Detected"
          : tool.status.replaceAll("_", " ").toLowerCase();
    return `<article class="tool-record-card" data-tool-card ${rowAttributes(tool, index, tags, search)}>
        <details>
          <summary>
            <span class="tool-record-title">${esc(tool.tool)}</span>
            <span class="tool-record-function">${esc(tool.function)}</span>
            <span class="tool-record-summary-grid">
              <span><strong>Version</strong><code>${esc(tool.detectedVersion)}</code></span>
              <span><strong>Status</strong>${esc(primaryStatus)}</span>
              <span><strong>Evidence</strong>${tool.evidenceProduced ? "Yes" : "No"}</span>
            </span>
            <span class="tool-record-action">View details</span>
          </summary>
          <div class="tool-record-details">
            <div><strong>Full detected version</strong><code>${esc(tool.detectedVersion)}</code><button type="button" data-copy="${copyAttr(tool.detectedVersion)}" data-copy-label="Full version copied">Copy version</button></div>
            <div><strong>Category</strong>${esc(tool.category)}</div>
            <div><strong>Installation mode</strong>${esc(tool.installationMode)}</div>
            <div><strong>Delivery tags</strong><div class="tag-stack">${tags.map((tag) => `<span class="status-badge">${esc(tag)}</span>`).join("")}</div></div>
            <div><strong>Evidence links</strong>${toolchainEvidenceLinks(tool)}</div>
            <div><strong>Verification command</strong><div class="command-list">${(tool.commands ?? []).map((command) => `<code>${esc(command)}</code>`).join("")}</div></div>
            <details class="limitation-disclosure">
              <summary>Known limitations</summary>
              <p>${esc(tool.limitations)}</p>
            </details>
          </div>
        </details>
      </article>`;
  }).join("\n        ");
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
        <p class="table-note" id="toolchain-limitations"><button type="button" data-copy="${copyAttr(registryHash)}" data-copy-label="Full SHA copied">Copy registry hash</button> The displayed taxonomy is derived from frozen registry fields. Evidence-producing and campaign-executed are separate: campaign execution requires a declared validation command in the frozen record, while a version or list command is only <strong>VERSION_VERIFIED</strong>.</p>
      </section>
      <section class="section-shell">
        <p class="mobile-data-notice"><strong>Mobile view is optimised for record-by-record inspection.</strong> Desktop offers the full comparison layout. All evidence remains available here.</p>
        <div class="registry-tools toolchain-tools">
          <label for="tool-search">Search tools</label>
          <input id="tool-search" type="search" autocomplete="off" placeholder="Search tool, command, category, status, or limitation..." />
          <div class="tool-sort-row">
            <label for="tool-sort">Sort</label>
            <select id="tool-sort">
              <option value="source">Registry order</option>
              <option value="tool">Tool name</option>
              <option value="category">Category</option>
              <option value="status">Status</option>
            </select>
            <button type="button" data-clear-filters>Clear filters</button>
            <span data-active-filter-count>0 active filters</span>
          </div>
          <details class="filter-disclosure" data-filter-disclosure>
            <summary>Filters <span data-active-filter-count>0 active filters</span></summary>
            <div class="filter-groups" aria-label="Toolchain filters">
              <button type="button" data-filter="all" aria-pressed="true">All</button>
              <button type="button" data-filter="detected">Detected</button>
              <button type="button" data-filter="version-verified">Version verified</button>
              <button type="button" data-filter="smoke-tested">Smoke tested</button>
              <button type="button" data-filter="evidence">Evidence-producing</button>
              <button type="button" data-filter="campaign-executed">Campaign executed</button>
              <button type="button" data-filter="canonical-pipeline">Canonical pipeline</button>
              <button type="button" data-filter="container">Container-only</button>
              <button type="button" data-filter="project-local">Project-local</button>
              <button type="button" data-filter="exploratory">Exploratory</button>
              <button type="button" data-filter="superseded">Superseded</button>
              <button type="button" data-filter="version-review">Version review required</button>
              <button type="button" data-filter="unavailable">Unavailable</button>
              ${categories.map((category) => `<button type="button" data-category-filter="${attr(category)}">${esc(category.replace(" and ", " & "))}</button>`).join("\n              ")}
            </div>
          </details>
          <div class="pagination-controls" aria-label="Toolchain pagination">
            <button type="button" data-page-action="prev">Previous</button>
            <span data-page-status role="status" aria-live="polite" aria-atomic="true">Page 1</span>
            <button type="button" data-page-action="next">Next</button>
          </div>
        </div>
        ${table(["Tool", "Detected Version", "Category", "Mode", "Delivery Tags", "Evidence links", "Command", "Limitations"], rows, "toolchain-table")}
        <div class="toolchain-mobile-list" aria-label="Toolchain mobile records">
          ${mobileCards}
        </div>
        <p class="empty-state" id="toolchain-empty" hidden>No tools match the active filter.</p>
      </section>`,
  });
}

writeRoute("", home());
writeRoute("platform", platform());
writeRoute("architecture", architecture());
for (const view of architectureViews) writeRoute(path.join("architecture", view.slug), architectureView(view));
writeRoute("kernel", kernel());
writeRoute("utilities", utilities());
writeRoute("research", researchIndex());
for (const item of researchItems) writeRoute(path.join("research", item.slug), researchPage(item));
writeRoute("verify", verify());
writeRoute("developers", developers());
writeRoute("start", start());
writeRoute("trust", trust());
writeRoute(path.join("trust", "claims"), trustClaims());
writeRoute(path.join("trust", "evidence-classes"), trustEvidenceClasses());
writeRoute("evidence", evidence());
writeRoute("audit", audit());
writeRoute("operations", operations());
writeRoute(path.join("operations", "observations"), observations());
writeRoute("status", status());
writeRoute("toolchain", toolchain());
writeRoute("company", companyHub());
writeRoute("legal", legal());
writeRoute("support", support());
writeRoute("security", security());
writeRoute("accessibility", accessibility());

const sitemapRoutes = [
  "",
  "platform",
  "architecture",
  ...architectureViews.map((view) => `architecture/${view.slug}`),
  "kernel",
  "utilities",
  "research",
  ...researchItems.map((item) => `research/${item.slug}`),
  "verify",
  "developers",
  "start",
  "trust",
  "trust/claims",
  "trust/evidence-classes",
  "evidence",
  "audit",
  "operations",
  "operations/observations",
  "status",
  "toolchain",
  "company",
  "legal",
  "support",
  "security",
  "accessibility",
];
writeGenerated(
  path.join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes
  .map(
    (route) => `  <url>
    <loc>https://fenrua.ai/${route}</loc>
    <lastmod>${generatedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`
);

if (checkMode && staleGeneratedFiles.length > 0) {
  console.error(`Generated static files are stale:\n${staleGeneratedFiles.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}

console.log(
  JSON.stringify({
    status: "ok",
    mode: checkMode ? "check" : "write",
    routes: sitemapRoutes.length,
    tools: registry.tools.length,
    registryHash,
  })
);
