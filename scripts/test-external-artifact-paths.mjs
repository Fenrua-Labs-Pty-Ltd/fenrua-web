import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { repositoryRoot, requireExternalArtifactDirectory } from "./external-artifact-paths.mjs";

const temporaryDirectory = mkdtempSync(resolve(tmpdir(), "fenrua-artifact-paths-"));
const repositoryEscapeName = "fenrua-artifact-path-escape-proof";

try {
  const artifactDirectory = resolve(temporaryDirectory, "playwright-results");
  assert.equal(
    requireExternalArtifactDirectory(artifactDirectory, "Playwright output"),
    realpathSync(artifactDirectory),
    "An external artifact directory must be canonicalised before use.",
  );

  assert.throws(
    () => requireExternalArtifactDirectory(repositoryRoot, "Repository output"),
    /outside the public source repository/,
  );

  const inwardLink = resolve(temporaryDirectory, "inward-link");
  symlinkSync(repositoryRoot, inwardLink, "dir");
  const escapedDirectory = resolve(inwardLink, repositoryEscapeName);
  assert.throws(
    () => requireExternalArtifactDirectory(escapedDirectory, "Escaped output"),
    /resolves into the public source repository/,
  );
  assert.equal(existsSync(resolve(repositoryRoot, repositoryEscapeName)), false, "A symlink escape must not create source files.");

  const externalTarget = resolve(temporaryDirectory, "external-target");
  mkdirSync(externalTarget);
  const externalLink = resolve(temporaryDirectory, "external-link");
  symlinkSync(externalTarget, externalLink, "dir");
  assert.throws(
    () => requireExternalArtifactDirectory(externalLink, "Linked output"),
    /must not be a symbolic link/,
  );
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log(JSON.stringify({ status: "ok", scope: "external-artifact-path-boundary" }));
