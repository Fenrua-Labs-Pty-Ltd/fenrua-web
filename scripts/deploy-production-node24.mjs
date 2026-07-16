import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { requireExternalArtifactDirectory } from "./external-artifact-paths.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repository = "fenrualabs/fenrua-web";
const deploymentTimeoutMs = 20 * 60 * 1000;
const deploymentPollMs = 15_000;
const liveAuditTimeoutMs = 5 * 60 * 1000;
const successfulCheckStates = new Set(["SUCCESS", "NEUTRAL", "SKIPPED"]);
const privatePathEnvironmentKeys = [
  "FENRUA_VISUAL_BASELINE_DIR",
  "FENRUA_VISUAL_ARTIFACTS_DIR",
  "FENRUA_TEST_OUTPUT_DIR",
];

function fail(message) {
  throw new Error(message);
}

function childEnvironment(env = {}) {
  const child = { ...process.env, ...env };
  for (const key of privatePathEnvironmentKeys) {
    if (!Object.hasOwn(env, key)) delete child[key];
  }
  return child;
}

function run(command, args, { capture = false, env = {} } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: childEnvironment(env),
    stdio: capture ? "pipe" : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const details = capture ? `${result.stderr ?? ""}${result.stdout ?? ""}`.trim() : "";
    fail(`${command} ${args.join(" ")} failed${details ? `: ${details}` : ""}`);
  }
  return capture ? result.stdout ?? "" : "";
}

function runPrivateVisualCheck(command, args, { env = {} } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: childEnvironment(env),
    stdio: "pipe",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} failed; private visual verification diagnostics are withheld.`);
  }
}

function readJson(command, args) {
  return JSON.parse(run(command, args, { capture: true }));
}

function attempt(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: childEnvironment(),
    stdio: "pipe",
  });
  return {
    error: result.error?.message ?? null,
    status: result.status,
    output: `${result.stderr ?? ""}${result.stdout ?? ""}`.trim(),
  };
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function usage() {
  console.log("Usage: FENRUA_VISUAL_BASELINE_DIR=/absolute/external/baseline npm run deploy:production:node24 -- --pr <number> --confirm-production [--previous-main-sha <40-character-sha>]");
}

function option(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || !process.argv[index + 1]) return null;
  return process.argv[index + 1];
}

function checkState(check) {
  return check.__typename === "CheckRun" ? check.conclusion : check.state;
}

function checkName(check) {
  return check.name ?? check.context ?? "unnamed check";
}

function assertCleanWorktree() {
  const status = run("git", ["status", "--porcelain=v1"], { capture: true }).trim();
  if (status) fail("Production deployment requires a clean working tree.");
}

function assertCanonicalOrigin() {
  const origin = run("git", ["remote", "get-url", "origin"], { capture: true }).trim();
  const canonicalPath = [`/${repository}`, `/${repository}.git`, `:${repository}`, `:${repository}.git`];
  const isGitHubOrigin = origin.includes("://github.com/") || origin.includes("@github.com:");
  if (!isGitHubOrigin || !canonicalPath.some((suffix) => origin.endsWith(suffix))) {
    fail(`The origin remote must resolve to ${repository}.`);
  }
}

function requireSuccessfulChecks(pr) {
  const checks = pr.statusCheckRollup ?? [];
  const required = new Set(["Validate public surface", "Vercel"]);
  const missing = [...required].filter((name) => !checks.some((check) => checkName(check) === name));
  if (missing.length) fail(`Required pull request checks are missing: ${missing.join(", ")}.`);
  const pendingOrFailed = checks.filter((check) => !successfulCheckStates.has(checkState(check)));
  if (pendingOrFailed.length) fail(`Pull request checks are not successful: ${pendingOrFailed.map(checkName).join(", ")}.`);
}

function requireMergedPullRequest(pr, label) {
  const mergeCommit = pr.mergeCommit?.oid?.toLowerCase() ?? "";
  const headCommit = pr.headRefOid?.toLowerCase() ?? "";
  if (pr.state !== "MERGED" || pr.isDraft || pr.baseRefName !== "main" || !pr.mergedAt || !/^[0-9a-f]{40}$/.test(mergeCommit) || !/^[0-9a-f]{40}$/.test(headCommit)) {
    fail(`${label} must be a verifiably merged pull request targeting main.`);
  }
  if (mergeCommit === headCommit) {
    fail(`${label} must be a squash merge with a distinct pull request head commit for remote verification.`);
  }
  return mergeCommit;
}

function assertMainAtMergeCommit(mergeCommit) {
  const branch = run("git", ["branch", "--show-current"], { capture: true }).trim();
  if (branch !== "main") fail("Production verification requires the checked-out main branch.");

  const productionCommit = run("git", ["rev-parse", "HEAD"], { capture: true }).trim();
  const remoteMain = run("git", ["rev-parse", "origin/main"], { capture: true }).trim();
  if (productionCommit !== remoteMain) fail("Local main must exactly match origin/main before production verification.");
  if (productionCommit !== mergeCommit) {
    fail(`main moved after pull request #${pullRequest} merged; refusing to verify a different production commit.`);
  }
  return productionCommit;
}

