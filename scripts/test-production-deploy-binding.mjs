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
const readme = readFileSync(resolve(root, "README.md"), "utf8");
const sensitiveBaselinePathParts = ["private", "fenrua", "evidence-custody", "approved-visual-baseline-do-not-leak"];

function sensitiveBaselineDirectory(parent) {
  return join(parent, ...sensitiveBaselinePathParts);
}

function assertBaselinePathRedacted(result, baseline, label) {
  for (const [stream, output] of [["stdout", result.stdout], ["stderr", result.stderr]]) {
    assert.equal(String(output ?? "").includes(baseline), false, `${label} ${stream} must redact private baseline custody metadata.`);
  }
}

function assertPrivacySafePreflight(output, mode, previousMainSha = null) {
  const text = String(output ?? "");
  assert.equal(text.includes('"baselineDirectoryVerified":true'), true, `${mode} preflight must report verified baseline custody.`);
  assert.equal(text.includes('"baselineCustody":"owner-approved-out-of-repository"'), true, `${mode} preflight must report owner-approved out-of-repository custody.`);
  assert.equal(text.includes(`"mode":"${mode}"`), true, `${mode} preflight must keep its release mode.`);
  if (previousMainSha) assert.equal(text.includes(`"previousMainSha":"${previousMainSha}"`), true, "Merged preflight must retain the previous main SHA.");
}

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
assert.match(deploymentNotes, /private custody\s+metadata/i);
assert.match(deploymentNotes, /must not print the\s+raw path/i);
assert.match(readme, /private custody\s+metadata/i);
assert.match(readme, /must not print the\s+raw path/i);
assert.match(runtimeGuard, /process\.env\.VERCEL === "1"/);
assert.match(runtimeGuard, /\^\[0-9a-f\]\{40\}\$/);
assert.match(runtimeGuard, /nodeMajor !== 24/);
assert.match(runtimeGuard, /npmMajor !== 11/);
assert.match(deploymentCommand, /--confirm-production/);
assert.match(deploymentCommand, /FENRUA_VISUAL_BASELINE_DIR/);
assert.match(deploymentCommand, /baselineDirectoryVerified:\s*true/);
assert.match(deploymentCommand, /baselineCustody:\s*"owner-approved-out-of-repository"/);
assert.match(deploymentCommand, /--previous-main-sha/);
assert.match(deploymentCommand, /state === "MERGED"/);
assert.match(deploymentCommand, /single-parent squash commit/);
assert.match(deploymentCommand, /creator\?\.login === "vercel\[bot\]"/);
assert.equal([...deploymentCommand.matchAll(/reassertMainAtMergeCommit\(productionCommit\)/g)].length, 2, "Production verification must reassert main before polling and after the live audit.");
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

const preflightPayloads = [...deploymentCommand.matchAll(/console\.log\(JSON\.stringify\(\{([\s\S]*?)\}\)\);/g)]
  .map((match) => match[1])
  .filter((payload) => payload.includes('status: "preflight-ok"'));
assert.equal(preflightPayloads.length, 2, "Deployment command must emit one privacy-safe preflight payload for each release mode.");
for (const payload of preflightPayloads) {
  assert.equal(/\bbaselineDirectory\s*[,}:]/.test(payload), false, "Preflight JSON must not include the raw baseline directory value.");
}

const simulatedHead = "a".repeat(40);
const simulationDirectory = mkdtempSync(join(tmpdir(), "fenrua-deploy-production-"));
const simulationBin = join(simulationDirectory, "bin");
const simulationBaseline = sensitiveBaselineDirectory(simulationDirectory);
const simulationLog = join(simulationDirectory, "commands.log");

const writeStub = (name, body) => {
  const path = join(simulationBin, name);
  writeFileSync(path, `#!/bin/sh\n${body}\n`);
  chmodSync(path, 0o755);
};

