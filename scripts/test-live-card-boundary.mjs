import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const [html, kernelStatus] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../kernel-status.js", import.meta.url), "utf8"),
]);
const boundaries = [
  {
    name: "header live block cards",
    start: '<div class="header-chain-rail mobile-chain-rail"',
    end: "    </header>",
    sha256: "9bfc88ca41ebd4e5e07163eda320c7f3fa3ce0e904c8f4778029d269ac260d78",
  },
  {
    name: "desktop live block cards",
    start: '<section id="chain-progress"',
    end: '      <section class="section-shell" aria-labelledby="home-answers">',
    sha256: "3d84e7ddbecd02450ff81bd63b3dd7ed64003be20c99b4ad0828410bae7e4dc6",
  },
];

for (const boundary of boundaries) {
  const start = html.indexOf(boundary.start);
  const end = html.indexOf(boundary.end, start);
  assert.ok(start >= 0 && end > start, `${boundary.name} must remain present.`);
  const digest = createHash("sha256").update(html.slice(start, end)).digest("hex");
  assert.equal(digest, boundary.sha256, `${boundary.name} is a frozen public boundary.`);
}

assert.equal(
  [...html.matchAll(/data-chain-meta="announcer"/g)].length,
  1,
  "Overview must expose one polite telemetry announcer across its responsive card sets."
);

assert.match(
  kernelStatus,
  /sourceHeader: '\.header-chain-card \[data-chain-field="978-source"\]'/,
  "Header cards must retain their labeled Evidence source field."
);
assert.match(
  kernelStatus,
  /sourceResult: '\.desktop-chain-progress \[data-chain-field="978-source"\]'/,
  "Overview result rows must have their own Evidence source target."
);
assert.match(
  kernelStatus,
  /setText\(fields\.sourceResult, formatSourceValue\(confirmation\.evidenceSource\)\);/,
  "Overview result values must not repeat their Evidence source label."
);
assert.doesNotMatch(
  html.slice(html.indexOf(boundaries[0].start), html.indexOf(boundaries[0].end, html.indexOf(boundaries[0].start))),
  /data-chain-field="(?:978|521)-confidence"/,
  "Compact live-block cards must not duplicate the detailed Confidence field."
);
assert.match(
  kernelStatus,
  /if \(value === "confirmed"\) return "Confirmed";/,
  "The Confidence result must render only its value because the visible term already supplies the label."
);
assert.doesNotMatch(
  kernelStatus,
  /return "Confidence: confirmed";/,
  "The Confidence result must not repeat its visible field label."
);
assert.match(kernelStatus, /payload\.version !== 1/, "Overview must reject unknown telemetry schema versions.");
assert.match(
  kernelStatus,
  /allowedChainStates = new Set\(\["live", "delayed", "partial", "waiting", "unavailable"\]\)/,
  "Overview must allowlist every public chain state."
);
assert.match(
  kernelStatus,
  /if \(chain\.status === "live"\)[\s\S]{0,160}return \{ label: "Live", state: "confirmed" \};[\s\S]{0,160}return \{ label: "Failure", state: "unavailable" \};/,
  "Unknown card states must fail closed rather than defaulting to Live."
);
assert.match(
  kernelStatus,
  /Feed failure; browser-session high-water preserved/,
  "A refresh failure must remove current-state claims while preserving only labelled session history."
);

console.log(JSON.stringify({ status: "ok", scope: "frozen-live-card-boundary", boundaries: boundaries.length }));
