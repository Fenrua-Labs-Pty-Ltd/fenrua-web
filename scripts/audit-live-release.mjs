import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  MAX_RELEASE_MANIFEST_BYTES,
  RELEASE_PUBLISHER,
  canonicalJson,
  parseReleaseManifestBody,
} from "./release-manifest-lib.mjs";

export const LIVE_FETCH_TIMEOUT_MS = 10_000;
export const LIVE_AUDIT_DEADLINE_MS = 60_000;
export const MAX_LIVE_ARTIFACT_BYTES = 16 * 1024 * 1024;
export const LIVE_FETCH_CONCURRENCY = 8;

export const mandatoryLiveRoutes = Object.freeze([
  { route: "/", contentTypes: ["text/html"] },
  { route: "/kernel-status.js", contentTypes: ["application/javascript", "text/javascript"] },
  { route: "/legal", contentTypes: ["text/html"] },
  { route: "/data/company-identity.json", contentTypes: ["application/json"] },
  { route: "/.well-known/security.txt", contentTypes: ["text/plain"] },
  { route: "/sitemap.xml", contentTypes: ["application/xml", "text/xml"] },
]);

const commitPattern = /^[0-9a-f]{40}$/;
const sha256Pattern = /^[0-9a-f]{64}$/;

export class LiveReleaseAuditError extends Error {
  constructor(message, failures = []) {
    super(message);
    this.name = "LiveReleaseAuditError";
    this.failures = failures;
  }
}

function normalizeAuditOrigin(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError("--url must be an absolute URL origin.");
  }
  const loopback = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]";
  if ((parsed.protocol !== "https:" && !(parsed.protocol === "http:" && loopback)) || parsed.username || parsed.password || value.replace(/\/$/, "") !== parsed.origin) {
    throw new TypeError("--url must be a canonical HTTPS origin without credentials, path, query, or fragment (HTTP is allowed only for loopback testing).");
  }
  return parsed.origin;
}

