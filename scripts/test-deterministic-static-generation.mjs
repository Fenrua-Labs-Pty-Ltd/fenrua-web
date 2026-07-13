import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const routes = [
  "index.html",
  "architecture/index.html",
  "kernel/index.html",
  "utilities/index.html",
  "research/index.html",
  "research/pn521-cross-limb-borrow/index.html",
  "research/toolchain-evidence-lock/index.html",
  "research/read-only-chain-observation/index.html",
  "verify/index.html",
  "developers/index.html",
  "toolchain/index.html",
  "evidence/index.html",
  "audit/index.html",
  "status/index.html",
  "nexus/index.html",
  "fenswap/index.html",
  "fenpresale/index.html",
  "wallet/index.html",
  "support/index.html",
  "legal/index.html",
  "privacy/index.html",
  "terms/index.html",
  "accessibility/index.html",
  "security/index.html",
  "sitemap.xml",
];

function digest(relativePath) {
  return createHash("sha256").update(readFileSync(resolve(root, relativePath))).digest("hex");
}

const before = new Map(routes.map((route) => [route, digest(route)]));
execFileSync(process.execPath, ["scripts/generate-static-routes.mjs"], { cwd: root, stdio: "pipe" });
const after = new Map(routes.map((route) => [route, digest(route)]));

assert.deepEqual(after, before, "Static generation must be byte-for-byte deterministic for the committed public inputs.");
console.log(JSON.stringify({ status: "ok", scope: "deterministic-static-generation", files: routes.length }));
