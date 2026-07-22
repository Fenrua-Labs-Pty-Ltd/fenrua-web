import assert from "node:assert/strict";
import {
  MAX_RELEASE_ARTIFACTS,
  MAX_RELEASE_DECLARED_BYTES,
  MAX_RELEASE_MANIFEST_BYTES,
  canonicalJson,
  parseReleaseManifestBody,
  releaseArtifactAggregateSha256,
  sha256,
  verifyReleaseManifest,
} from "./release-manifest-lib.mjs";
import {
  LiveReleaseAuditError,
  auditLiveRelease,
  fetchBounded,
  mandatoryLiveRoutes,
} from "./audit-live-release.mjs";

const commit = "a".repeat(40);
const rootBody = Buffer.from("<!doctype html><title>Fenrua</title>");

function recordFor(artifacts = [{ route: "/", bytes: rootBody.length, sha256: sha256(rootBody) }]) {
  return {
    schema: "fenrua.web.release-evidence.v1",
    release: {
      canonicalUrl: "https://fenrua.ai",
      project: "fenrua-web",
      sourceCommit: commit,
      sourceEvidenceGeneratedAt: "2026-07-13T00:00:00.000Z",
      publisher: {
        legalName: "FENRUA LABS PTY LTD",
        abn: "62 700 182 663",
        acn: "700 182 663",
      },
    },
    publicArtifactSet: {
      algorithm: "sha256",
      aggregateSha256: releaseArtifactAggregateSha256(artifacts),
      artifacts,
    },
    validation: {
      requiredCommand: "npm run build:release",
      scope: "test artifact scope",
    },
    limitations: ["Static files only."],
  };
}

function manifestFor(record = recordFor()) {
  return {
    record,
    integrity: {
      algorithm: "sha256",
      canonicalization: "sorted UTF-8 JSON object keys",
      recordSha256: sha256(canonicalJson(record)),
    },
  };
}

function clone(value) {
  return structuredClone(value);
}

function reseal(manifest) {
  manifest.integrity.recordSha256 = sha256(canonicalJson(manifest.record));
  return manifest;
}

const valid = manifestFor();
verifyReleaseManifest(valid);
assert.deepEqual(parseReleaseManifestBody(JSON.stringify(valid)), valid);

{
  const candidate = clone(valid);
  candidate.record.release.sourceCommit = "a".repeat(39);
  assert.throws(() => verifyReleaseManifest(reseal(candidate)), /full 40-character lowercase Git SHA/);
}
{
  const candidate = clone(valid);
  candidate.record.release.publisher.legalName = "NOT FENRUA";
  assert.throws(() => verifyReleaseManifest(reseal(candidate)), /registered company identity/);
}
{
  const candidate = clone(valid);
  candidate.record.release.canonicalUrl = "https://fenrua.ai/path";
  assert.throws(() => verifyReleaseManifest(reseal(candidate)), /canonical HTTPS origin/);
}
{
  const candidate = clone(valid);
  candidate.record.publicArtifactSet.artifacts = [];
  candidate.record.publicArtifactSet.aggregateSha256 = releaseArtifactAggregateSha256([]);
  assert.throws(() => verifyReleaseManifest(reseal(candidate)), /at least one public artifact/);
}
{
  const candidate = clone(valid);
  candidate.record.publicArtifactSet.artifacts[0].unexpected = true;
  assert.throws(() => verifyReleaseManifest(reseal(candidate)), /must contain exactly/);
}
{
  const artifact = { route: "/a/../b", bytes: 1, sha256: "b".repeat(64) };
  assert.throws(() => verifyReleaseManifest(manifestFor(recordFor([artifact]))), /normalized route/);
}
{
  const artifact = { route: "/a//b", bytes: 1, sha256: "b".repeat(64) };
  assert.throws(() => verifyReleaseManifest(manifestFor(recordFor([artifact]))), /absolute same-origin path/);
}
{
  const artifact = { route: "/same", bytes: 1, sha256: "b".repeat(64) };
  assert.throws(() => verifyReleaseManifest(manifestFor(recordFor([artifact, clone(artifact)]))), /Duplicate public artifact route/);
}
{
  const artifacts = [
    { route: "/z", bytes: 1, sha256: "b".repeat(64) },
    { route: "/a", bytes: 1, sha256: "c".repeat(64) },
  ];
  assert.throws(() => verifyReleaseManifest(manifestFor(recordFor(artifacts))), /strictly sorted/);
}
{
  const candidate = clone(valid);
  candidate.record.publicArtifactSet.artifacts[0].bytes = 0;
  candidate.record.publicArtifactSet.aggregateSha256 = releaseArtifactAggregateSha256(candidate.record.publicArtifactSet.artifacts);
  assert.throws(() => verifyReleaseManifest(reseal(candidate)), /positive safe integer/);
}
{
  const artifacts = Array.from({ length: MAX_RELEASE_ARTIFACTS + 1 }, (_value, index) => ({
    route: `/artifact-${String(index).padStart(4, "0")}.txt`,
    bytes: 1,
    sha256: "b".repeat(64),
  }));
  assert.throws(() => verifyReleaseManifest(manifestFor(recordFor(artifacts))), /artifact verification limit/);
}
{
  const artifacts = [
    { route: "/a.txt", bytes: Math.floor(MAX_RELEASE_DECLARED_BYTES / 2) + 1, sha256: "b".repeat(64) },
    { route: "/b.txt", bytes: Math.floor(MAX_RELEASE_DECLARED_BYTES / 2) + 1, sha256: "c".repeat(64) },
  ];
  assert.throws(() => verifyReleaseManifest(manifestFor(recordFor(artifacts))), /aggregate verification limit/);
}
{
  const candidate = clone(valid);
  candidate.record.publicArtifactSet.artifacts[0].sha256 = "A".repeat(64);
  candidate.record.publicArtifactSet.aggregateSha256 = releaseArtifactAggregateSha256(candidate.record.publicArtifactSet.artifacts);
  assert.throws(() => verifyReleaseManifest(reseal(candidate)), /lowercase SHA-256/);
}
{
  const candidate = clone(valid);
  candidate.record.publicArtifactSet.aggregateSha256 = "f".repeat(64);
  assert.throws(() => verifyReleaseManifest(reseal(candidate)), /aggregate hash does not match/);
}
{
  const candidate = clone(valid);
  candidate.record.release.project = "altered";
  assert.throws(() => verifyReleaseManifest(candidate), /Unsupported release manifest project/);
}
{
  const candidate = clone(valid);
  candidate.record.limitations[0] = "Hash-breaking mutation.";
  assert.throws(() => verifyReleaseManifest(candidate), /record hash does not match/);
}

