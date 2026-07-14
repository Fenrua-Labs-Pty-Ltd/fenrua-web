import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(resolve(root, relativePath), "utf8");
const document = read("docs/FENRUA_AI_EFFICIENCY_EVIDENCE_STANDARD.md");
const documentRegister = JSON.parse(read("data/public-document-register.json"));
const platform = read("platform/index.html");
const normalisedDocument = document.replace(/\s+/g, " ");

for (const heading of [
  "## Purpose",
  "## Definition",
  "## Required Claim Envelope",
  "## Candidate Measures",
  "## Measurement Protocol",
  "## Publication Gate",
  "## Promotion Boundary",
  "## Evidence Retention And Supersession",
  "## Non-Claims",
]) {
  assert.ok(document.includes(heading), `AI efficiency standard must include ${heading}.`);
}

for (const field of [
  "Workload definition",
  "Baseline",
  "Environment",
  "Measurement method",
  "Quality constraint",
  "Uncertainty",
  "Reproducible artifact",
]) {
  assert.ok(document.includes(field), `AI efficiency standard must require ${field}.`);
}

assert.match(normalisedDocument, /No current performance, latency, throughput, energy, cost, or comparative efficiency result is published by this standard\./);
assert.match(normalisedDocument, /They must not be described as faster, lower cost, more efficient, production-ready, or generally available\./);
assert.ok(
  documentRegister.records.some(
    (record) => record.id === "ai-efficiency-evidence-standard"
      && record.status === "active"
      && record.path === "docs/FENRUA_AI_EFFICIENCY_EVIDENCE_STANDARD.md",
  ),
  "AI efficiency standard must be registered as an active public document.",
);
assert.match(platform, /href="\/docs\/FENRUA_AI_EFFICIENCY_EVIDENCE_STANDARD\.md">AI efficiency evidence standard<\/a>/);
assert.match(platform, /does not publish a measured AI-efficiency benchmark/i);

console.log(JSON.stringify({ status: "ok", scope: "ai-efficiency-evidence-standard", requiredFields: 7 }));
