import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function document(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function requireText(path, text) {
  assert.ok(document(path).includes(text), `${path} must include ${JSON.stringify(text)}.`);
}

const requiredDocuments = [
  "docs/PRODUCT_CONSTITUTION.md",
  "docs/DOMAIN_MODEL.md",
  "docs/DECISION_SEMANTICS.md",
  "docs/TRUST_BOUNDARY.md",
  "docs/PROMOTION_GATES.md",
  "docs/COMPATIBILITY_POLICY.md",
  "docs/CRYPTOGRAPHIC_PROFILES.md",
  "docs/FENRUA_TRUST_GATE_V0_1_CONTRACT.md",
  "docs/FENRUA_TRUST_GATE_BOOTSTRAP.md",
  "docs/API_ERROR_CONTRACT.md",
  "docs/THREAT_MODEL_INDEX.md",
  "docs/FENRUA_INDUSTRIAL_10_INTEGRATION_MANIFEST.md",
  "docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md",
  "docs/LEGACY_VERIFIER_CORPUS_DISPOSITION.md",
  "docs/adr/ADR-0001-TRUST-GATE-REPOSITORY-BOUNDARY.md",
  "docs/adr/ADR-0002-LOCAL-TRUST-GATE-IMPLEMENTATION.md",
];

for (const path of requiredDocuments) {
  const contents = document(path);
  assert.match(contents, /Status:/, `${path} must declare a status.`);
  assert.doesNotMatch(
    contents,
    /\b(?:Local )?Trust Gate\s+(?:is\s+)?(?:available|generally available|production ready|industrial assured)\b/i,
    `${path} must not promote an unreleased Trust Gate.`
  );
}

requireText("docs/PRODUCT_CONSTITUTION.md", "The Local Trust Gate is currently planned.");
requireText("docs/PRODUCT_CONSTITUTION.md", "no public-chain requirement");
requireText("docs/PRODUCT_CONSTITUTION.md", "P/N521 remains research");
requireText("docs/DECISION_SEMANTICS.md", "A `PASS` verification result is not an `ALLOW` decision.");
requireText("docs/DECISION_SEMANTICS.md", "`continueExecution`");
requireText("docs/DECISION_SEMANTICS.md", "not a Trust Gate output field");

for (const command of [
  "fenrua version [--json]",
  "fenrua schema list [--json]",
  "fenrua manifest validate <file> [--json]",
  "fenrua policy validate <file> [--json]",
  "fenrua request validate <file> [--json]",
  "fenrua revocations validate <file> [--json]",
  "fenrua gate evaluate --manifest <file> --policy <file> --request <file> --revocations <file> --at <RFC3339-UTC> --output <receipt> --evidence-output <bundle>",
  "fenrua evidence verify <bundle> [--at <RFC3339-UTC>] [--json]",
  "fenrua receipt inspect <receipt> [--json]",
  "fenrua doctor [--json]",
]) {
  requireText("docs/FENRUA_TRUST_GATE_V0_1_CONTRACT.md", command);
}
for (const strictRule of [
  "duplicate JSON keys",
  "unknown fields in strict schema objects",
  "No match, ambiguity, unknown requirement",
  "No file arguments name local, regular files",
]) {
  if (strictRule === "No file arguments name local, regular files") {
    requireText("docs/FENRUA_TRUST_GATE_V0_1_CONTRACT.md", "All file arguments name local, regular files.");
  } else {
    requireText("docs/FENRUA_TRUST_GATE_V0_1_CONTRACT.md", strictRule);
  }
}
for (const field of ["type", "title", "status", "code", "detail", "correlationId", "retryable", "limitations"]) {
  requireText("docs/API_ERROR_CONTRACT.md", `\`${field}\``);
}
requireText("docs/API_ERROR_CONTRACT.md", "No stack trace, SQL, filesystem path");
requireText("docs/FENRUA_TRUST_GATE_BOOTSTRAP.md", "fenrua-verify/");
requireText("docs/FENRUA_TRUST_GATE_BOOTSTRAP.md", "Public Repository Admission Controls");
requireText("docs/FENRUA_TRUST_GATE_BOOTSTRAP.md", "External Gates That A Public Scaffold Cannot Satisfy");
requireText("docs/FENRUA_TRUST_GATE_BOOTSTRAP.md", "does not make a Trust Gate interface available");
requireText("docs/adr/ADR-0002-LOCAL-TRUST-GATE-IMPLEMENTATION.md", "Rust core library and CLI");
requireText("docs/adr/ADR-0002-LOCAL-TRUST-GATE-IMPLEMENTATION.md", "strict parser must reject duplicate JSON keys");
requireText("docs/adr/ADR-0002-LOCAL-TRUST-GATE-IMPLEMENTATION.md", "Go core");
requireText("docs/adr/ADR-0002-LOCAL-TRUST-GATE-IMPLEMENTATION.md", "Node/TypeScript core");
requireText("docs/adr/ADR-0002-LOCAL-TRUST-GATE-IMPLEMENTATION.md", "C++ extension to `fenrua-kernel`");
requireText("docs/FENRUA_TRUST_GATE_V0_1_CONTRACT.md", "fenrua.verification-vector.v1");
requireText("docs/FENRUA_TRUST_GATE_V0_1_CONTRACT.md", "roles cannot be substituted for one another.");
requireText("docs/LEGACY_VERIFIER_CORPUS_DISPOSITION.md", "not a Trust Gate schema or product output");
requireText("docs/LEGACY_VERIFIER_CORPUS_DISPOSITION.md", "continueExecution");
requireText("docs/FENRUA_VERIFICATION_RESULT_SPEC.md", "historical explanatory verifier-result shape");
requireText("docs/FENRUA_ENTITY_MANIFEST_SPEC.md", "rejects unknown fields in");

const legacyScenarioDirectory = resolve(root, "examples", "verification-results");
for (const file of readdirSync(legacyScenarioDirectory).filter((entry) => entry.endsWith(".json"))) {
  const fixture = JSON.parse(readFileSync(resolve(legacyScenarioDirectory, file), "utf8"));
  assert.equal(fixture.schema, "fenrua.legacy-verification-scenario.v1", `${file} must not claim the reserved verifier-result identifier.`);
  assert.equal(Object.hasOwn(fixture, "continueExecution"), false, `${file} must not direct execution.`);
  assert.equal(Object.hasOwn(fixture, "decision"), false, `${file} must not carry an authorisation decision.`);
}

for (const entity of [
  "Tenant",
  "Environment",
  "Entity",
  "Operator",
  "Workload",
  "Agent",
  "Model",
  "Tool",
  "Artifact",
  "Build",
  "Deployment",
  "Policy",
  "PolicyRevision",
  "Approval",
  "Request",
  "Decision",
  "EvidenceBundle",
  "Receipt",
  "Verification",
  "Revocation",
  "Key",
  "KeyVersion",
  "TrustProfile",
  "CompatibilityProfile",
  "Incident",
  "Release",
  "Observation",
]) {
  requireText("docs/DOMAIN_MODEL.md", `| ${entity} |`);
}

for (const reasonCode of [
  "ALLOW_POLICY_MATCH",
  "DENY_EXPLICIT",
  "DENY_NO_MATCH",
  "DENY_SIGNATURE_INVALID",
  "DENY_POLICY_REVOKED",
  "DENY_SUBJECT_REVOKED",
  "DENY_ARTIFACT_REVOKED",
  "DENY_KEY_REVOKED",
  "DENY_STALE_REVOCATION_STATE",
  "DENY_REPLAY",
  "DENY_FAIL_CLOSED",
]) {
  requireText("docs/DECISION_SEMANTICS.md", reasonCode);
}
requireText("docs/DECISION_SEMANTICS.md", "A `PASS` verification result is not an `ALLOW` decision.");

for (const profile of ["local-unsigned-development", "ed25519-v1", "p256-v1", "enterprise-provider-v1"]) {
  requireText("docs/CRYPTOGRAPHIC_PROFILES.md", profile);
}
requireText("docs/CRYPTOGRAPHIC_PROFILES.md", "P/N521 research material, are excluded");

for (const level of ["R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7"]) {
  requireText("docs/PROMOTION_GATES.md", `| ${level} |`);
}
requireText("docs/PROMOTION_GATES.md", "No capability may skip directly from R2 to R6.");

for (const contract of [
  "Product vocabulary",
  "Capability maturity",
  "Entity identifiers",
  "Schema conventions",
  "Error envelope",
  "Decision result codes",
  "Signature profiles",
  "Evidence bundle",
  "Tenant context",
  "API versioning",
  "Timestamp/freshness",
  "Revocation",
  "Audit event",
  "Repository boundaries",
  "Promotion gates",
]) {
  requireText("docs/FENRUA_INDUSTRIAL_10_INTEGRATION_MANIFEST.md", contract);
}

for (const field of [
  "Repository owner",
  "Classification",
  "Source/artifact",
  "Dependencies",
  "Secrets",
  "Data",
  "Release",
  "Archival",
  "Maintenance",
]) {
  requireText("docs/adr/ADR-0001-TRUST-GATE-REPOSITORY-BOUNDARY.md", field);
}
requireText("docs/adr/ADR-0001-TRUST-GATE-REPOSITORY-BOUNDARY.md", "Owner approval was required before repository creation.");
requireText("docs/adr/ADR-0001-TRUST-GATE-REPOSITORY-BOUNDARY.md", "repository creation authorized");

for (const column of [
  "Requirement and source",
  "Classification / impact",
  "Technical solution and owner",
  "Exact operator dependency",
  "Evidence and acceptance test",
  "Status / deferral basis",
]) {
  requireText("docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md", column);
}
requireText("docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md", "F10-PT-004");
requireText("docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md", "provider deployment success from being treated as rendered-content verification");
requireText("docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md", "Resolved 2026-07-14; preview observation states remain preview evidence, not live-chain claims");
requireText("docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md", "dpl_bL85hoMwEwWKAUF7xZWdS9RY2A1K");
requireText("docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md", "b374487a4bb389086a3a6f72ca24ffbc0c38bc6e");
requireText("docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md", "281e3b08d9a6c6e6a7b56bf4fc815391992a1333");
requireText("docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md", "5cae1dc4ac80733395dd50915762e1a01dfd7c9e");
requireText("docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md", "R2 bounded source scope resolved 2026-07-14");
requireText("docs/FENRUA_TRUST_GATE_BOOTSTRAP.md", "R1 source foundation implemented");
requireText("docs/FENRUA_TRUST_GATE_BOOTSTRAP.md", "https://github.com/fenrualabs/fenrua-trust-gate");
requireText("docs/adr/ADR-0001-TRUST-GATE-REPOSITORY-BOUNDARY.md", "## Implementation Record");

console.log(JSON.stringify({ status: "ok", scope: "industrial-contract-freeze", documents: requiredDocuments.length }));