function mediaType(headers) {
  return (headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase();
}

function expectedArtifactContentTypes(route) {
  if (route === "/" || !path.posix.extname(route)) return ["text/html"];
  switch (path.posix.extname(route).toLowerCase()) {
    case ".js":
    case ".mjs":
      return ["application/javascript", "text/javascript"];
    case ".css":
      return ["text/css"];
    case ".json":
      return ["application/json"];
    case ".webmanifest":
      return ["application/manifest+json", "application/json"];
    case ".xml":
      return ["application/xml", "text/xml"];
    case ".txt":
      return ["text/plain"];
    case ".md":
      return ["text/markdown", "text/plain"];
    case ".svg":
      return ["image/svg+xml"];
    case ".jpg":
    case ".jpeg":
      return ["image/jpeg"];
    case ".png":
      return ["image/png"];
    case ".webp":
      return ["image/webp"];
    case ".gif":
      return ["image/gif"];
    case ".ico":
      return ["image/x-icon", "image/vnd.microsoft.icon"];
    case ".pdf":
      return ["application/pdf"];
    case ".bin":
      return ["application/octet-stream"];
    case ".woff":
      return ["font/woff"];
    case ".woff2":
      return ["font/woff2"];
    default:
      return ["application/octet-stream"];
  }
}

export async function fetchBounded(
  url,
  {
    fetchImpl = fetch,
    timeoutMs = LIVE_FETCH_TIMEOUT_MS,
    maxBytes,
    expectedContentTypes = [],
    allowEmpty = false,
    signal,
  },
) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new TypeError("Fetch timeout must be a positive safe integer.");
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new TypeError("Fetch body cap must be a positive safe integer.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Fetch exceeded ${timeoutMs} ms.`)), timeoutMs);
  const requestSignal = signal ? AbortSignal.any([controller.signal, signal]) : controller.signal;
  try {
    const response = await fetchImpl(url, {
      redirect: "manual",
      headers: { "cache-control": "no-cache", accept: "*/*" },
      signal: requestSignal,
    });
    const lengthHeader = response.headers.get("content-length");
    if (lengthHeader !== null) {
      if (!/^\d+$/.test(lengthHeader)) throw new Error("Response Content-Length is malformed.");
      const declaredLength = Number(lengthHeader);
      if (!Number.isSafeInteger(declaredLength) || declaredLength > maxBytes) {
        await response.body?.cancel();
        throw new Error(`Response exceeds the ${maxBytes}-byte body limit.`);
      }
    }
    const actualMediaType = mediaType(response.headers);
    if (expectedContentTypes.length > 0 && !expectedContentTypes.includes(actualMediaType)) {
      await response.body?.cancel();
      throw new Error(`Unexpected Content-Type ${JSON.stringify(actualMediaType || "missing")}; expected ${expectedContentTypes.join(" or ")}.`);
    }

    const chunks = [];
    let total = 0;
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new Error(`Response exceeds the ${maxBytes}-byte body limit.`);
        }
        chunks.push(Buffer.from(value));
      }
    }
    const body = Buffer.concat(chunks, total);
    if (!allowEmpty && body.length === 0) throw new Error("Response body is empty.");
    return { response, body, contentType: actualMediaType };
  } catch (error) {
    if (signal?.aborted) throw new Error("Live release audit exceeded its global deadline.");
    if (controller.signal.aborted) throw new Error(`Fetch timed out after ${timeoutMs} ms.`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function parseArguments(args) {
  const options = { baseUrl: "https://fenrua.ai", expectedCommit: "", expectedRecordSha256: "", selfConsistencyOnly: false };
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === "--self-consistency-only") {
      options.selfConsistencyOnly = true;
      continue;
    }
    if (flag !== "--url" && flag !== "--expected-commit" && flag !== "--expected-record-sha256") throw new TypeError(`Unknown argument: ${flag}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new TypeError(`${flag} requires a value.`);
    if (flag === "--url") options.baseUrl = value;
    else if (flag === "--expected-commit") options.expectedCommit = value;
    else options.expectedRecordSha256 = value;
    index += 1;
  }
  return options;
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()));
  return results;
}

export async function auditLiveRelease({
  baseUrl = "https://fenrua.ai",
  expectedCommit = "",
  expectedRecordSha256 = "",
  selfConsistencyOnly = false,
  fetchImpl = fetch,
  timeoutMs = LIVE_FETCH_TIMEOUT_MS,
  globalTimeoutMs = LIVE_AUDIT_DEADLINE_MS,
} = {}) {
  const base = normalizeAuditOrigin(baseUrl);
  if (expectedCommit && !commitPattern.test(expectedCommit)) {
    throw new TypeError("--expected-commit must be a full 40-character lowercase Git SHA.");
  }
  if (expectedRecordSha256 && !sha256Pattern.test(expectedRecordSha256)) {
    throw new TypeError("--expected-record-sha256 must be a 64-character lowercase SHA-256 digest.");
  }
  if (!expectedRecordSha256 && !selfConsistencyOnly) {
    throw new TypeError("Live verification requires --expected-record-sha256 from an independent trusted build, or explicit --self-consistency-only mode.");
  }
  if (expectedRecordSha256 && selfConsistencyOnly) throw new TypeError("Trusted-digest and self-consistency-only modes are mutually exclusive.");
  if (!Number.isSafeInteger(globalTimeoutMs) || globalTimeoutMs <= 0) throw new TypeError("Global audit timeout must be a positive safe integer.");
  const globalSignal = AbortSignal.timeout(globalTimeoutMs);

  const manifestFetch = await fetchBounded(`${base}/.well-known/fenrua-release.json`, {
    fetchImpl,
    timeoutMs,
    maxBytes: MAX_RELEASE_MANIFEST_BYTES,
    expectedContentTypes: ["application/json"],
    signal: globalSignal,
  });
  if (manifestFetch.response.status !== 200) throw new Error(`Release manifest returned ${manifestFetch.response.status}.`);
  const manifest = parseReleaseManifestBody(manifestFetch.body);
  if (expectedCommit && manifest.record.release.sourceCommit !== expectedCommit) {
    throw new Error("Live source commit does not match --expected-commit.");
  }
  if (expectedRecordSha256 && manifest.integrity.recordSha256 !== expectedRecordSha256) {
    throw new Error("Live release record does not match --expected-record-sha256.");
  }

  const failures = [];
  const manifestRoutes = new Set(manifest.record.publicArtifactSet.artifacts.map((artifact) => artifact.route));
  const artifactFailures = await mapWithConcurrency(manifest.record.publicArtifactSet.artifacts, LIVE_FETCH_CONCURRENCY, async (artifact) => {
    if (artifact.bytes > MAX_LIVE_ARTIFACT_BYTES) {
      return { route: artifact.route, issue: `declared artifact exceeds ${MAX_LIVE_ARTIFACT_BYTES}-byte live-audit cap` };
    }
    try {
      const { response, body, contentType } = await fetchBounded(`${base}${artifact.route}`, {
        fetchImpl,
        timeoutMs,
        maxBytes: Math.min(MAX_LIVE_ARTIFACT_BYTES, artifact.bytes),
        expectedContentTypes: expectedArtifactContentTypes(artifact.route),
        signal: globalSignal,
      });
      const digest = createHash("sha256").update(body).digest("hex");
      if (response.status !== 200 || body.length !== artifact.bytes || digest !== artifact.sha256) {
        return { route: artifact.route, issue: "artifact mismatch", status: response.status, contentType, bytes: body.length, sha256: digest };
      }
    } catch (error) {
      return { route: artifact.route, issue: error.message };
    }
    return null;
  });
  failures.push(...artifactFailures.filter(Boolean));

  // These checks are deliberately fixed here. Their existence and media type
  // are verified even if a compromised or incomplete manifest omits them.
  for (const required of mandatoryLiveRoutes) {
    if (!manifestRoutes.has(required.route)) failures.push({ route: required.route, issue: "mandatory route omitted from release manifest" });
    try {
      const { response, body } = await fetchBounded(`${base}${required.route}`, {
        fetchImpl,
        timeoutMs,
        maxBytes: 2 * 1024 * 1024,
        expectedContentTypes: required.contentTypes,
        signal: globalSignal,
      });
      if (response.status !== 200) failures.push({ route: required.route, issue: "mandatory route unavailable", status: response.status });
      if (required.route === "/data/company-identity.json" && response.status === 200) {
        try {
          const company = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
          for (const field of ["legalName", "abn", "acn"]) {
            if (company[field] !== RELEASE_PUBLISHER[field] || company[field] !== manifest.record.release.publisher[field]) {
              throw new Error(`${field} does not match the release publisher.`);
            }
          }
        } catch (error) {
          failures.push({ route: required.route, issue: `company identity mismatch: ${error.message}` });
        }
      }
    } catch (error) {
      failures.push({ route: required.route, issue: `mandatory route: ${error.message}` });
    }
  }

  for (const route of ["/genesis", "/regression"]) {
    try {
      const { response } = await fetchBounded(`${base}${route}`, {
        fetchImpl,
        timeoutMs,
        maxBytes: 1024,
        allowEmpty: true,
        signal: globalSignal,
      });
      if (response.status !== 308 || response.headers.get("location") !== "/audit") {
        failures.push({ route, issue: "redirect mismatch", redirectStatus: response.status, location: response.headers.get("location") });
      }
    } catch (error) {
      failures.push({ route, issue: error.message });
    }
  }

  if (failures.length > 0) throw new LiveReleaseAuditError("Live release verification failed.", failures);
  return {
    status: "ok",
    base,
    sourceCommit: manifest.record.release.sourceCommit,
    aggregateSha256: manifest.record.publicArtifactSet.aggregateSha256,
    recordSha256: manifest.integrity.recordSha256,
    trustedRecordDigestMatched: Boolean(expectedRecordSha256),
    verificationMode: expectedRecordSha256 ? "trusted-record-digest" : "unanchored-self-consistency",
    artifacts: manifest.record.publicArtifactSet.artifacts.length,
    mandatoryRoutes: mandatoryLiveRoutes.length,
    canonicalRecordBytes: Buffer.byteLength(canonicalJson(manifest.record), "utf8"),
  };
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  try {
    const result = await auditLiveRelease(parseArguments(process.argv.slice(2)));
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(JSON.stringify({ status: "failed", error: error.message, failures: error.failures || [] }, null, 2));
    process.exitCode = 1;
  }
}
