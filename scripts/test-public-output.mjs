import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { outputDirectory, publicEntries, root } from "./public-output-lib.mjs";

assert.ok(existsSync(outputDirectory), "The Vercel static output directory must be staged before testing.");
assert.deepEqual(new Set(readdirSync(outputDirectory)), new Set(publicEntries));
for (const entry of publicEntries) {
  assert.ok(existsSync(resolve(outputDirectory, entry)), `Staged output is missing ${entry}.`);
}

for (const privateEntry of ["api", "scripts", "tests", "node_modules", "package.json", "package-lock.json", "README.md", ".env.local"]) {
  assert.ok(!existsSync(resolve(outputDirectory, privateEntry)), `Static output must not expose ${privateEntry}.`);
}

for (const relativePath of ["index.html", "kernel-status.js", "mobile-chain-status.js", "styles.css", "technical-data.js", ".well-known/fenrua-release.json"]) {
  assert.deepEqual(
    readFileSync(resolve(outputDirectory, relativePath)),
    readFileSync(resolve(root, relativePath)),
    `Staged artifact must be byte-identical: ${relativePath}`,
  );
}

console.log(JSON.stringify({ status: "ok", scope: "static-public-output-contract", entries: publicEntries.length }));
