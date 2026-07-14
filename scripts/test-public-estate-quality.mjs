import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluatePublicEstateQuality,
  loadGateConfiguration,
  writeExternalQualityResult,
} from "./evaluate-public-estate-quality.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = loadGateConfiguration();

assert.equal(config.domains.reduce((sum, domain) => sum + domain.weight, 0), 100);
assert.equal(new Set(config.domains.map((domain) => domain.id)).size, config.domains.length);

const passing = evaluatePublicEstateQuality({
  config,
  checkRunner: () => ({ ok: true, detail: "test pass" }),
});
assert.equal(passing.score, 100);
assert.equal(passing.hardBlockerCount, 0);
assert.equal(passing.meetsTarget, true);

const blocked = evaluatePublicEstateQuality({
  config,
  checkRunner: (check) => ({ ok: check.kind !== "file", detail: "test result" }),
});
assert.ok(blocked.score < 100);
assert.ok(blocked.hardBlockerCount > 0);
assert.equal(blocked.meetsTarget, false);

const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "fenrua-public-estate-quality-"));
try {
  const output = path.join(temporaryDirectory, "quality.json");
  writeExternalQualityResult(output, blocked);
  assert.ok(existsSync(output));
  assert.equal(JSON.parse(readFileSync(output, "utf8")).score, blocked.score);
  assert.throws(() => writeExternalQualityResult(path.join(root, "quality-result.json"), blocked), /outside the repository/);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log(JSON.stringify({ status: "ok", scope: "public-estate-quality-gate-model", domains: config.domains.length }));