function assertSingleParentMerge(mergeCommit, previousMainSha) {
  const commits = run("git", ["rev-list", "--parents", "-n", "1", mergeCommit], { capture: true }).trim().split(/\s+/);
  if (commits.length !== 2 || commits[0] !== mergeCommit) {
    fail(`Merged pull request #${pullRequest} must resolve to a single-parent squash commit for remote verification.`);
  }
  if (commits[1] !== previousMainSha) {
    fail(`The previous main SHA does not match the parent of merged pull request #${pullRequest}.`);
  }
}

function syncMainAtMergeCommit(mergeCommit, previousMainSha = null) {
  run("git", ["fetch", "origin", "main"]);
  run("git", ["switch", "main"]);
  run("git", ["pull", "--ff-only", "origin", "main"]);
  assertCleanWorktree();

  const productionCommit = assertMainAtMergeCommit(mergeCommit);
  if (previousMainSha) assertSingleParentMerge(productionCommit, previousMainSha);
  return productionCommit;
}

function reassertMainAtMergeCommit(mergeCommit) {
  run("git", ["fetch", "origin", "main"]);
  return assertMainAtMergeCommit(mergeCommit);
}

function currentProductionDeployment(commit) {
  const deployments = readJson("gh", ["api", `repos/${repository}/deployments?sha=${commit}&per_page=100`]);
  const deployment = deployments.find((candidate) => String(candidate.environment ?? "").toLowerCase() === "production" && candidate.creator?.login === "vercel[bot]");
  if (!deployment) return null;
  const statuses = readJson("gh", ["api", `repos/${repository}/deployments/${deployment.id}/statuses?per_page=1`]);
  return { deployment, status: statuses[0] ?? null };
}

function waitForProductionDeployment(commit) {
  const deadline = Date.now() + deploymentTimeoutMs;
  while (Date.now() <= deadline) {
    const current = currentProductionDeployment(commit);
    if (current?.status?.state === "success") return current;
    if (["error", "failure", "inactive"].includes(current?.status?.state)) {
      fail(`Production deployment ${current.deployment.id} ended with ${current.status.state}.`);
    }
    sleep(deploymentPollMs);
  }
  fail(`Timed out waiting for the Vercel Git production deployment of ${commit}.`);
}

function waitForLiveAudit(productionCommit, recordSha) {
  const deadline = Date.now() + liveAuditTimeoutMs;
  let lastOutput = "unknown audit failure";
  const args = [
    "run",
    "audit:live-release",
    "--",
    "--url",
    "https://fenrua.ai",
    "--expected-commit",
    productionCommit,
    "--expected-record-sha256",
    recordSha,
  ];

  while (Date.now() <= deadline) {
    const result = attempt("npm", args);
    if (!result.error && result.status === 0) return;
    lastOutput = result.error ?? (result.output || "audit command exited unsuccessfully");
    console.error("Live production alias has not yet passed the release audit; retrying.");
    sleep(deploymentPollMs);
  }
  fail(`Live release audit did not observe ${productionCommit} before its retry window elapsed: ${lastOutput}`);
}

if (process.argv.includes("--help")) {
  usage();
  process.exit(0);
}

const pullRequest = option("--pr");
const previousMainSha = option("--previous-main-sha")?.toLowerCase() ?? null;
if (!/^\d+$/.test(pullRequest ?? "")) {
  usage();
  fail("--pr must name the approved pull request number.");
}
if (!process.argv.includes("--confirm-production")) {
  usage();
  fail("--confirm-production is required before a production merge and deployment.");
}
if (previousMainSha !== null && !/^[0-9a-f]{40}$/.test(previousMainSha)) {
  usage();
  fail("--previous-main-sha must be a 40-character commit SHA.");
}

