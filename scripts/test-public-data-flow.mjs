import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const document = readFileSync(resolve(root, "docs/PUBLIC_DATA_FLOW.md"), "utf8");
const observationAdapter = readFileSync(resolve(root, "api/chain-progress.js"), "utf8");
const documentRegister = JSON.parse(readFileSync(resolve(root, "data/public-document-register.json"), "utf8"));

const requiredFields = [
  "Data",
  "Purpose",
  "Processor/controller boundary",
  "Storage",
  "Retention state",
  "Exposure",
  "User action",
  "Source/evidence",
  "Unknowns needing owner/legal review",
];
const requiredFlows = [
  "Normal Page Request",
  "CDN and Hosting Metadata",
  "Signed Observation Endpoint and Abuse Control",
  "Business Enquiries",
  "Vulnerability Reporting",
  "GitHub Contribution Channels",
  "Social Profile Links",
  "Browser Storage",
  "Future Local File Handling",
  "Hosted API Boundary",
];

function sectionFor(heading) {
  const marker = `## ${heading}`;
  const start = document.indexOf(marker);
  assert.notEqual(start, -1, `Missing public data flow heading: ${heading}`);
  const end = document.indexOf("\n## ", start + marker.length);
  return document.slice(start, end === -1 ? document.length : end);
}

for (const flow of requiredFlows) {
  const section = sectionFor(flow);
  for (const field of requiredFields) {
    assert.match(section, new RegExp(`\\| ${field} \\|`), `${flow} must include ${field}.`);
  }
  assert.match(section, /\[[^\]]+\]\([^\)]+\)/, `${flow} must link its source evidence.`);
}

for (const text of [
  "salted SHA-256 in-memory abuse-control key",
  "60-second window",
  "10,000 entries",
  "never forwarded to JSON-RPC or private mesh transport",
  "partnerships@fenrua.ai",
  "private GitHub security advisory flow",
  "GitHub, X, and LinkedIn",
  "do not use cookies, localStorage, sessionStorage, IndexedDB",
  "Local Trust Gate has no public implementation, CLI, SDK, API, hosted interface, or release artifact",
  "do not accept user uploads, transactions, public RPC forwarding, or administrative commands",
]) {
  assert.ok(document.includes(text), `Public data flow must retain its evidence-bound statement: ${text}`);
}

assert.match(observationAdapter, /const rateLimitWindowMs = 60_000;/, "Observation adapter must retain the documented abuse window.");
assert.match(observationAdapter, /const rateLimitMaximumRequests = 60;/, "Observation adapter must retain the documented request cap.");
assert.match(observationAdapter, /const rateLimitMaximumEntries = 10_000;/, "Observation adapter must retain the documented memory cap.");
assert.match(observationAdapter, /The raw address is not logged or retained/, "Observation adapter must retain the raw-address boundary.");
assert.ok(
  documentRegister.records.some((record) => record.id === "public-data-flow" && record.status === "active" && record.path === "docs/PUBLIC_DATA_FLOW.md"),
  "Public data flow must be registered as an active public document."
);
assert.doesNotMatch(document, /\b(?:GDPR compliant|fully compliant|legally compliant|guaranteed|anonymous|zero data|no tracking)\b/i, "Public data flow must not invent legal or privacy assurance.");
assert.doesNotMatch(document, /\b(?:365 days|30 days|90 days|one year|two years)\b/i, "Public data flow must not invent a provider retention schedule.");

console.log(JSON.stringify({ status: "ok", scope: "public-data-flow", flows: requiredFlows.length }));
