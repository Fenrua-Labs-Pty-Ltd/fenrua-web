import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const document = readFileSync(resolve(root, "docs/VERCEL.md"), "utf8");

for (const text of [
  "## Preview and production gates",
  "Codex does not deploy, run the Vercel CLI",
  "independently retained release-record digest",
  "designated last-known-good (LKG) commit",
  "expected route-lifecycle revision and legal-route state",
  "source work is code-complete but\nproduction-unverified",
  "## Rollback and external cleanup",
  "route lifecycle must not restore contradictory legacy product or legal\n  content",
  "Retired `/terms`, `/privacy`, and `/cookies` routes remain safely\n  retired",
  "Codex\n  does not purge a cache",
  "source and target key IDs",
  "replay, equivocation, or retired-key reuse risk",
  "npm run audit:live-release",
  "npm run audit:live-routes",
  "npm run audit:live-search-surface",
  "owner-designated external audit location",
]) {
  assert.ok(document.includes(text), `Release rollback documentation is missing: ${text}`);
}

assert.doesNotMatch(document, /(?:deployment|production)\s+(?:has been|was)\s+verified/i, "The runbook must not claim completed deployment verification.");
assert.doesNotMatch(
  document,
  /\b(?:VERCEL_TOKEN|VERCEL_ORG_ID|VERCEL_PROJECT_ID)\s*=\s*(?!<[^>\n]+>)[^\s`]+/i,
  "The runbook must not contain a credential assignment or value."
);
assert.doesNotMatch(document, /\b(?:automatic rollback|automatically roll back|one-click rollback)\b/i, "The runbook must retain owner-controlled rollback.");

console.log(JSON.stringify({ status: "ok", scope: "release-rollback-runbook" }));
