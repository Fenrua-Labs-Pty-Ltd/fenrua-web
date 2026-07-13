import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(process.execPath, ["scripts/generate-release-manifest.mjs"], {
  cwd: root,
  encoding: "utf8",
  env: {
    ...process.env,
    VERCEL: "",
    VERCEL_GIT_COMMIT_SHA: "",
    FENRUA_ALLOW_DIRTY_RELEASE: "1",
    FENRUA_RELEASE_COMMIT: "0000000000000000000000000000000000000000",
  },
});

assert.notEqual(result.status, 0, "A mismatched source-commit override must fail closed.");
assert.match(`${result.stdout}\n${result.stderr}`, /does not match the checked-out source commit/i);
console.log(JSON.stringify({ status: "ok", scope: "release-source-commit-binding" }));
