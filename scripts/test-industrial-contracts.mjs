import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  "docs/THREAT_MODEL_INDEX.md",
  "docs/FENRUA_INDUSTRIAL_10_INTEGRATION_MANIFEST.md",
  "docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md",
  "docs/adr/ADR-0001-TRUST-GATE-REPOSITORY-BOUNDARY.md",
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
requireText("docs/adr/ADR-0001-TRUST-GATE-REPOSITORY-BOUNDARY.md", "owner approval required before repository creation");

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

console.log(JSON.stringify({ status: "ok", scope: "industrial-contract-freeze", documents: requiredDocuments.length }));