assert.throws(() => parseReleaseManifestBody(Buffer.alloc(0)), /empty/);
assert.throws(() => parseReleaseManifestBody("   \n"), /empty/);
assert.throws(() => parseReleaseManifestBody('{"record":'), /not complete valid JSON/);
assert.throws(() => parseReleaseManifestBody(new Uint8Array([0xff])), /not valid UTF-8/);
assert.throws(
  () => parseReleaseManifestBody(Buffer.alloc(MAX_RELEASE_MANIFEST_BYTES + 1, 0x20)),
  /exceeds the .*byte limit/,
);

const fixedBodies = new Map([
  ["/", { body: rootBody, type: "text/html; charset=utf-8", status: 200 }],
  ["/kernel-status.js", { body: "globalThis.kernelStatus = {};", type: "application/javascript; charset=utf-8", status: 200 }],
  ["/legal", { body: "<!doctype html><title>Legal</title>", type: "text/html; charset=utf-8", status: 200 }],
  ["/data/company-identity.json", { body: '{"legalName":"FENRUA LABS PTY LTD","abn":"62 700 182 663","acn":"700 182 663"}', type: "application/json; charset=utf-8", status: 200 }],
  ["/.well-known/security.txt", { body: "Contact: mailto:security@fenrua.ai\n", type: "text/plain; charset=utf-8", status: 200 }],
  ["/sitemap.xml", { body: "<?xml version=\"1.0\"?><urlset></urlset>", type: "application/xml", status: 200 }],
  ["/site.webmanifest", { body: '{"name":"Fenrua"}', type: "application/manifest+json; charset=utf-8", status: 200 }],
  ["/genesis", { body: "", type: "", status: 308, location: "/audit" }],
  ["/regression", { body: "", type: "", status: 308, location: "/audit" }],
]);

function fetchStub(manifest, overrides = new Map()) {
  return async (url) => {
    const pathname = new URL(url).pathname;
    if (pathname === "/.well-known/fenrua-release.json") {
      return new Response(JSON.stringify(manifest), { status: 200, headers: { "content-type": "application/json; charset=utf-8" } });
    }
    const entry = overrides.has(pathname) ? overrides.get(pathname) : fixedBodies.get(pathname);
    if (!entry) return new Response("not found", { status: 404, headers: { "content-type": "text/plain" } });
    const headers = {};
    if (entry.type) headers["content-type"] = entry.type;
    if (entry.location) headers.location = entry.location;
    return new Response(entry.body || null, { status: entry.status, headers });
  };
}

const auditArtifacts = [...fixedBodies.entries()]
  .filter(([route, entry]) => entry.status === 200 && (mandatoryLiveRoutes.some((required) => required.route === route) || route === "/site.webmanifest"))
  .map(([route, entry]) => {
    const body = Buffer.from(entry.body);
    return { route, bytes: body.length, sha256: sha256(body) };
  })
  .sort((left, right) => left.route.localeCompare(right.route));
const auditManifest = manifestFor(recordFor(auditArtifacts));

assert.deepEqual(mandatoryLiveRoutes.map(({ route }) => route), [
  "/",
  "/kernel-status.js",
  "/legal",
  "/data/company-identity.json",
  "/.well-known/security.txt",
  "/sitemap.xml",
]);

