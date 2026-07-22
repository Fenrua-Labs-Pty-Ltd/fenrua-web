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

const trustBoundaries = await readFile(new URL("../architecture/trust-boundaries/index.html", import.meta.url), "utf8");
for (const statement of [
  "CLIENT-SAFE ARCHITECTURE",
  "Public evidence. Private execution.",
  "Evidence Before Authority",
  "Protected private execution",
  "Bounded public evidence return",
  "Capability is not authority.",
  "Stage 0 architecture evidence note:",
]) {
  assert.ok(trustBoundaries.includes(statement), `Client-safe architecture package must state: ${statement}`);
}
assert.match(
  trustBoundaries,
  /public presentation, a signature, or a capability label cannot grant authority by itself/,
  "Client-safe architecture must preserve the authority boundary."
);
assert.match(
  trustBoundaries,
  /does not assert production readiness, external certification, public tenant availability, or a Stage 0 PASS/,
  "Client-safe architecture must preserve the public claim boundary."
);

console.log(JSON.stringify({ status: "ok", scope: "architecture-trust", views: views.length, chainFreeSteps: chainFreeSequence.length }));
