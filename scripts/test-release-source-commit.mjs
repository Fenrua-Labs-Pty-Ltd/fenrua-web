import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkout = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root, encoding: "utf8" });
const hasCheckout = checkout.status === 0 && checkout.stdout.trim() === "true";
const result = spawnSync(process.execPath, ["scripts/generate-release-manifest.mjs"], {
  cwd: root,
  encoding: "utf8",
  env: {
    ...process.env,
    VERCEL: hasCheckout ? "" : "1",
    VERCEL_GIT_COMMIT_SHA: "",
    FENRUA_ALLOW_DIRTY_RELEASE: "1",
    FENRUA_RELEASE_COMMIT: "0000000000000000000000000000000000000000",
  },
});

assert.notEqual(result.status, 0, "An unbound source-commit configuration must fail closed.");
assert.match(
  `${result.stdout}\n${result.stderr}`,
  hasCheckout ? /does not match the checked-out source commit/i : /VERCEL_GIT_COMMIT_SHA must be exposed/i,
);

const simulatedVercelCommit = "1".repeat(40);
const fallback = spawnSync(process.execPath, ["scripts/generate-release-manifest.mjs"], {
  cwd: root,
  encoding: "utf8",
  env: {
    ...process.env,
    GIT_DIR: "/tmp/fenrua-release-manifest-no-checkout",
    VERCEL: "1",
    VERCEL_GIT_COMMIT_SHA: simulatedVercelCommit,
    FENRUA_ALLOW_DIRTY_RELEASE: "1",
    FENRUA_RELEASE_COMMIT: "",
  },
});
assert.equal(fallback.status, 0, `The Vercel commit fallback must succeed: ${fallback.stderr}`);
assert.doesNotMatch(fallback.stderr, /fatal: not a git repository/i, "The expected Vercel fallback must not emit a Git probe error.");

const restore = spawnSync(process.execPath, ["scripts/generate-release-manifest.mjs"], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, FENRUA_ALLOW_DIRTY_RELEASE: "1" },
});
assert.equal(restore.status, 0, `The local release manifest must be restored: ${restore.stderr}`);
console.log(JSON.stringify({ status: "ok", scope: "release-source-commit-binding" }));
