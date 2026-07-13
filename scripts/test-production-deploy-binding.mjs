import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const vercel = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
const deploymentNotes = readFileSync(resolve(root, "docs/VERCEL.md"), "utf8");
const runtimeGuardPath = resolve(root, "scripts/require-node24.mjs");
const runtimeGuard = readFileSync(runtimeGuardPath, "utf8");

assert.equal(packageJson.devDependencies?.vercel, undefined, "The vulnerable Vercel CLI tree must not be installed in this repository.");
assert.equal(packageJson.engines?.node, "24.x", "Vercel can select only the audited Node major line.");
assert.equal(packageJson.scripts?.["release:production-check"], "node scripts/require-node24.mjs && node scripts/require-main-branch.mjs && npm run release:check");
assert.equal(vercel.buildCommand, "npm run build:release");
assert.equal(vercel.outputDirectory, "public");
assert.match(deploymentNotes, /Vercel Git integration/i);
assert.match(deploymentNotes, /VERCEL_GIT_COMMIT_SHA/);
assert.match(deploymentNotes, /Node `24\.18\.0` and npm\s+`11\.18\.0`/i);
assert.match(runtimeGuard, /process\.env\.VERCEL === "1"/);
assert.match(runtimeGuard, /\^\[0-9a-f\]\{40\}\$/);
assert.match(runtimeGuard, /nodeMajor !== 24/);
assert.match(runtimeGuard, /npmMajor !== 11/);
assert.doesNotMatch(deploymentNotes, /deploy:production:node24|locked `vercel` CLI/i);

const runRuntimeGuard = (npmUserAgent) =>
  spawnSync(process.execPath, [runtimeGuardPath], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      VERCEL: "1",
      VERCEL_GIT_COMMIT_SHA: "a".repeat(40),
      npm_config_user_agent: npmUserAgent,
    },
  });

const supportedVercelRuntime = runRuntimeGuard("npm/11.12.1 node/v24.15.0 linux x64");
assert.equal(supportedVercelRuntime.status, 0, supportedVercelRuntime.stderr);
assert.match(supportedVercelRuntime.stdout, /Bound Vercel runtime OK/);

const unsupportedVercelNpm = runRuntimeGuard("npm/12.0.0 node/v24.15.0 linux x64");
assert.notEqual(unsupportedVercelNpm.status, 0);
assert.match(unsupportedVercelNpm.stderr, /Vercel npm 11\.x required/);

console.log(JSON.stringify({ status: "ok", scope: "production-git-deployment-binding" }));
