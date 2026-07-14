import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { outputDirectory, publicArtifactFiles, stagePublicOutput } from "./public-output-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = publicArtifactFiles();

function digest(relativePath) {
  return createHash("sha256").update(readFileSync(resolve(outputDirectory, relativePath))).digest("hex");
}

stagePublicOutput();
const before = new Map(artifacts.map((artifact) => [artifact, digest(artifact)]));
execFileSync("npm", ["run", "generate:static"], { cwd: root, stdio: "pipe" });
stagePublicOutput();
const after = new Map(artifacts.map((artifact) => [artifact, digest(artifact)]));

assert.deepEqual(after, before, "Static generation and staged public output must be byte-for-byte deterministic for the committed public inputs.");
console.log(JSON.stringify({ status: "ok", scope: "deterministic-static-generation", files: artifacts.length }));
