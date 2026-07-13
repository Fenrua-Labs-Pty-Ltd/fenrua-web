import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyReleaseManifest } from "./release-manifest-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, ".well-known", "fenrua-release.json");
assert.ok(existsSync(manifestPath), "Generate the release manifest before validating it.");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
verifyReleaseManifest(manifest);

assert.equal(manifest.record.schema, "fenrua.web.release-evidence.v1");
assert.equal(manifest.record.release.project, "fenrua-web");
assert.match(manifest.record.release.sourceCommit, /^[0-9a-f]{40}$/);
assert.ok(manifest.record.publicArtifactSet.artifacts.length > 0);
assert.ok(!manifest.record.publicArtifactSet.artifacts.some((artifact) => artifact.route === "/" || artifact.route.includes("kernel-status") || artifact.route.includes("api/")));
const routes = manifest.record.publicArtifactSet.artifacts.map((artifact) => artifact.route);
assert.deepEqual(routes, [...routes].sort((left, right) => left.localeCompare(right)), "Manifest artifacts must be sorted by public route.");
assert.equal(new Set(routes).size, routes.length, "Manifest artifact routes must be unique.");
assert.ok(routes.includes("/audit"));
assert.ok(routes.includes("/data/public-document-register.json"));
for (const artifact of manifest.record.publicArtifactSet.artifacts) {
  assert.match(artifact.route, /^\//);
  assert.match(artifact.sha256, /^[0-9a-f]{64}$/);
  assert.ok(Number.isInteger(artifact.bytes) && artifact.bytes > 0);
}
assert.ok(manifest.record.limitations.some((item) => /live block cards/i.test(item)));
for (const forbidden of ["FENCHAIN_RPC_URL", "VERCEL_TOKEN", "ghp_", "sk-", "AKIA"]) {
  assert.ok(!JSON.stringify(manifest).includes(forbidden), `Release manifest must not expose ${forbidden}.`);
}

console.log(JSON.stringify({ status: "ok", scope: "public-static-release-manifest", artifacts: manifest.record.publicArtifactSet.artifacts.length }));
