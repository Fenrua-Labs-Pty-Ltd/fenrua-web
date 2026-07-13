import { cpSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const outputDirectory = resolve(root, "public");

// This is the complete static deployment surface. Vercel discovers root api/
// functions separately; do not copy them into the static output directory.
export const publicEntries = [
  ".well-known",
  "accessibility",
  "architecture",
  "assets",
  "audit",
  "data",
  "developers",
  "docs",
  "evidence",
  "examples",
  "fenpresale",
  "fenswap",
  "index.html",
  "kernel",
  "kernel-status.js",
  "legal",
  "mobile-chain-status.js",
  "nexus",
  "privacy",
  "research",
  "robots.txt",
  "security",
  "sitemap.xml",
  "status",
  "styles.css",
  "support",
  "technical-data.js",
  "terms",
  "toolchain",
  "utilities",
  "verify",
  "wallet",
];

export function stagePublicOutput() {
  for (const entry of publicEntries) {
    if (!existsSync(resolve(root, entry))) throw new Error(`Public build input is missing: ${entry}`);
  }
  rmSync(outputDirectory, { recursive: true, force: true });
  mkdirSync(outputDirectory, { recursive: true });
  for (const entry of publicEntries) {
    const source = resolve(root, entry);
    cpSync(source, resolve(outputDirectory, entry), { recursive: statSync(source).isDirectory() });
  }
  return publicEntries.length;
}
