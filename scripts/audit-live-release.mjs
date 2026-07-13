import { createHash } from "node:crypto";
import { canonicalJson, verifyReleaseManifest } from "./release-manifest-lib.mjs";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? "" : args[index + 1] || "";
};
const base = (valueAfter("--url") || "https://fenrua.ai").replace(/\/$/, "");
const expectedCommit = valueAfter("--expected-commit").toLowerCase();
const commitPattern = /^[0-9a-f]{40}$/;

if (expectedCommit && !commitPattern.test(expectedCommit)) throw new Error("--expected-commit must be a 40-character lowercase SHA.");

async function fetchExact(pathname) {
  const response = await fetch(`${base}${pathname}`, { redirect: "manual", headers: { "cache-control": "no-cache" } });
  const body = Buffer.from(await response.arrayBuffer());
  return { response, body };
}

const { response: manifestResponse, body: manifestBody } = await fetchExact("/.well-known/fenrua-release.json");
if (manifestResponse.status !== 200) throw new Error(`Release manifest returned ${manifestResponse.status}.`);
const manifest = JSON.parse(manifestBody.toString("utf8"));
verifyReleaseManifest(manifest);
if (expectedCommit && manifest.record.release.sourceCommit !== expectedCommit) throw new Error("Live source commit does not match --expected-commit.");

const failures = [];
for (const artifact of manifest.record.publicArtifactSet.artifacts) {
  const { response, body } = await fetchExact(artifact.route);
  const digest = createHash("sha256").update(body).digest("hex");
  if (response.status !== 200 || body.length !== artifact.bytes || digest !== artifact.sha256) {
    failures.push({ route: artifact.route, status: response.status, bytes: body.length, sha256: digest });
  }
}

for (const route of ["/genesis", "/regression"]) {
  const { response } = await fetchExact(route);
  if (response.status !== 308 || response.headers.get("location") !== "/audit") failures.push({ route, redirectStatus: response.status, location: response.headers.get("location") });
}

if (failures.length > 0) {
  console.error(JSON.stringify({ status: "failed", base, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify({
    status: "ok",
    base,
    sourceCommit: manifest.record.release.sourceCommit,
    aggregateSha256: manifest.record.publicArtifactSet.aggregateSha256,
    artifacts: manifest.record.publicArtifactSet.artifacts.length,
    canonicalRecordBytes: Buffer.byteLength(canonicalJson(manifest.record), "utf8"),
  })
);
