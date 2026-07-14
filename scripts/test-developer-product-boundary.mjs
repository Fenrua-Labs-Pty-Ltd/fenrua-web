import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [capabilitiesSource, platform, developers, verify] = await Promise.all([
  readFile(new URL("../data/capability-register.json", import.meta.url), "utf8"),
  readFile(new URL("../platform/index.html", import.meta.url), "utf8"),
  readFile(new URL("../developers/index.html", import.meta.url), "utf8"),
  readFile(new URL("../verify/index.html", import.meta.url), "utf8"),
]);
const capabilities = JSON.parse(capabilitiesSource).capabilities;
const trustGate = capabilities.find((capability) => capability.id === "capability.local-trust-gate");

assert.ok(trustGate, "Capability register must define the Local Trust Gate boundary.");
assert.equal(trustGate.lifecycle, "planned");
assert.equal(trustGate.maturity, "research");
assert.equal(trustGate.availability, "not-available");
assert.equal(trustGate.claimIds.length, 0);
assert.equal(trustGate.evidenceIds.length, 0);
for (const text of ["no public implementation", "CLI", "SDK", "API", "release artifact"]) {
  assert.match(trustGate.nonClaims.join(" "), new RegExp(text, "i"), `Local Trust Gate non-claim must retain ${text}.`);
}

for (const html of [platform, developers, verify]) {
  assert.doesNotMatch(html, /npm install --global .*fenrua|fenrua gate evaluate/i, "Website must not render an unavailable Local Trust Gate command.");
}
assert.match(platform, /Local Trust Gate/);
assert.match(platform, /not-available/);
assert.match(platform, /class="capability-card" data-capability-id="capability\.local-trust-gate" data-capability-availability="not-available"/, "Platform must render the canonical planned Trust Gate record rather than a product surface.");
assert.match(platform, /<dt>Lifecycle<\/dt><dd>planned<\/dd>/, "Platform must preserve the canonical planned lifecycle.");
assert.match(platform, /No public interface recorded\./, "Platform must expose the missing public interface as an explicit boundary.");
assert.match(platform, /No public Local Trust Gate package or hosted verifier is available\.|No public implementation, CLI, SDK, API, hosted interface, or release artifact is recorded\./, "Platform must retain the exact non-availability boundary.");
assert.match(platform, /href="\/trust\/claims#capability\.local-trust-gate">Inspect boundary<\/a>/, "Platform must link the planned capability to its canonical public record.");
assert.doesNotMatch(platform, /\/platform\/trust-gate|data-product-command|data-product-result/, "Platform must not create a dedicated product surface before the Trust Gate promotion gate.");
assert.match(verify, /No live server-side verifier is claimed/);

console.log(JSON.stringify({ status: "ok", scope: "developer-product-boundary", lifecycle: trustGate.lifecycle, availability: trustGate.availability }));
