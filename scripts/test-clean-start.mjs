import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { closeSync, mkdtempSync, openSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dirty = execFileSync("git", ["status", "--porcelain=v1"], { cwd: root, encoding: "utf8" }).trim();
assert.equal(dirty, "", "Clean-start verification requires a committed, clean source checkout.");

const temporaryDirectory = mkdtempSync(resolve(tmpdir(), "fenrua-web-clean-start-"));
try {
  const archivePath = resolve(temporaryDirectory, "source.tar");
  const archiveDescriptor = openSync(archivePath, "w");
  try {
    const archive = spawnSync("git", ["archive", "--format=tar", "HEAD"], {
      cwd: root,
      stdio: ["ignore", archiveDescriptor, "pipe"],
    });
    if (archive.error) throw archive.error;
    assert.equal(archive.status, 0, `git archive failed: ${archive.stderr?.toString("utf8").trim() || "unknown error"}`);
  } finally {
    closeSync(archiveDescriptor);
  }
  execFileSync("tar", ["--extract", "--file", archivePath, "--directory", temporaryDirectory], { stdio: "pipe" });
  rmSync(archivePath, { force: true });
  execFileSync("npm", ["ci", "--ignore-scripts"], { cwd: temporaryDirectory, stdio: "pipe", timeout: 180_000 });
  execFileSync("npm", ["run", "generate:static"], { cwd: temporaryDirectory, stdio: "pipe", timeout: 120_000 });
  execFileSync("npm", ["run", "validate"], { cwd: temporaryDirectory, stdio: "pipe", timeout: 180_000 });
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log(JSON.stringify({ status: "ok", scope: "clean-start", command: "npm ci && npm run generate:static && npm run validate" }));
