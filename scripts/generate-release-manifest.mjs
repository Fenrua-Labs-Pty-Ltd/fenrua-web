import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicArtifactFiles, publicRouteFor } from "./public-output-lib.mjs";
import { canonicalJson, sha256, verifyReleaseManifest } from "./release-manifest-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, ".well-known", "fenrua-release.json");
const evidencePath = path.join(root, "data", "site-evidence.json");
const companyPath = path.join(root, "data", "company-identity.json");
const commitPattern = /^[0-9a-f]{40}$/;
const officialSourceNoticeGeneratedPaths = new Set([
  "index.html",
  "trust/index.html",
  "legal/index.html",
]);

function dirtyPaths(status) {
  return status
    .split(/\r?\n/)
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
    .map((entry) => entry.includes(" -> ") ? entry.split(" -> ").at(-1) : entry);
}

function allowsOnlyGeneratedOfficialSourceNotice(status) {
  const paths = dirtyPaths(status);
  if (!paths.length || !paths.every((entry) => officialSourceNoticeGeneratedPaths.has(entry))) return false;
  const result = spawnSync(process.execPath, ["scripts/apply-official-source-notice.mjs", "--check"], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status === 0) return true;
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  throw new Error(`Generated official-source notice check failed before release manifest generation.\n${output}`);
}

function sourceCommit() {
  const vercelCommit = (process.env.VERCEL_GIT_COMMIT_SHA || "").trim().toLowerCase();
  const localOverride = (process.env.FENRUA_RELEASE_COMMIT || "").trim().toLowerCase();
  if (process.env.VERCEL && !vercelCommit) {
    throw new Error("VERCEL_GIT_COMMIT_SHA must be exposed for a production release manifest.");
  }
  let checkoutCommit = "";
  try {
    checkoutCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim().toLowerCase();
  } catch {
    if (!vercelCommit) throw new Error("Release manifest requires a Git checkout or VERCEL_GIT_COMMIT_SHA.");
  }
  const supplied = vercelCommit || localOverride;
  if (supplied && checkoutCommit && supplied !== checkoutCommit) {
    throw new Error("Supplied release commit does not match the checked-out source commit.");
  }
  const resolved = supplied || checkoutCommit;
  if (!commitPattern.test(resolved)) throw new Error("Release manifest requires a 40-character source commit.");
  if (checkoutCommit) {
    const dirty = execFileSync("git", ["status", "--porcelain=v1"], { cwd: root, encoding: "utf8" }).trim();
    if (dirty && process.env.FENRUA_ALLOW_DIRTY_RELEASE !== "1" && !allowsOnlyGeneratedOfficialSourceNotice(dirty)) {
      throw new Error("Release manifest generation requires a clean source checkout. Use FENRUA_ALLOW_DIRTY_RELEASE=1 only for local, non-deployment validation.");
    }
  }
  return resolved;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function artifact(route, relativePath) {
  const file = path.join(root, relativePath);
  if (!existsSync(file)) throw new Error(`Release artifact is missing: ${relativePath}`);
  const bytes = readFileSync(file);
  return { route, bytes: bytes.length, sha256: sha256(bytes) };
}

const evidence = readJson(evidencePath);
const company = readJson(companyPath);
if (typeof evidence.generatedAt !== "string" || !Number.isFinite(Date.parse(evidence.generatedAt))) {
  throw new Error("data/site-evidence.json must contain a valid generatedAt timestamp.");
}

// Every deployed static file except this manifest is included. Dynamic API
// responses and protected operational systems remain outside this artifact set.
const artifacts = publicArtifactFiles()
  .map((relativePath) => [publicRouteFor(relativePath), relativePath])
  .map(([route, relativePath]) => artifact(route, relativePath))
  .sort((left, right) => left.route.localeCompare(right.route));

const aggregateArtifactSha256 = sha256(artifacts.map((item) => `${item.route}\0${item.bytes}\0${item.sha256}\n`).join(""));
const record = {
  schema: "fenrua.web.release-evidence.v1",
  release: {
    canonicalUrl: "https://fenrua.ai",
    project: "fenrua-web",
    sourceCommit: sourceCommit(),
    sourceEvidenceGeneratedAt: evidence.generatedAt,
    publisher: {
      legalName: company.legalName,
      abn: company.abn,
      acn: company.acn,
    },
  },
  publicArtifactSet: {
    algorithm: "sha256",
    aggregateSha256: aggregateArtifactSha256,
    artifacts,
  },
  validation: {
    requiredCommand: "npm run build:release",
    scope: "complete deployed static website artifacts except this self-referential manifest",
  },
  limitations: [
    "This file is not a signature, deployment attestation, or statement about live runtime state.",
    "Dynamic observations, APIs, live block-card data, private infrastructure, keys, gateways, validators, and mesh systems are excluded.",
  ],
};
const manifest = {
  record,
  integrity: {
    algorithm: "sha256",
    canonicalization: "sorted UTF-8 JSON object keys",
    recordSha256: sha256(canonicalJson(record)),
  },
};

verifyReleaseManifest(manifest);
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ status: "ok", output: path.relative(root, outputPath), artifacts: artifacts.length, sourceCommit: record.release.sourceCommit }));
