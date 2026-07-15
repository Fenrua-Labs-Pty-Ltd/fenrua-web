import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const vercel = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
const deploymentNotes = readFileSync(resolve(root, "docs/VERCEL.md"), "utf8");
const runtimeGuardPath = resolve(root, "scripts/require-node24.mjs");
const runtimeGuard = readFileSync(runtimeGuardPath, "utf8");
const deploymentCommandPath = resolve(root, "scripts/deploy-production-node24.mjs");
const deploymentCommand = readFileSync(deploymentCommandPath, "utf8");

assert.equal(packageJson.devDependencies?.vercel, undefined, "The vulnerable Vercel CLI tree must not be installed in this repository.");
assert.equal(packageJson.engines?.node, "24.x", "Vercel can select only the audited Node major line.");
assert.equal(
  packageJson.scripts?.["release:production-check"],
  "node scripts/require-node24.mjs && node scripts/require-main-branch.mjs && npm run release:check && npm run test:visual-regression",
);
assert.match(packageJson.scripts?.["release:check"] ?? "", /npm run capture:visual-regression/);
assert.equal(packageJson.scripts?.["capture:visual-regression"], "node scripts/test-visual-regression.mjs --capture");
assert.equal(packageJson.scripts?.["test:visual-regression"], "node scripts/test-visual-regression.mjs");
assert.equal(packageJson.scripts?.["deploy:production:node24"], "node scripts/deploy-production-node24.mjs");
assert.equal(vercel.buildCommand, "npm run build:release");
assert.equal(vercel.outputDirectory, "public");
assert.match(deploymentNotes, /Vercel Git integration/i);
assert.match(deploymentNotes, /VERCEL_GIT_COMMIT_SHA/);
assert.match(deploymentNotes, /Node `24\.18\.0` and npm\s+`11\.18\.0`/i);
assert.match(deploymentNotes, /npm run deploy:production:node24 -- --pr <number> --confirm-production/);
assert.match(deploymentNotes, /The deployment command never runs the Vercel CLI/i);
assert.match(runtimeGuard, /process\.env\.VERCEL === "1"/);
assert.match(runtimeGuard, /\^\[0-9a-f\]\{40\}\$/);
assert.match(runtimeGuard, /nodeMajor !== 24/);
assert.match(runtimeGuard, /npmMajor !== 11/);
assert.match(deploymentCommand, /--confirm-production/);
assert.match(deploymentCommand, /FENRUA_VISUAL_BASELINE_DIR/);
assert.match(deploymentCommand, /"pr",\s+"merge"/);
assert.match(deploymentCommand, /--squash/);
assert.match(deploymentCommand, /--match-head-commit/);
assert.match(deploymentCommand, /--repo/);
assert.match(deploymentCommand, /mergeCommit/);
assert.match(deploymentCommand, /origin\/main/);
assert.match(deploymentCommand, /release:production-check/);
assert.match(deploymentCommand, /audit:live-release/);
assert.match(deploymentCommand, /waitForLiveAudit/);
assert.doesNotMatch(deploymentCommand, /\bvercel\s+(?:pull|build|deploy)\b/i);

const simulatedHead = "a".repeat(40);
const simulationDirectory = mkdtempSync(join(tmpdir(), "fenrua-deploy-production-"));
const simulationBin = join(simulationDirectory, "bin");
const simulationBaseline = join(simulationDirectory, "approved-baseline");
const simulationLog = join(simulationDirectory, "commands.log");

const writeStub = (name, body) => {
  const path = join(simulationBin, name);
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
};

