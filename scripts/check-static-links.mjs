import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const linkPattern = /\b(?:href|src)="([^"]+)"/g;
const missing = [];

for (const match of html.matchAll(linkPattern)) {
  const target = match[1];

  if (
    target === "/" ||
    target.startsWith("#") ||
    target.startsWith("https://") ||
    target.startsWith("http://") ||
    target.startsWith("mailto:")
  ) {
    continue;
  }

  const [path] = target.split("#");
  if (!existsSync(resolve(root, path))) {
    missing.push(target);
  }
}

if (missing.length > 0) {
  console.error(`Missing static links:\n${missing.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log("Static links OK");
