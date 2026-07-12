import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const statusFile = path.join(siteRoot, "kernel-status.js");
const kernelRepository = "https://github.com/fenrualabs/fenrua-kernel";

const sourcePaths = Object.freeze({
  manifest: "tests/genesis/reports/manifest.json",
  report: "tests/genesis/reports/genesis-report.json",
  regression: "tests/genesis/reports/regressions/regression-order-sub-cross-limb-borrow.json",
  fixture: "regressions/regression_001_p521_sub_overflow.bin",
  buildValidation: "tests/audit/final-build-validation.json",
  independentReview: "tests/audit/independent-review-report.json",
  auditLog: "SECURITY_AUDIT_LOG.md",
});

function fail(message) {
  throw new Error(`Kernel telemetry sync refused: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isGitRevision(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function canonicalJson(value) {
  if (value === null) return "null";

  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    assert(Number.isFinite(value), "canonical JSON rejects non-finite numbers");
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }

  assert(isPlainObject(value), "canonical JSON only permits plain objects");
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
}

function parseArguments(argv) {
  const options = { check: false, kernelDir: process.env.FENRUA_KERNEL_DIR || "" };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
    } else if (argument === "--kernel-dir") {
      options.kernelDir = argv[index + 1] || "";
      index += 1;
    } else {
      fail(`unsupported argument ${argument}`);
    }
  }

  assert(options.kernelDir, "pass --kernel-dir or FENRUA_KERNEL_DIR");
  return options;
}

function safeKernelPath(kernelDir, relativePath) {
  assert(typeof relativePath === "string" && relativePath.length > 0, "source path is missing");
  assert(!path.isAbsolute(relativePath), `source path must be relative: ${relativePath}`);
  const resolved = path.resolve(kernelDir, relativePath);
  const relation = path.relative(kernelDir, resolved);
  assert(relation && !relation.startsWith(`..${path.sep}`) && relation !== "..", `unsafe source path: ${relativePath}`);
  return resolved;
}

async function readKernelFile(kernelDir, relativePath) {
  const payload = await readFile(safeKernelPath(kernelDir, relativePath));
  return {
    bytes: payload.length,
    sha256: sha256(payload),
    payload,
  };
}

async function readKernelJson(kernelDir, relativePath) {
  const file = await readKernelFile(kernelDir, relativePath);
  try {
    return { ...file, document: JSON.parse(file.payload.toString("utf8")) };
  } catch (error) {
    fail(`invalid JSON at ${relativePath}: ${error.message}`);
  }
}

function verifyEnvelope(source, expectedSchema, label) {
  const { document } = source;
  assert(isPlainObject(document), `${label} document must be an object`);
  assert(isPlainObject(document.record), `${label} record is missing`);
  assert(document.record.schemaVersion === expectedSchema, `${label} schema is not ${expectedSchema}`);
  assert(isPlainObject(document.integrity), `${label} integrity is missing`);
  assert(document.integrity.algorithm === "SHA-256", `${label} must use SHA-256`);
  assert(document.integrity.canonicalization === "FENRUA-CANONICAL-JSON-V1", `${label} canonicalization changed`);
  assert(document.integrity.scope === "$.record", `${label} integrity scope changed`);
  assert(isSha256(document.integrity.sha256), `${label} record hash is invalid`);
  assert(
    sha256(Buffer.from(canonicalJson(document.record), "utf8")) === document.integrity.sha256,
    `${label} canonical record hash mismatch`
  );
}

function getHeadCommit(kernelDir) {
  const result = spawnSync("git", ["-C", kernelDir, "rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert(result.status === 0, `could not resolve kernel commit: ${result.stderr.trim()}`);
  const commit = result.stdout.trim();
  assert(isGitRevision(commit), "kernel checkout did not resolve to a full immutable commit");
  return commit;
}

function githubBlob(commit, relativePath) {
  assert(isGitRevision(commit), "cannot create a link without an immutable commit");
  assert(Object.values(sourcePaths).includes(relativePath), `link path is not allowlisted: ${relativePath}`);
  return `${kernelRepository}/blob/${commit}/${relativePath}`;
}

function shortRevision(value) {
  return `${value.slice(0, 8)}…`;
}

function numberText(value) {
  assert(Number.isSafeInteger(value) && value >= 0, "telemetry count is invalid");
  return new Intl.NumberFormat("en-US").format(value);
}

function findById(records, key, value, label) {
  assert(Array.isArray(records), `${label} list is missing`);
  const match = records.find((entry) => isPlainObject(entry) && entry[key] === value);
  assert(match, `${label} entry ${value} is missing`);
  return match;
}

function buildTelemetry({ snapshotCommit, manifest, report, regression, fixture, buildValidation, review }) {
  verifyEnvelope(manifest, "fenrua.pn521.genesis.manifest.v1", "manifest");
  verifyEnvelope(report, "fenrua.pn521.genesis.report.v1", "genesis report");
  verifyEnvelope(regression, "fenrua.pn521.regression.v1", "regression report");

  const manifestRecord = manifest.document.record;
  const reportRecord = report.document.record;
  const regressionRecord = regression.document.record;
  const sourceRevision = reportRecord.runMetadata?.git?.revision;
  assert(isGitRevision(sourceRevision), "genesis report source revision is invalid");
  assert(reportRecord.status === "pass", "genesis report is not passing");
  assert(reportRecord.caseCount === 10 && reportRecord.passedCount === 10 && reportRecord.failedCount === 0, "genesis case totals are not clean");
  assert(
    reportRecord.nonGenesisRegressionCount === 1 &&
      reportRecord.nonGenesisRegressionPassedCount === 1 &&
      reportRecord.nonGenesisRegressionFailedCount === 0,
    "permanent regression totals are not clean"
  );
  assert(manifestRecord.suiteId === reportRecord.suiteId, "manifest and report suite IDs differ");
  assert(manifestRecord.caseCount === reportRecord.caseCount, "manifest and report case counts differ");

  const aggregate = manifestRecord.aggregate;
  assert(
    aggregate?.path === sourcePaths.report &&
      aggregate.fileSha256 === report.sha256 &&
      aggregate.fileBytes === report.bytes &&
      aggregate.recordSha256 === report.document.integrity.sha256,
    "manifest aggregate does not bind the genesis report"
  );

  const reportRegression = findById(
    reportRecord.regressions,
    "regressionId",
    "regression-order-sub-cross-limb-borrow",
    "genesis regression"
  );
  const manifestRegression = findById(
    manifestRecord.regressions,
    "regressionId",
    reportRegression.regressionId,
    "manifest regression"
  );
  assert(
    reportRegression.reportPath === sourcePaths.regression &&
      reportRegression.reportFileSha256 === regression.sha256 &&
      reportRegression.reportFileBytes === regression.bytes &&
      reportRegression.recordSha256 === regression.document.integrity.sha256 &&
      manifestRegression.path === sourcePaths.regression &&
      manifestRegression.fileSha256 === regression.sha256 &&
      manifestRegression.fileBytes === regression.bytes &&
      manifestRegression.recordSha256 === regression.document.integrity.sha256,
    "regression report is not bound by the manifest and aggregate report"
  );

  const fixtureRecord = regressionRecord.input?.fixture;
  const reportFixture = findById(
    reportRecord.regressionFixtures,
    "usedByRegressionId",
    reportRegression.regressionId,
    "genesis fixture"
  );
  const manifestFixture = findById(
    manifestRecord.fixtures,
    "usedByRegressionId",
    reportRegression.regressionId,
    "manifest fixture"
  );
  assert(
    fixtureRecord?.path === sourcePaths.fixture &&
      fixtureRecord.bytes === fixture.bytes &&
      fixtureRecord.sha256 === fixture.sha256 &&
      reportFixture.path === sourcePaths.fixture &&
      reportFixture.bytes === fixture.bytes &&
      reportFixture.sha256 === fixture.sha256 &&
      manifestFixture.path === sourcePaths.fixture &&
      manifestFixture.bytes === fixture.bytes &&
      manifestFixture.sha256 === fixture.sha256,
    "regression fixture integrity is not consistently bound"
  );
  assert(fixture.bytes === 132 && fixture.sha256 === fixtureRecord.sha256, "fixture bytes or SHA-256 changed");
  assert(regressionRecord.passed === true && reportRegression.passed === true, "regression is not passing");

  const audit = buildValidation.document;
  assert(audit?.schema === "fenrua.final-build-validation.v1", "build validation schema changed");
  assert(audit.subject?.frozenCommit === sourceRevision, "build validation is not tied to the evidence revision");
  assert(audit.verdict?.status === "pass", "build validation verdict is not passing");
  const nativeDifferential = findById(
    audit.campaigns?.ctest?.tests,
    "name",
    "fenrua_kernel_differential",
    "native differential campaign"
  );
  const sanitizerDifferential = audit.campaigns?.sanitizerDifferential;
  assert(nativeDifferential.result === "pass", "native differential campaign failed");
  assert(sanitizerDifferential?.result === "pass", "sanitizer differential campaign failed");
  for (const count of [
    nativeDifferential.randomizedFieldPairs,
    nativeDifferential.byteEncodings,
    nativeDifferential.digestRoundtrips,
    sanitizerDifferential.randomizedFieldPairs,
    sanitizerDifferential.byteEncodings,
    sanitizerDifferential.digestRoundtrips,
  ]) {
    assert(Number.isSafeInteger(count) && count > 0, "differential campaign count is invalid");
  }

  const reviewRecord = review.document;
  assert(reviewRecord?.schemaVersion === "fenrua.pn521.independent-review.v1", "independent review schema changed");
  assert(reviewRecord.revision?.bedrockSourceCommit === sourceRevision, "review is not tied to the evidence revision");
  assert(reviewRecord.status === "pass", "independent review is not passing");
  assert(reviewRecord.verdict?.unresolvedFindings === 0 && reviewRecord.verdict?.releaseBlockers === 0, "review has unresolved blockers");

  const fixturePublicUrl = githubBlob(snapshotCommit, sourcePaths.fixture);
  const regressionPublicUrl = githubBlob(snapshotCommit, sourcePaths.regression);
  const manifestPublicUrl = githubBlob(snapshotCommit, sourcePaths.manifest);
  const reportPublicUrl = githubBlob(snapshotCommit, sourcePaths.report);
  const auditPublicUrl = githubBlob(snapshotCommit, sourcePaths.buildValidation);

  return {
    repositoryUrl: kernelRepository,
    auditLogUrl: githubBlob(snapshotCommit, sourcePaths.auditLog),
    genesisManifestUrl: manifestPublicUrl,
    ciUrl: `${kernelRepository}/actions`,
    regressionUrl: regressionPublicUrl,
    versionCommitUrl: `${kernelRepository}/commit/${snapshotCommit}`,
    evidenceRevisionUrl: `${kernelRepository}/commit/${sourceRevision}`,
    versionTag: `sync ${shortRevision(snapshotCommit)}`,
    evidenceRevisionTag: `evidence ${shortRevision(sourceRevision)}`,
    buildStatus: reportRecord.status.toUpperCase(),
    auditResolution: `${reviewRecord.verdict.resolvedFindings}/${reviewRecord.verdict.findings} Findings Resolved`,
    genesisIntegrity: `${reportRecord.passedCount}/${reportRecord.caseCount} Genesis Cases Verified`,
    ciOutput: `Differential: ${sanitizerDifferential.result.toUpperCase()}`,
    regressionCoverage: `${reportRecord.nonGenesisRegressionPassedCount} Permanent Regression: PASS`,
    statusSource: `Verified kernel snapshot ${shortRevision(snapshotCommit)}`,
    lastSynced: `Evidence report ${reportRecord.runMetadata.generatedAtUtc}`,
    snapshotCommitShort: shortRevision(snapshotCommit),
    differentialSummary: `${numberText(sanitizerDifferential.randomizedFieldPairs)} field pairs · ${numberText(sanitizerDifferential.byteEncodings)} encodings · ${numberText(sanitizerDifferential.digestRoundtrips)} digests`,
    evidence: [
      {
        artifact: "Repository Sync Snapshot",
        hashReference: shortRevision(snapshotCommit),
        sourceLabel: "Pinned Snapshot",
        sourceUrl: `${kernelRepository}/commit/${snapshotCommit}`,
        copyValue: snapshotCommit,
      },
      {
        artifact: "Frozen Evidence Revision",
        hashReference: shortRevision(sourceRevision),
        sourceLabel: "Evidence Revision",
        sourceUrl: `${kernelRepository}/commit/${sourceRevision}`,
        copyValue: sourceRevision,
      },
      {
        artifact: "Genesis Manifest Record",
        hashReference: shortRevision(manifest.document.integrity.sha256),
        sourceLabel: "Manifest",
        sourceUrl: manifestPublicUrl,
        copyValue: manifest.document.integrity.sha256,
      },
      {
        artifact: "Differential Validation",
        hashReference: shortRevision(buildValidation.sha256),
        sourceLabel: "Validation Report",
        sourceUrl: auditPublicUrl,
        copyValue: buildValidation.sha256,
      },
    ],
    telemetry: {
      schemaVersion: "fenrua.web.kernel-telemetry.v1",
      snapshotCommit,
      frozenEvidenceRevision: sourceRevision,
      sourceReport: {
        path: sourcePaths.report,
        fileSha256: report.sha256,
        recordSha256: report.document.integrity.sha256,
        reportGeneratedAtUtc: reportRecord.runMetadata.generatedAtUtc,
        url: reportPublicUrl,
      },
      suite: {
        id: reportRecord.suiteId,
        status: reportRecord.status,
        caseCount: reportRecord.caseCount,
        passedCount: reportRecord.passedCount,
        failedCount: reportRecord.failedCount,
      },
      differential: {
        status: sanitizerDifferential.result,
        native: {
          randomizedFieldPairs: nativeDifferential.randomizedFieldPairs,
          byteEncodings: nativeDifferential.byteEncodings,
          digestRoundtrips: nativeDifferential.digestRoundtrips,
          seedHex: nativeDifferential.seedHex,
        },
        sanitizer: {
          randomizedFieldPairs: sanitizerDifferential.randomizedFieldPairs,
          byteEncodings: sanitizerDifferential.byteEncodings,
          digestRoundtrips: sanitizerDifferential.digestRoundtrips,
          seedHex: sanitizerDifferential.seedHex,
          addressSanitizer: sanitizerDifferential.addressSanitizer,
          undefinedBehaviorSanitizer: sanitizerDifferential.undefinedBehaviorSanitizer,
          leakDetection: sanitizerDifferential.leakDetection,
        },
        source: {
          path: sourcePaths.buildValidation,
          fileSha256: buildValidation.sha256,
          url: auditPublicUrl,
        },
      },
      regressions: [
        {
          id: reportRegression.regressionId,
          classification: regressionRecord.classification,
          domain: regressionRecord.domain,
          operation: regressionRecord.operation,
          status: regressionRecord.passed ? "pass" : "fail",
          fixture: {
            name: path.basename(sourcePaths.fixture),
            bytes: fixture.bytes,
            sha256: fixture.sha256,
            encoding: fixtureRecord.encoding,
            url: fixturePublicUrl,
          },
          report: {
            recordSha256: regression.document.integrity.sha256,
            fileSha256: regression.sha256,
            bytes: regression.bytes,
            url: regressionPublicUrl,
          },
        },
      ],
    },
  };
}

function renderKernelStatus(status) {
  return `/* KERNEL_STATUS_START */\nconst kernelStatus = ${JSON.stringify(status, null, 2)};\n/* KERNEL_STATUS_END */`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const kernelDir = path.resolve(options.kernelDir);
  const snapshotCommit = getHeadCommit(kernelDir);
  const [manifest, report, regression, fixture, buildValidation, review] = await Promise.all([
    readKernelJson(kernelDir, sourcePaths.manifest),
    readKernelJson(kernelDir, sourcePaths.report),
    readKernelJson(kernelDir, sourcePaths.regression),
    readKernelFile(kernelDir, sourcePaths.fixture),
    readKernelJson(kernelDir, sourcePaths.buildValidation),
    readKernelJson(kernelDir, sourcePaths.independentReview),
  ]);
  const nextStatus = renderKernelStatus(
    buildTelemetry({ snapshotCommit, manifest, report, regression, fixture, buildValidation, review })
  );
  const existing = await readFile(statusFile, "utf8");
  const start = existing.indexOf("/* KERNEL_STATUS_START */");
  const end = existing.indexOf("/* KERNEL_STATUS_END */");
  assert(start !== -1 && end !== -1 && end > start, "kernel-status.js generation markers are missing");
  const updated = `${existing.slice(0, start)}${nextStatus}${existing.slice(end + "/* KERNEL_STATUS_END */".length)}`;

  if (options.check) {
    assert(existing === updated, "kernel-status.js is not synchronized with the supplied kernel snapshot");
  } else if (existing !== updated) {
    await writeFile(statusFile, updated);
  }

  console.log(
    JSON.stringify({
      status: "ok",
      scope: "kernel-telemetry-sync",
      snapshotCommit,
      frozenEvidenceRevision: report.document.record.runMetadata.git.revision,
      changed: existing !== updated,
    })
  );
}

await main();