try {
  mkdirSync(simulationBin);
  mkdirSync(simulationBaseline);

  writeStub("git", `
printf 'git %s\\n' "$*" >> "$FENRUA_DEPLOY_STUB_LOG"
if [ "$1" = "status" ]; then exit 0; fi
if [ "$1" = "remote" ] && [ "$2" = "get-url" ] && [ "$3" = "origin" ]; then
  printf '%s\\n' 'https://github.com/fenrualabs/fenrua-web.git'
  exit 0
fi
if [ "$1" = "branch" ] && [ "$2" = "--show-current" ]; then
  printf '%s\\n' 'codex/ux-precision-copy-ia'
  exit 0
fi
if [ "$1" = "rev-parse" ] && [ "$2" = "HEAD" ]; then
  printf '%s\\n' '${simulatedHead}'
  exit 0
fi
printf 'unexpected git command: %s\\n' "$*" >&2
exit 81`);

  writeStub("gh", `
printf 'gh %s\\n' "$*" >> "$FENRUA_DEPLOY_STUB_LOG"
if [ "$1" = "auth" ] && [ "$2" = "status" ]; then exit 0; fi
if [ "$1" = "pr" ] && [ "$2" = "view" ]; then
  printf '%s\\n' '{"number":17,"state":"OPEN","isDraft":false,"baseRefName":"main","headRefName":"codex/ux-precision-copy-ia","headRefOid":"${simulatedHead}","mergeStateStatus":"CLEAN","statusCheckRollup":[{"__typename":"CheckRun","name":"Validate public surface","conclusion":"SUCCESS"},{"__typename":"CheckRun","name":"Vercel","conclusion":"SUCCESS"}]}'
  exit 0
fi
if [ "$1" = "pr" ] && [ "$2" = "merge" ]; then
  printf '%s\\n' 'simulated merge stop' >&2
  exit 86
fi
printf 'unexpected gh command: %s\\n' "$*" >&2
exit 82`);

  writeStub("npm", `
printf 'npm %s\\n' "$*" >> "$FENRUA_DEPLOY_STUB_LOG"
exit 0`);

  const simulated = spawnSync(process.execPath, [deploymentCommandPath, "--pr", "17", "--confirm-production"], {
    cwd: simulationDirectory,
    encoding: "utf8",
    env: {
      ...process.env,
      FENRUA_DEPLOY_STUB_LOG: simulationLog,
      FENRUA_VISUAL_BASELINE_DIR: simulationBaseline,
      PATH: `${simulationBin}:${process.env.PATH}`,
      npm_config_user_agent: "npm/11.18.0 node/v24.18.0 linux x64",
    },
  });
  assert.notEqual(simulated.status, 0, "The simulated merge must stop before any external change.");
  assert.match(simulated.stderr, /gh pr merge 17 --squash --match-head-commit/);
  const simulatedLog = readFileSync(simulationLog, "utf8");
  assert.match(simulatedLog, /gh pr merge 17 --squash --match-head-commit a{40} --repo fenrualabs\/fenrua-web/);
  assert.match(simulatedLog, /npm run release:check/);
  assert.match(simulatedLog, /npm run test:visual-regression/);
} finally {
  rmSync(simulationDirectory, { recursive: true, force: true });
}

const runRuntimeGuard = (npmUserAgent, { vercel = true } = {}) => {
  const env = {
    ...process.env,
    VERCEL: vercel ? "1" : "0",
    VERCEL_GIT_COMMIT_SHA: vercel ? "a".repeat(40) : "",
  };
  if (npmUserAgent === undefined) delete env.npm_config_user_agent;
  else env.npm_config_user_agent = npmUserAgent;

  return spawnSync(process.execPath, [runtimeGuardPath], {
    cwd: root,
    encoding: "utf8",
    env,
  });
};

const supportedVercelRuntime = runRuntimeGuard("npm/11.12.1 node/v24.15.0 linux x64");
assert.equal(supportedVercelRuntime.status, 0, supportedVercelRuntime.stderr);
assert.match(supportedVercelRuntime.stdout, /Bound Vercel runtime OK/);

const unsupportedVercelNpm = runRuntimeGuard("npm/12.0.0 node/v24.15.0 linux x64");
assert.notEqual(unsupportedVercelNpm.status, 0);
assert.match(unsupportedVercelNpm.stderr, /Vercel npm 11\.x required/);

for (const [label, npmUserAgent] of [
  ["missing", undefined],
  ["malformed", "pnpm/10.0.0 node/v24.15.0 linux x64"],
]) {
  const rejected = runRuntimeGuard(npmUserAgent);
  assert.notEqual(rejected.status, 0, `A ${label} Vercel npm identity must fail closed.`);
  assert.match(rejected.stderr, /Vercel npm 11\.x required/);
}

const missingExactNpm = runRuntimeGuard(undefined, { vercel: false });
assert.notEqual(missingExactNpm.status, 0, "The exact release path must reject an unknown npm identity.");

console.log(JSON.stringify({ status: "ok", scope: "production-git-deployment-binding" }));