run(process.execPath, ["scripts/require-node24.mjs"]);
assertCleanWorktree();
assertCanonicalOrigin();
let baselineDirectory;
try {
  baselineDirectory = requireExternalArtifactDirectory(
    process.env.FENRUA_VISUAL_BASELINE_DIR || "",
    "Approved visual baseline directory",
    { create: false },
  );
} catch {
  fail("Approved visual baseline directory could not be verified.");
}
run("gh", ["auth", "status"]);

const pr = readJson("gh", [
  "pr",
  "view",
  pullRequest,
  "--repo",
  repository,
  "--json",
  "number,state,isDraft,baseRefName,headRefName,headRefOid,mergeStateStatus,statusCheckRollup,mergedAt,mergeCommit,url",
]);
if (pr.baseRefName !== "main") fail(`Pull request #${pullRequest} must target main.`);
requireSuccessfulChecks(pr);

let productionCommit;
if (pr.state === "OPEN") {
  if (pr.isDraft) fail(`Pull request #${pullRequest} must be ready for review before production deployment.`);
  if (pr.mergeStateStatus !== "CLEAN") fail(`Pull request #${pullRequest} is not mergeable: ${pr.mergeStateStatus}.`);
  if (previousMainSha !== null) fail("--previous-main-sha is reserved for an already merged pull request.");

  const branch = run("git", ["branch", "--show-current"], { capture: true }).trim();
  const head = run("git", ["rev-parse", "HEAD"], { capture: true }).trim();
  if (branch !== pr.headRefName || head !== pr.headRefOid) {
    fail(`The checked-out source must exactly match pull request #${pullRequest} head ${pr.headRefName}.`);
  }

  console.log(JSON.stringify({
    status: "preflight-ok",
    pullRequest: pr.number,
    baselineDirectoryVerified: true,
    baselineCustody: "owner-approved-out-of-repository",
    mode: "ready-pr",
  }));
  runPrivateVisualCheck("npm", ["run", "release:check"]);
  runPrivateVisualCheck("npm", ["run", "test:visual-regression"], {
    env: { FENRUA_VISUAL_BASELINE_DIR: baselineDirectory },
  });
  assertCleanWorktree();

  run("gh", [
    "pr",
    "merge",
    pullRequest,
    "--squash",
    "--match-head-commit",
    pr.headRefOid,
    "--repo",
    repository,
  ], { env: { GH_PROMPT_DISABLED: "1" } });
  const mergedPr = readJson("gh", [
    "pr",
    "view",
    pullRequest,
    "--repo",
    repository,
    "--json",
    "state,baseRefName,headRefOid,mergedAt,mergeCommit,url",
  ]);
  const mergeCommit = requireMergedPullRequest(mergedPr, `Pull request #${pullRequest}`);
  productionCommit = syncMainAtMergeCommit(mergeCommit);
} else if (pr.state === "MERGED") {
  if (!previousMainSha) fail("--previous-main-sha is required when verifying an already merged pull request.");
  const mergeCommit = requireMergedPullRequest(pr, `Pull request #${pullRequest}`);
  console.log(JSON.stringify({
    status: "preflight-ok",
    pullRequest: pr.number,
    baselineDirectoryVerified: true,
    baselineCustody: "owner-approved-out-of-repository",
    mode: "merged-pr",
    previousMainSha,
  }));
  productionCommit = syncMainAtMergeCommit(mergeCommit, previousMainSha);
} else {
  fail(`Pull request #${pullRequest} must be open and ready for review, or already merged to main.`);
}

runPrivateVisualCheck("npm", ["run", "release:production-check"], {
  env: { FENRUA_VISUAL_BASELINE_DIR: baselineDirectory },
});
assertCleanWorktree();
reassertMainAtMergeCommit(productionCommit);
const releaseRecord = JSON.parse(readFileSync(resolve(root, ".well-known", "fenrua-release.json"), "utf8"));
const recordSha = releaseRecord.integrity?.recordSha256;
if (!/^[0-9a-f]{64}$/.test(recordSha ?? "")) fail("The generated release record is missing its integrity digest.");

const deployment = waitForProductionDeployment(productionCommit);
waitForLiveAudit(productionCommit, recordSha);
reassertMainAtMergeCommit(productionCommit);

console.log(JSON.stringify({
  status: "ok",
  pullRequest: pr.number,
  productionCommit,
  deploymentId: deployment.deployment.id,
  deploymentUrl: deployment.status?.environment_url ?? deployment.deployment.environment_url ?? null,
  recordSha,
}));
