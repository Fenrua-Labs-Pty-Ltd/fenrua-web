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

function fail(message) {
  throw new Error(message);
}

function run(command, args, { capture = false, env = {} } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env },
    stdio: capture ? "pipe" : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const details = capture ? `${result.stderr ?? ""}${result.stdout ?? ""}`.trim() : "";
    fail(`${command} ${args.join(" ")} failed${details ? `: ${details}` : ""}`);
  }
  return capture ? result.stdout ?? "" : "";
}

function readJson(command, args) {
  return JSON.parse(run(command, args, { capture: true }));
}

function attempt(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
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
  console.log("Usage: FENRUA_VISUAL_BASELINE_DIR=/absolute/external/baseline npm run deploy:production:node24 -- --pr <number> --confirm-production");
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

function currentProductionDeployment(commit) {
  const deployments = readJson("gh", ["api", `repos/${repository}/deployments?sha=${commit}&per_page=100`]);
  const deployment = deployments.find((candidate) => String(candidate.environment ?? "").toLowerCase() === "production");
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
if (!/^\d+$/.test(pullRequest ?? "")) {
  usage();
  fail("--pr must name the approved pull request number.");
}
if (!process.argv.includes("--confirm-production")) {
  usage();
  fail("--confirm-production is required before a production merge and deployment.");
}

run(process.execPath, ["scripts/require-node24.mjs"]);
assertCleanWorktree();
assertCanonicalOrigin();
const baselineDirectory = requireExternalArtifactDirectory(
  process.env.FENRUA_VISUAL_BASELINE_DIR || "",
  "Approved visual baseline directory",
  { create: false },
);
run("gh", ["auth", "status"]);

const pr = readJson("gh", [
  "pr",
  "view",
  pullRequest,
  "--repo",
  repository,
  "--json",
  "number,state,isDraft,baseRefName,headRefName,headRefOid,mergeStateStatus,statusCheckRollup,url",
]);
if (pr.state !== "OPEN" || pr.isDraft || pr.baseRefName !== "main") {
  fail(`Pull request #${pullRequest} must be an open, ready-for-review pull request targeting main.`);
}
if (pr.mergeStateStatus !== "CLEAN") fail(`Pull request #${pullRequest} is not mergeable: ${pr.mergeStateStatus}.`);
requireSuccessfulChecks(pr);

const branch = run("git", ["branch", "--show-current"], { capture: true }).trim();
const head = run("git", ["rev-parse", "HEAD"], { capture: true }).trim();
if (branch !== pr.headRefName || head !== pr.headRefOid) {
  fail(`The checked-out source must exactly match pull request #${pullRequest} head ${pr.headRefName}.`);
}

console.log(JSON.stringify({ status: "preflight-ok", pullRequest: pr.number, baselineDirectory }));
run("npm", ["run", "release:check"]);
run("npm", ["run", "test:visual-regression"]);
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
  "state,mergedAt,mergeCommit,url",
]);
if (mergedPr.state !== "MERGED" || !mergedPr.mergedAt || !mergedPr.mergeCommit?.oid) {
  fail(`Pull request #${pullRequest} did not complete a verifiable merge.`);
}
run("git", ["fetch", "origin", "main"]);
run("git", ["switch", "main"]);
run("git", ["pull", "--ff-only", "origin", "main"]);
assertCleanWorktree();

const productionCommit = run("git", ["rev-parse", "HEAD"], { capture: true }).trim();
const remoteMain = run("git", ["rev-parse", "origin/main"], { capture: true }).trim();
if (productionCommit !== remoteMain) fail("Local main must exactly match origin/main before production verification.");
if (productionCommit !== mergedPr.mergeCommit.oid) {
  fail(`main moved after pull request #${pullRequest} merged; refusing to verify a different production commit.`);
}
run("npm", ["run", "release:production-check"]);
const releaseRecord = JSON.parse(readFileSync(resolve(root, ".well-known", "fenrua-release.json"), "utf8"));
const recordSha = releaseRecord.integrity?.recordSha256;
if (!/^[0-9a-f]{64}$/.test(recordSha ?? "")) fail("The generated release record is missing its integrity digest.");

const deployment = waitForProductionDeployment(productionCommit);
waitForLiveAudit(productionCommit, recordSha);

console.log(JSON.stringify({
  status: "ok",
  pullRequest: pr.number,
  productionCommit,
  deploymentId: deployment.deployment.id,
  deploymentUrl: deployment.status?.environment_url ?? deployment.deployment.environment_url ?? null,
  recordSha,
}));
