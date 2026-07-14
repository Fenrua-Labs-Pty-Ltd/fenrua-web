import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./generate-static-routes.mjs", import.meta.url), "utf8");

for (const fragment of [
  "const publicModelPaths",
  "function layout(",
  "function routeHero(",
  "function capabilityRecord(",
  "function claimRecord(",
  "function evidenceClassCard(",
  "const architectureViews",
  "function writeRoute(",
  "const sitemapRoutes",
]) {
  assert.ok(source.includes(fragment), `Static generator must retain modular contract: ${fragment}`);
}

assert.doesNotMatch(source, /new Date\(\)/, "Generated content must use approved source timestamps rather than wall-clock time.");
assert.match(source, /const generatedIso = siteEvidence\.generatedAt/);
assert.match(source, /const generatedDate = contentModifiedDate/);
assert.match(source, /function esc\(value\)/, "Generated content must escape public data.");
assert.match(source, /function attr\(value\)/, "Generated attributes must escape public data.");
assert.match(source, /if \(checkMode\)/, "Generator must retain a stale-output check mode.");

console.log(JSON.stringify({ status: "ok", scope: "generator-modularity-contract" }));
