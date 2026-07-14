import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const [packageSource, lockSource, licenseInventory] = await Promise.all([
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  readFile(new URL("../docs/DEPENDENCY_LICENSES.md", import.meta.url), "utf8"),
]);
const packageJson = JSON.parse(packageSource);
const lockfile = JSON.parse(lockSource);

assert.equal(packageJson.engines?.node, "24.x");
assert.equal(packageJson.packageManager, "npm@11.18.0");
for (const [name, version] of Object.entries(packageJson.devDependencies ?? {})) {
  assert.match(version, /^\d+\.\d+\.\d+$/, `${name} must use an exact version.`);
  assert.equal(lockfile.packages?.[`node_modules/${name}`]?.version, version, `${name} must match package-lock.json.`);
}
assert.equal(packageJson.devDependencies?.["@axe-core/playwright"], "4.12.1");
assert.equal(packageJson.devDependencies?.["@playwright/test"], "1.61.1");
for (const text of ["@axe-core/playwright", "4.12.1", "MPL-2.0", "@playwright/test", "1.61.1", "Apache-2.0"]) {
  assert.ok(licenseInventory.includes(text), `Dependency license inventory must contain ${text}.`);
}

const workflowDirectory = new URL("../.github/workflows/", import.meta.url);
const workflowFiles = (await readdir(workflowDirectory)).filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"));
for (const file of workflowFiles) {
  const source = await readFile(new URL(file, workflowDirectory), "utf8");
  for (const match of source.matchAll(/^\s*uses:\s*([^\s@]+)@([^\s#]+).*/gm)) {
    assert.match(match[2], /^[0-9a-f]{40}$/i, `${file} must pin ${match[1]} to a full commit SHA.`);
  }
}

console.log(JSON.stringify({ status: "ok", scope: "release-toolchain-pinning", workflows: workflowFiles.length, dependencies: Object.keys(packageJson.devDependencies ?? {}).length }));
