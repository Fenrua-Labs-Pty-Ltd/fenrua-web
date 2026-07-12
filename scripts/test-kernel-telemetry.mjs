import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../kernel-status.js", import.meta.url), "utf8");
const match = source.match(
  /\/\* KERNEL_STATUS_START \*\/\nconst kernelStatus = ([\s\S]*?);\n\/\* KERNEL_STATUS_END \*\//
);
assert.ok(match, "Generated kernel telemetry markers are missing.");

const status = JSON.parse(match[1]);
const telemetry = status.telemetry;

assert.equal(telemetry.schemaVersion, "fenrua.web.kernel-telemetry.v1");
assert.match(telemetry.snapshotCommit, /^[a-f0-9]{40}$/);
assert.match(telemetry.frozenEvidenceRevision, /^[a-f0-9]{40}$/);
assert.notEqual(telemetry.snapshotCommit, telemetry.frozenEvidenceRevision);
assert.equal(telemetry.suite.status, "pass");
assert.equal(telemetry.suite.caseCount, 10);
assert.equal(telemetry.suite.passedCount, 10);
assert.equal(telemetry.suite.failedCount, 0);
assert.equal(telemetry.differential.status, "pass");

for (const campaign of [telemetry.differential.native, telemetry.differential.sanitizer]) {
  for (const count of [campaign.randomizedFieldPairs, campaign.byteEncodings, campaign.digestRoundtrips]) {
    assert.ok(Number.isSafeInteger(count) && count > 0, "Differential telemetry count must be positive.");
  }
}

assert.equal(telemetry.regressions.length, 1);
const [regression] = telemetry.regressions;
assert.equal(regression.id, "regression-order-sub-cross-limb-borrow");
assert.equal(regression.classification, "permanent-borrow-chain-regression");
assert.equal(regression.status, "pass");
assert.equal(regression.fixture.name, "regression_001_p521_sub_overflow.bin");
assert.equal(regression.fixture.bytes, 132);
assert.match(regression.fixture.sha256, /^[a-f0-9]{64}$/);
assert.match(regression.report.recordSha256, /^[a-f0-9]{64}$/);
assert.match(regression.report.fileSha256, /^[a-f0-9]{64}$/);
assert.match(regression.fixture.url, new RegExp(`/blob/${telemetry.snapshotCommit}/regressions/`));
assert.match(regression.report.url, new RegExp(`/blob/${telemetry.snapshotCommit}/tests/genesis/reports/regressions/`));

const serialized = JSON.stringify(telemetry);
for (const forbidden of ["leftLimbs", "rightLimbs", "resultLimbs", "witness", ".wtns", "local-secrets", "/tmp/"]) {
  assert.ok(!serialized.includes(forbidden), `Public telemetry must not expose ${forbidden}.`);
}

console.log(
  JSON.stringify({
    status: "ok",
    scope: "kernel-telemetry-public-snapshot",
    snapshotCommit: telemetry.snapshotCommit,
    regressionCount: telemetry.regressions.length,
  })
);
