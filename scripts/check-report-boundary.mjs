import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const excludedDirectories = new Set([".git", "node_modules", "public"]);
const reportName = /(?:^|[_-])(?:REPORT|AUDIT|REAUDIT|REVIEW|CLOSURE|ACCEPTANCE_MATRIX|SCREENSHOT_MATRIX)(?:[_-]|\.|$)/i;
const reportExtensions = new Set([".html", ".json", ".md", ".pdf", ".sarif", ".xml"]);
const prohibitedDirectories = new Set([
  "allure-results",
  "audit-reports",
  "coverage",
  "playwright-report",
  "reports",
  "test-results",
  "visual-baselines",
  "visual-captures",
  "visual-artifacts",
  "visual-regression-artifacts",
  ".visual-regression",
]);
const violations = [];

function extension(name) {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index).toLowerCase();
}

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (excludedDirectories.has(entry.name)) continue;
    const absolute = resolve(directory, entry.name);
    const repositoryPath = relative(root, absolute).split(sep).join("/");
    if (entry.isDirectory()) {
      if (prohibitedDirectories.has(entry.name.toLowerCase())) violations.push(`${repositoryPath}/`);
      else walk(absolute);
      continue;
    }
    if (!entry.isFile() || !reportExtensions.has(extension(entry.name))) continue;
    if (reportName.test(entry.name)) violations.push(repositoryPath);
  }
}

if (!existsSync(root) || !statSync(root).isDirectory()) throw new Error("Repository root is unavailable.");
walk(root);

if (violations.length) {
  console.error(`Report boundary violation. Store these artifacts outside the repository:\n${violations.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(JSON.stringify({ status: "ok", scope: "external-report-boundary" }));