try {
  mkdirSync(simulationBin);
  mkdirSync(simulationBaseline, { recursive: true });

  writeStub("git", `
printf 'git %s\\n' "$*" >> "$FENRUA_DEPLOY_STUB_LOG"
if [ "$1" = "status" ]; then exit 0; fi
if [ "$1" = "remote" ] && [ "$2" = "get-url" ] && [ "$3" = "origin" ]; then
  printf '%s\\n' 'https://github.com/Fenrua-Labs-Pty-Ltd/fenrua-web.git'
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
printf 'private baseline=%s\\n' "$FENRUA_VISUAL_BASELINE_DIR"
printf 'private baseline=%s\\n' "$FENRUA_VISUAL_BASELINE_DIR" >&2
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
  assertPrivacySafePreflight(simulated.stdout, "ready-pr");
  assertBaselinePathRedacted(simulated, simulationBaseline, "Ready PR simulation");
  const simulatedLog = readFileSync(simulationLog, "utf8");
  assert.match(simulatedLog, /gh pr merge 17 --squash --match-head-commit a{40} --repo Fenrua-Labs-Pty-Ltd\/fenrua-web/);
  assert.match(simulatedLog, /npm run release:check/);
  assert.match(simulatedLog, /npm run test:visual-regression/);

  const invalidBaseline = join(simulationDirectory, ...sensitiveBaselinePathParts, "missing");
  const invalidBaselineResult = spawnSync(process.execPath, [deploymentCommandPath, "--pr", "17", "--confirm-production"], {
    cwd: simulationDirectory,
    encoding: "utf8",
    env: {
      ...process.env,
      FENRUA_DEPLOY_STUB_LOG: simulationLog,
      FENRUA_VISUAL_BASELINE_DIR: invalidBaseline,
      PATH: `${simulationBin}:${process.env.PATH}`,
      npm_config_user_agent: "npm/11.18.0 node/v24.18.0 linux x64",
    },
  });
  assert.notEqual(invalidBaselineResult.status, 0, "A missing approved baseline must fail closed.");
  assert.equal(String(invalidBaselineResult.stderr).includes("Approved visual baseline directory could not be verified."), true, "Baseline-validation failure must use the safe generic message.");
  assertBaselinePathRedacted(invalidBaselineResult, invalidBaseline, "Baseline-validation failure");
} finally {
  rmSync(simulationDirectory, { recursive: true, force: true });
}

const simulatedMergedCommit = "b".repeat(40);
const simulatedPreviousMain = "c".repeat(40);
const simulatedMovedMain = "d".repeat(40);
const simulatedMergedHead = "a".repeat(40);

function runMergedRemoteScenario({
  previousMainSha = simulatedPreviousMain,
  mergeParents = [simulatedPreviousMain],
  headCommit = simulatedMergedHead,
  localMain = simulatedMergedCommit,
  remoteMain = simulatedMergedCommit,
  remoteMainAfterProductionCheck = null,
} = {}) {
  const directory = mkdtempSync(join(tmpdir(), "fenrua-deploy-remote-"));
  const bin = join(directory, "bin");
  const baseline = sensitiveBaselineDirectory(directory);
  const log = join(directory, "commands.log");
  const productionCheckState = join(directory, "production-check-ran");
  const parentLine = [simulatedMergedCommit, ...mergeParents].join(" ");
  const writeScenarioStub = (name, body) => {
    const path = join(bin, name);
    writeFileSync(path, `#!/bin/sh\n${body}\n`);
    chmodSync(path, 0o755);
  };

  try {
    mkdirSync(bin);
    mkdirSync(baseline, { recursive: true });
    writeScenarioStub("git", `
printf 'git %s\\n' "$*" >> "$FENRUA_DEPLOY_STUB_LOG"
if [ "$1" = "status" ]; then exit 0; fi
if [ "$1" = "remote" ] && [ "$2" = "get-url" ] && [ "$3" = "origin" ]; then
  printf '%s\\n' 'https://github.com/Fenrua-Labs-Pty-Ltd/fenrua-web.git'
  exit 0
fi
if [ "$1" = "fetch" ] || [ "$1" = "switch" ] || [ "$1" = "pull" ]; then exit 0; fi
if [ "$1" = "branch" ] && [ "$2" = "--show-current" ]; then
  printf '%s\\n' 'main'
  exit 0
fi
if [ "$1" = "rev-parse" ] && [ "$2" = "HEAD" ]; then
  printf '%s\\n' '${localMain}'
  exit 0
fi
if [ "$1" = "rev-parse" ] && [ "$2" = "origin/main" ]; then
  if [ -n "${remoteMainAfterProductionCheck ?? ""}" ] && [ -f "$FENRUA_DEPLOY_PRODUCTION_CHECKED" ]; then
    printf '%s\\n' '${remoteMainAfterProductionCheck ?? ""}'
    exit 0
  fi
  printf '%s\\n' '${remoteMain}'
  exit 0
fi
if [ "$1" = "rev-list" ] && [ "$2" = "--parents" ] && [ "$3" = "-n" ] && [ "$4" = "1" ] && [ "$5" = "${simulatedMergedCommit}" ]; then
  printf '%s\\n' '${parentLine}'
  exit 0
fi
printf 'unexpected git command: %s\\n' "$*" >&2
exit 81`);
    writeScenarioStub("gh", `
printf 'gh %s\\n' "$*" >> "$FENRUA_DEPLOY_STUB_LOG"
if [ "$1" = "auth" ] && [ "$2" = "status" ]; then exit 0; fi
if [ "$1" = "pr" ] && [ "$2" = "view" ]; then
  printf '%s\\n' '{"number":17,"state":"MERGED","isDraft":false,"baseRefName":"main","headRefName":"codex/remote-production-deployment","headRefOid":"${headCommit}","mergeStateStatus":"UNKNOWN","statusCheckRollup":[{"__typename":"CheckRun","name":"Validate public surface","conclusion":"SUCCESS"},{"__typename":"CheckRun","name":"Vercel","conclusion":"SUCCESS"}],"mergedAt":"2026-07-15T05:30:51Z","mergeCommit":{"oid":"${simulatedMergedCommit}"}}'
  exit 0
fi
if [ "$1" = "pr" ] && [ "$2" = "merge" ]; then
  printf 'merged-PR verification must not invoke gh pr merge\\n' >&2
  exit 99
fi
if [ "$1" = "api" ]; then
  printf 'production polling must not begin before the test sentinel\\n' >&2
  exit 98
fi
printf 'unexpected gh command: %s\\n' "$*" >&2
exit 82`);
    writeScenarioStub("npm", `
printf 'npm %s\\n' "$*" >> "$FENRUA_DEPLOY_STUB_LOG"
printf 'private baseline=%s\\n' "$FENRUA_VISUAL_BASELINE_DIR"
printf 'private baseline=%s\\n' "$FENRUA_VISUAL_BASELINE_DIR" >&2
if [ "$1" = "run" ] && [ "$2" = "release:production-check" ]; then
  if [ -n "${remoteMainAfterProductionCheck ?? ""}" ]; then
    touch "$FENRUA_DEPLOY_PRODUCTION_CHECKED"
    exit 0
  fi
  printf 'production-check sentinel\\n' >&2
  exit 87
fi
printf 'unexpected npm command: %s\\n' "$*" >&2
exit 83`);

    const args = [deploymentCommandPath, "--pr", "17", "--confirm-production"];
    if (previousMainSha !== null) args.push("--previous-main-sha", previousMainSha);
    const result = spawnSync(process.execPath, args, {
      cwd: directory,
      encoding: "utf8",
      env: {
        ...process.env,
        FENRUA_DEPLOY_STUB_LOG: log,
        FENRUA_DEPLOY_PRODUCTION_CHECKED: productionCheckState,
        FENRUA_VISUAL_BASELINE_DIR: baseline,
        PATH: `${bin}:${process.env.PATH}`,
        npm_config_user_agent: "npm/11.18.0 node/v24.18.0 linux x64",
      },
    });
    return { result, log: readFileSync(log, "utf8"), baseline };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

const mergedRemote = runMergedRemoteScenario({});
assert.notEqual(mergedRemote.result.status, 0, "The production-check sentinel must stop the merged-PR simulation before any deployment API call.");
assert.match(mergedRemote.result.stderr, /npm run release:production-check failed/);
assertPrivacySafePreflight(mergedRemote.result.stdout, "merged-pr", simulatedPreviousMain);
assertBaselinePathRedacted(mergedRemote.result, mergedRemote.baseline, "Merged PR simulation");
assert.match(mergedRemote.log, /git fetch origin main/);
assert.match(mergedRemote.log, /git switch main/);
assert.match(mergedRemote.log, /git pull --ff-only origin main/);
assert.match(mergedRemote.log, /git rev-parse HEAD/);
assert.match(mergedRemote.log, /git rev-parse origin\/main/);
assert.match(mergedRemote.log, new RegExp(`git rev-list --parents -n 1 ${simulatedMergedCommit}`));
assert.match(mergedRemote.log, /npm run release:production-check/);
assert.doesNotMatch(mergedRemote.log, /gh pr merge/, "Merged-PR verification must never attempt a second merge.");
assert.doesNotMatch(mergedRemote.log, /gh api/, "Deployment polling must wait for successful production validation.");

const missingPreviousMainSha = runMergedRemoteScenario({ previousMainSha: null });
assert.notEqual(missingPreviousMainSha.result.status, 0);
assert.match(missingPreviousMainSha.result.stderr, /--previous-main-sha is required/);
assert.doesNotMatch(missingPreviousMainSha.log, /git fetch origin main/);

const rebaseShapedMerge = runMergedRemoteScenario({ headCommit: simulatedMergedCommit });
assert.notEqual(rebaseShapedMerge.result.status, 0);
assert.match(rebaseShapedMerge.result.stderr, /squash merge with a distinct pull request head commit/i);
assert.doesNotMatch(rebaseShapedMerge.log, /git fetch origin main/);

const incorrectPreviousMainSha = runMergedRemoteScenario({ mergeParents: ["e".repeat(40)] });
assert.notEqual(incorrectPreviousMainSha.result.status, 0);
assert.match(incorrectPreviousMainSha.result.stderr, /previous main SHA does not match the parent/i);
assert.doesNotMatch(incorrectPreviousMainSha.log, /npm run release:production-check/);
assert.doesNotMatch(incorrectPreviousMainSha.log, /gh pr merge/);

const divergentLocalMain = runMergedRemoteScenario({ localMain: "f".repeat(40) });
assert.notEqual(divergentLocalMain.result.status, 0);
assert.match(divergentLocalMain.result.stderr, /Local main must exactly match origin\/main before production verification/);
assert.doesNotMatch(divergentLocalMain.log, new RegExp(`git rev-list --parents -n 1 ${simulatedMergedCommit}`));
assert.doesNotMatch(divergentLocalMain.log, /npm run release:production-check/);
assert.doesNotMatch(divergentLocalMain.log, /gh pr merge/);

const nonSquashMerge = runMergedRemoteScenario({ mergeParents: [simulatedPreviousMain, "e".repeat(40)] });
assert.notEqual(nonSquashMerge.result.status, 0);
assert.match(nonSquashMerge.result.stderr, /single-parent squash commit/i);
assert.doesNotMatch(nonSquashMerge.log, /npm run release:production-check/);
assert.doesNotMatch(nonSquashMerge.log, /gh pr merge/);

const movedMain = runMergedRemoteScenario({ localMain: simulatedMovedMain, remoteMain: simulatedMovedMain });
assert.notEqual(movedMain.result.status, 0);
assert.match(movedMain.result.stderr, /main moved after pull request #17 merged/i);
assert.doesNotMatch(movedMain.log, /npm run release:production-check/);
assert.doesNotMatch(movedMain.log, /gh pr merge/);

const mainAdvanceDuringProductionCheck = runMergedRemoteScenario({ remoteMainAfterProductionCheck: simulatedMovedMain });
assert.notEqual(mainAdvanceDuringProductionCheck.result.status, 0);
assert.match(mainAdvanceDuringProductionCheck.result.stderr, /Local main must exactly match origin\/main before production verification/);
assert.match(mainAdvanceDuringProductionCheck.log, /npm run release:production-check/);
assert.doesNotMatch(mainAdvanceDuringProductionCheck.log, /gh api/);

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
