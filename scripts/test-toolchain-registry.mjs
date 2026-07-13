import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const registry = JSON.parse(await readFile(new URL("../data/toolchain-registry.json", import.meta.url), "utf8"));
const requiredStatuses = [
  "INSTALLED_AND_EXECUTED",
  "INSTALLED_EXECUTED_EVIDENCE_PRODUCING",
  "INSTALLED_EXPLORATORY",
  "PROJECT_LOCAL",
  "CONTAINER_ONLY",
  "SUPERSEDED",
  "VERSION_REVIEW_REQUIRED",
  "NOT_IN_CANONICAL_PIPELINE",
  "DEPRECATED",
  "UNAVAILABLE",
];

assert.equal(registry.schemaVersion, "fenrua.toolchain-registry.v1");
assert.ok(Array.isArray(registry.tools) && registry.tools.length > 80, "tool registry must include the public inventory");
assert.deepEqual(registry.statusVocabulary, requiredStatuses);
assert.match(
  registry.evidenceLockIntegrityPolicy.projectDependencyReview.fenruaWebDependencyDrift,
  /Pinned Playwright and Vercel development dependencies/
);
assert.equal(registry.evidenceLockIntegrityPolicy.postEvidenceMutation.toolchainUpdatesPerformed, true);

const byName = new Map(registry.tools.map((tool) => [tool.tool, tool]));

const semgrep = byName.get("Semgrep");
assert.ok(semgrep, "Semgrep must be present");
assert.equal(semgrep.detectedVersion, "1.169.0");
assert.equal(semgrep.status, "INSTALLED_AND_EXECUTED");
assert.ok(!semgrep.status.includes("VERSION_REVIEW_REQUIRED"));

const snarkjs = byName.get("SnarkJS");
assert.ok(snarkjs, "SnarkJS must be present");
assert.match(snarkjs.detectedVersion, /0\.7\.6/);
assert.doesNotMatch(snarkjs.detectedVersion, /1\.13\.8/);

const node = byName.get("Node.js");
assert.equal(node?.evidenceProduced, true);

const playwright = byName.get("Playwright");
assert.equal(playwright?.detectedVersion, "@playwright/test 1.61.1");
assert.equal(playwright?.status, "INSTALLED_EXECUTED_EVIDENCE_PRODUCING");
assert.equal(playwright?.evidenceProduced, true);
assert.match(playwright?.limitations ?? "", /homepage live cards, APIs, and protected systems are excluded/i);

const serialized = JSON.stringify(registry);
for (const forbidden of ["/home/", "/mnt/d/", "samue", "FENCHAIN_RPC_URL", "ghp_", "sk-", "AKIA"]) {
  assert.ok(!serialized.includes(forbidden), `registry must not expose ${forbidden}`);
}

console.log(
  JSON.stringify({
    status: "ok",
    scope: "toolchain-registry",
    tools: registry.tools.length,
    semgrep: semgrep.detectedVersion,
    snarkjs: snarkjs.detectedVersion,
  })
);
