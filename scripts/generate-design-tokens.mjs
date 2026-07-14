import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "design", "tokens.json");
const outputPath = path.join(root, "styles.tokens.css");
const checkMode = process.argv.includes("--check");
const source = JSON.parse(readFileSync(sourcePath, "utf8"));

if (source.schemaVersion !== "fenrua.design-tokens.v1" || !source.tokens || !source.aliases) {
  throw new Error("design/tokens.json must provide the fenrua.design-tokens.v1 token and alias maps.");
}

function validTokenName(name) {
  return /^[a-z][a-z0-9-]*$/.test(name);
}

function validTokenValue(value) {
  return typeof value === "string" && value.length > 0 && !/[\r\n{};]/.test(value);
}

for (const [name, value] of Object.entries({ ...source.tokens, ...source.aliases })) {
  if (!validTokenName(name) || !validTokenValue(value)) {
    throw new Error(`Invalid design token: ${name}`);
  }
}

const output = `/* Generated from design/tokens.json. Do not edit manually. */
:root {
${Object.entries(source.tokens).map(([name, value]) => `  --${name}: ${value};`).join("\n")}
${Object.entries(source.aliases).map(([name, value]) => `  --${name}: ${value};`).join("\n")}
}
`;

if (checkMode) {
  if (readFileSync(outputPath, "utf8") !== output) {
    throw new Error("styles.tokens.css is stale; run node scripts/generate-design-tokens.mjs.");
  }
} else {
  writeFileSync(outputPath, output);
}

console.log(JSON.stringify({ status: "ok", mode: checkMode ? "check" : "write", output: "styles.tokens.css" }));
