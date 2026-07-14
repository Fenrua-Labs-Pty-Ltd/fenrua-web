import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const views = [
  "context",
  "components",
  "runtime",
  "deployment",
  "trust-boundaries",
  "data-and-provenance",
  "recovery",
  "evolution",
];
const architecture = await readFile(new URL("../architecture/index.html", import.meta.url), "utf8");

for (const view of views) {
  assert.match(architecture, new RegExp(`href="/architecture/${view}"`), `Architecture index must link ${view}.`);
  const html = await readFile(new URL(`../architecture/${view}/index.html`, import.meta.url), "utf8");
  assert.match(html, /<ol class="architecture-diagram"/, `${view} must render a semantic diagram.`);
  assert.match(html, /Text equivalent:/, `${view} must render a diagram text equivalent.`);
  assert.match(html, /CURRENT IMPLEMENTATION BOUNDARY/, `${view} must state its implementation boundary.`);
  assert.match(html, /<em>(?:Current|Reference|Specification|Prototype|Planned|External|Optional external|Agreement-specific|Protected|Specification and research)<\/em>/, `${view} must label component state in text.`);
}

const deployment = await readFile(new URL("../architecture/deployment/index.html", import.meta.url), "utf8");
const chainFreeSequence = [
  "Local developer or CI",
  "Entity manifest",
  "Authority policy",
  "Local deterministic decision",
  "Evidence bundle",
  "Local signature verification",
  "Receipt export",
];
let previous = -1;
for (const step of chainFreeSequence) {
  const position = deployment.indexOf(step);
  assert.ok(position > previous, `Chain-free profile must preserve ordered step: ${step}.`);
  previous = position;
}
for (const statement of [
  "No public chain is required for local verification.",
  "supports offline operation",
  "revocation freshness",
  "cannot create authorization",
  "Optional external",
]) {
  assert.ok(deployment.includes(statement), `Chain-free deployment must state: ${statement}`);
}

const dataAndProvenance = await readFile(new URL("../architecture/data-and-provenance/index.html", import.meta.url), "utf8");
assert.match(dataAndProvenance, /Tenancy and isolation boundary/);
assert.match(dataAndProvenance, /no multi-tenant public control plane is claimed/);

console.log(JSON.stringify({ status: "ok", scope: "architecture-trust", views: views.length, chainFreeSteps: chainFreeSequence.length }));