const auditResult = await auditLiveRelease({
  baseUrl: "https://preview.example",
  expectedCommit: commit,
  expectedRecordSha256: auditManifest.integrity.recordSha256,
  fetchImpl: fetchStub(auditManifest),
});
assert.equal(auditResult.status, "ok");
assert.equal(auditResult.mandatoryRoutes, mandatoryLiveRoutes.length);
assert.equal(auditResult.trustedRecordDigestMatched, true);
assert.equal(auditResult.verificationMode, "trusted-record-digest");

const selfConsistencyResult = await auditLiveRelease({
  baseUrl: "https://preview.example",
  selfConsistencyOnly: true,
  fetchImpl: fetchStub(auditManifest),
});
assert.equal(selfConsistencyResult.trustedRecordDigestMatched, false);
assert.equal(selfConsistencyResult.verificationMode, "unanchored-self-consistency");

await assert.rejects(
  auditLiveRelease({ baseUrl: "https://preview.example", fetchImpl: fetchStub(auditManifest) }),
  /requires --expected-record-sha256.*--self-consistency-only/,
);

await assert.rejects(
  auditLiveRelease({ baseUrl: "https://preview.example", expectedCommit: "b".repeat(40), selfConsistencyOnly: true, fetchImpl: fetchStub(auditManifest) }),
  /does not match --expected-commit/,
);
await assert.rejects(
  auditLiveRelease({ baseUrl: "https://preview.example", expectedRecordSha256: "b".repeat(64), fetchImpl: fetchStub(auditManifest) }),
  /does not match --expected-record-sha256/,
);

await assert.rejects(
  auditLiveRelease({ baseUrl: "https://preview.example", selfConsistencyOnly: true, fetchImpl: fetchStub(valid) }),
  (error) => error instanceof LiveReleaseAuditError && error.failures.some((failure) => failure.issue === "mandatory route omitted from release manifest"),
);

await assert.rejects(
  auditLiveRelease({
    baseUrl: "https://preview.example",
    selfConsistencyOnly: true,
    fetchImpl: fetchStub(auditManifest, new Map([["/.well-known/security.txt", { body: "missing", type: "text/plain", status: 404 }]])),
  }),
  (error) => error instanceof LiveReleaseAuditError && error.failures.some((failure) => failure.route === "/.well-known/security.txt"),
);

await assert.rejects(
  auditLiveRelease({
    baseUrl: "https://preview.example",
    selfConsistencyOnly: true,
    fetchImpl: fetchStub(auditManifest, new Map([["/data/company-identity.json", { body: "{}", type: "text/plain", status: 200 }]])),
  }),
  (error) => error instanceof LiveReleaseAuditError && error.failures.some((failure) => failure.route === "/data/company-identity.json" && /Content-Type/.test(failure.issue)),
);

await assert.rejects(
  auditLiveRelease({
    baseUrl: "https://preview.example",
    selfConsistencyOnly: true,
    fetchImpl: fetchStub(auditManifest, new Map([["/data/company-identity.json", { body: "{}", type: "application/json", status: 200 }]])),
  }),
  (error) => error instanceof LiveReleaseAuditError && error.failures.some((failure) => failure.route === "/data/company-identity.json" && /company identity mismatch/.test(failure.issue)),
);

await assert.rejects(
  fetchBounded("https://preview.example/large", {
    maxBytes: 3,
    fetchImpl: async () => new Response("four", { headers: { "content-type": "text/plain", "content-length": "4" } }),
  }),
  /body limit/,
);

await assert.rejects(
  fetchBounded("https://preview.example/malformed-length", {
    maxBytes: 10,
    fetchImpl: async () => new Response("ok", { headers: { "content-type": "text/plain", "content-length": "two" } }),
  }),
  /Content-Length is malformed/,
);

assert.equal(
  (await fetchBounded("https://preview.example/exact", {
    maxBytes: 3,
    fetchImpl: async () => new Response("123", { headers: { "content-type": "text/plain", "content-length": "3" } }),
  })).body.length,
  3,
);

await assert.rejects(
  fetchBounded("https://preview.example/streamed-large", {
    maxBytes: 3,
    fetchImpl: async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1, 2, 3, 4])); controller.close(); } })),
  }),
  /body limit/,
);

await assert.rejects(
  fetchBounded("https://preview.example/slow", {
    timeoutMs: 10,
    maxBytes: 10,
    fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true })),
  }),
  /timed out/,
);

await assert.rejects(
  fetchBounded("https://preview.example/global-slow", {
    timeoutMs: 1_000,
    maxBytes: 10,
    signal: AbortSignal.timeout(10),
    fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true })),
  }),
  /global deadline/,
);

console.log(JSON.stringify({ status: "ok", scope: "release-verifier-hardening", mandatoryRoutes: mandatoryLiveRoutes.length }));
