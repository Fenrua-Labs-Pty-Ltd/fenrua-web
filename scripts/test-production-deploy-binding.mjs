import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const vercel = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
const deploymentNotes = readFileSync(resolve(root, "docs/VERCEL.md"), "utf8");
const safePublishing = readFileSync(resolve(root, "docs/SAFE_WEBSITE_PUBLISHING.md"), "utf8");
const ownerWorkflow = readFileSync(resolve(root, "docs/OWNER_APPROVED_RELEASE_WORKFLOW.md"), "utf8");
const agents = readFileSync(resolve(root, "AGENTS.md"), "utf8");
const deploymentCommandPath = resolve(root, "scripts/deploy-production-node24.mjs");
const deploymentCommand = readFileSync(deploymentCommandPath, "utf8");

assert.equal(packageJson.engines?.node, "24.x", "The public site must retain its audited Node major line.");
assert.equal(packageJson.scripts?.["deploy:production:node24"], "node scripts/deploy-production-node24.mjs");
assert.equal(vercel.buildCommand, "npm run build:release");
assert.equal(vercel.outputDirectory, "public");

for (const document of [deploymentNotes, safePublishing, ownerWorkflow, agents]) {
  assert.match(document, /Owner-approved/i, "The repository must retain Owner-approved release control.");
  assert.match(document, /fenrua-public-operations-system/i, "The approved operations control plane must remain explicit.");
}

assert.match(agents, /Repository-Wide Owner-Approved Release Rule/);
assert.match(agents, /screenshot/i);
assert.match(agents, /protected merge/i);
assert.match(ownerWorkflow, /OWNER_APPROVES_EXACT_RELEASE/);
assert.match(ownerWorkflow, /SAM_OWNER/);
assert.match(ownerWorkflow, /must never store, request, view, copy, echo, or transmit credentials/i);
assert.match(deploymentNotes, /The deployment command never runs the Vercel CLI/i);
assert.match(deploymentNotes, /independently retained release-record digest/i);
assert.match(deploymentNotes, /designated last-known-good \(LKG\) commit/i);

assert.match(deploymentCommand, /retired and fail-closed/i);
assert.match(deploymentCommand, /fenrua-public-operations-system/i);
assert.match(deploymentCommand, /Owner's protected merge/i);
assert.doesNotMatch(deploymentCommand, /spawnSync|\bgh\b|fetch\(|VERCEL_TOKEN|api\/repos/i);

const result = spawnSync(process.execPath, [deploymentCommandPath], { encoding: "utf8" });
assert.equal(result.status, 1, "The public compatibility command must always fail closed.");
assert.match(result.stderr, /Public-repository production deployment is retired and fail-closed/);
assert.match(result.stderr, /Only the Owner's protected merge/);

console.log(JSON.stringify({ status: "ok", scope: "owner-approved-private-production-binding" }));
