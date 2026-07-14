import { existsSync, lstatSync, mkdirSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const repositoryRoot = realpathSync(sourceRoot);

function isInside(candidate, parent) {
  const pathFromParent = relative(parent, candidate);
  return pathFromParent === ""
    || (!pathFromParent.startsWith(`..${sep}`) && pathFromParent !== ".." && !isAbsolute(pathFromParent));
}

function nearestExistingDirectory(path) {
  let candidate = path;
  while (!existsSync(candidate)) {
    const parent = dirname(candidate);
    if (parent === candidate) throw new TypeError(`No existing parent directory for artifact path: ${path}`);
    candidate = parent;
  }
  if (!statSync(candidate).isDirectory()) throw new TypeError(`Artifact path parent must be a directory: ${candidate}`);
  return candidate;
}

/**
 * Canonicalises an artifact directory and proves it cannot resolve into source.
 */
export function requireExternalArtifactDirectory(value, label, { create = true } = {}) {
  if (typeof value !== "string" || !value || !isAbsolute(value)) {
    throw new TypeError(`${label} must be an absolute path outside the public source repository.`);
  }

  const absolute = resolve(value);
  if (isInside(absolute, repositoryRoot)) {
    throw new TypeError(`${label} must be outside the public source repository: ${absolute}`);
  }

  if (existsSync(absolute)) {
    const entry = lstatSync(absolute);
    if (entry.isSymbolicLink()) throw new TypeError(`${label} must not be a symbolic link: ${absolute}`);
    if (!entry.isDirectory()) throw new TypeError(`${label} must be a directory: ${absolute}`);
  } else {
    if (!create) throw new TypeError(`${label} must already exist: ${absolute}`);
    const existingParent = nearestExistingDirectory(absolute);
    const canonicalParent = realpathSync(existingParent);
    const prospectivePath = resolve(canonicalParent, relative(existingParent, absolute));
    if (isInside(prospectivePath, repositoryRoot)) {
      throw new TypeError(`${label} resolves into the public source repository: ${absolute}`);
    }
    mkdirSync(absolute, { recursive: true });
  }

  const canonical = realpathSync(absolute);
  if (isInside(canonical, repositoryRoot)) {
    throw new TypeError(`${label} resolves into the public source repository: ${absolute}`);
  }
  return canonical;
}
