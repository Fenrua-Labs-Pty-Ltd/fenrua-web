import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
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
  "claim-filter.js",
  "company",
  "data",
  "developers",
  "docs",
  "evidence",
  "favicon.ico",
  "examples",
  "index.html",
  "kernel",
  "kernel-status.js",
  "legal",
  "llms.txt",
  "mobile-chain-status.js",
  "operations",
  "platform",
  "research",
  "roadmap",
  "robots.txt",
  "security",
  "site.webmanifest",
  "sitemap.xml",
  "status",
  "status-monitor.js",
  "start",
  "styles.css",
  "styles.tokens.css",
  "support",
  "technical-data.js",
  "toolchain",
  "trust",
  "utilities",
  "verify",
];

const releaseManifestPath = ".well-known/fenrua-release.json";

function walkFiles(source) {
  if (!statSync(source).isDirectory()) return [source];
  return readdirSync(source, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(source, entry.name);
    return entry.isDirectory() ? walkFiles(child) : [child];
  });
}

export function publicArtifactFiles() {
  return publicEntries
    .flatMap((entry) => {
      const source = resolve(root, entry);
      if (!existsSync(source) && entry === ".well-known") return [];
      if (!existsSync(source)) throw new Error(`Public build input is missing: ${entry}`);
      return walkFiles(source);
    })
    .map((file) => relative(root, file).split(sep).join("/"))
    .filter((file) => file !== releaseManifestPath && !file.endsWith("/.gitkeep"))
    .sort((left, right) => left.localeCompare(right));
}

export function publicRouteFor(relativePath) {
  if (relativePath === "index.html") return "/";
  if (relativePath.endsWith("/index.html")) return `/${relativePath.slice(0, -"/index.html".length)}`;
  return `/${relativePath}`;
}

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
