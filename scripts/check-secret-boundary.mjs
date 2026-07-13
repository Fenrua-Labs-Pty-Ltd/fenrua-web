import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const maximumTextFileBytes = 5 * 1024 * 1024;
const permittedBinaryExtensions = new Set([
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mp4",
  ".otf",
  ".png",
  ".ttf",
  ".webp",
  ".woff",
  ".woff2",
]);
const prohibitedBasenames = new Set([
  ".npmrc",
  ".pypirc",
  "credentials.json",
  "id_ed25519",
  "id_rsa",
  "service-account.json",
]);
const prohibitedExtensions = new Set([
  ".age",
  ".gpg",
  ".jks",
  ".kdbx",
  ".key",
  ".keystore",
  ".ovpn",
  ".p12",
  ".pem",
  ".pfx",
]);
const prohibitedDirectoryNames = new Set([".secrets", "secrets", "vault"]);
const privateKeyPattern = new RegExp(
  ["-----BEGIN", "(?:[A-Z0-9]+ )?PRIVATE", "KEY-----"].join(" ")
);
const knownSecretPatterns = [
  ["private-key-pem", privateKeyPattern],
  ["age-secret-identity", /AGE-SECRET-KEY-(?:1[A-Z0-9]+|PQ-1[A-Z0-9]+)/],
  ["github-token", /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ["aws-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["slack-token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ["stripe-live-secret", /\bsk_live_[A-Za-z0-9]{20,}\b/],
  ["npm-auth-token", /(?:^|\n)\s*\/\/[^\s:]+\/:_authToken\s*=\s*\S+/],
  ["credentialed-url", /https?:\/\/[^\s/:@]+:[^\s/@]+@[^\s/]+/],
];
const sensitiveNameSuffixes = [
  "ACCESS_TOKEN",
  "API_KEY",
  "API_TOKEN",
  "AUTH_TOKEN",
  "BEARER_TOKEN",
  "CLIENT_SECRET",
  "CONNECTION_STRING",
  "COOKIE_SECRET",
  "DATABASE_DSN",
  "DATABASE_URL",
  "ENCRYPTION_KEY",
  "GATEWAY_URL",
  "MNEMONIC",
  "PASSWORD",
  "PRIVATE_KEY",
  "READ_TOKEN",
  "RECOVERY_PHRASE",
  "REDIS_URL",
  "REST_TOKEN",
  "SECRET",
  "SECRET_ACCESS_KEY",
  "SEED_PHRASE",
  "SERVICE_ACCOUNT_KEY",
  "SERVICE_ROLE_KEY",
  "SESSION_SECRET",
  "SIGNING_KEY",
  "TOKEN",
  "WEBHOOK_SECRET",
];
const quotedStaticAssignment = /(?:^|[,{;])\s*(?:(?:export\s+)?(?:const|let|var)\s+)?["']?([A-Za-z_$][A-Za-z0-9_$.-]*)["']?(?:\s*:\s*[A-Za-z0-9_$<>\[\]|.]+)?\s*(?::|(?<![=!<>])=(?!=))\s*(["'])([^"'\r\n]*)\2/gm;
const templateStaticAssignment = /(?:^|[,{;])\s*(?:(?:export\s+)?(?:const|let|var)\s+)?["']?([A-Za-z_$][A-Za-z0-9_$.-]*)["']?(?:\s*:\s*[A-Za-z0-9_$<>\[\]|.]+)?\s*(?::|(?<![=!<>])=(?!=))\s*`([^`]*)`/gm;
const bracketQuotedAssignment = /\[\s*(["'])([A-Za-z_$][A-Za-z0-9_$.-]*)\1\s*\]\s*(?<![=!<>])=(?!=)\s*(["'])([^"'\r\n]*)\3/gm;
const bracketTemplateAssignment = /\[\s*(["'])([A-Za-z_$][A-Za-z0-9_$.-]*)\1\s*\]\s*(?<![=!<>])=(?!=)\s*`([^`]*)`/gm;
const sensitiveCollapsedSuffixes = sensitiveNameSuffixes.map((suffix) => suffix.replaceAll("_", ""));
const exactPublicPlaceholderValues = new Set(["example-only", "placeholder", "redacted"]);
const explicitFixtureMarker = "public-secret-fixture";

function normalizeSensitiveName(name) {
  return name
    .split(".")
    .at(-1)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function isSensitiveName(name) {
  const normalized = normalizeSensitiveName(name);
  if (sensitiveNameSuffixes.some(
    (suffix) => normalized === suffix || normalized.endsWith(`_${suffix}`)
  )) return true;
  const collapsed = normalized.replaceAll("_", "");
  return sensitiveCollapsedSuffixes.some(
    (suffix) => collapsed === suffix || collapsed.endsWith(suffix)
  );
}

function isExplicitTestPath(repositoryPath) {
  const normalized = displayPath(repositoryPath);
  return /(?:^|\/)(?:tests?|__tests__)(?:\/|$)/.test(normalized) ||
    /(?:^|\/)scripts\/test-[^/]+$/.test(normalized);
}

function isPermittedFixtureValue(repositoryPath, value, trailingContext = "") {
  const normalizedValue = value.trim();
  if (!normalizedValue) return true;
  if (exactPublicPlaceholderValues.has(normalizedValue.toLowerCase())) return true;
  if (/^(?:false|null|true|~|-?\d+(?:\.\d+)?)$/i.test(normalizedValue)) return true;
  if (/^\$\{\{\s*(?:secrets|vars)\.[A-Za-z_][A-Za-z0-9_]*\s*\}\}$/.test(normalizedValue)) {
    return true;
  }
  if (/^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?$/.test(normalizedValue)) return true;
  if (/^[A-Z][A-Z0-9_]+$/.test(normalizedValue) && isSensitiveName(normalizedValue)) return true;
  try {
    const url = new URL(normalizedValue);
    return url.protocol === "https:" && url.hostname.endsWith(".example.test");
  } catch {
    return isExplicitTestPath(repositoryPath) &&
      new RegExp(`^\\s*[,;]?\\s*(?://|#)\\s*${explicitFixtureMarker}\\s*$`).test(trailingContext) &&
      /^test-fixture-[a-z0-9][a-z0-9_-]*$/i.test(normalizedValue);
  }
}

function displayPath(path) {
  return path.split(sep).join("/");
}

function lineNumber(text, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (text.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

function record(violations, path, rule, line = null) {
  violations.push({ path: displayPath(path), rule, ...(line === null ? {} : { line }) });
}

function inspectEnvironmentFile(path, text, violations) {
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || !isSensitiveName(match[1])) continue;
    const valueAndComment = match[2].match(/^(?:"([^"]*)"|'([^']*)'|([^#]*?))(?:\s+(#.*))?$/);
    const value = valueAndComment
      ? (valueAndComment[1] ?? valueAndComment[2] ?? valueAndComment[3] ?? "").trim()
      : match[2].trim();
    const trailing = valueAndComment?.[4] || "";
    if (!isPermittedFixtureValue(path, value, trailing)) {
      record(violations, path, "nonempty-sensitive-environment-value", index + 1);
    }
  }
}

function inspectSensitiveAssignments(path, text, violations) {
  const inspectPattern = (pattern, keyIndex, valueIndex) => {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      if (!isSensitiveName(match[keyIndex])) continue;
      const assignmentIndex = match.index + match[0].indexOf(match[keyIndex]);
      const assignmentLine = lineNumber(text, assignmentIndex);
      const lineStart = text.lastIndexOf("\n", assignmentIndex - 1) + 1;
      const lineEndMatch = text.indexOf("\n", assignmentIndex);
      const lineEnd = lineEndMatch === -1 ? text.length : lineEndMatch;
      const trailing = text.slice(match.index + match[0].length, lineEnd);
      if (!isPermittedFixtureValue(path, match[valueIndex], trailing)) {
        record(violations, path, "hardcoded-sensitive-literal", assignmentLine);
      }
    }
    pattern.lastIndex = 0;
  };
  inspectPattern(quotedStaticAssignment, 1, 3);
  inspectPattern(templateStaticAssignment, 1, 2);
  inspectPattern(bracketQuotedAssignment, 2, 4);
  inspectPattern(bracketTemplateAssignment, 2, 3);

  const extension = extname(path).toLowerCase();
  if (![".yaml", ".yml", ".toml"].includes(extension)) return;
  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const match = rawLine.match(/^\s*(?:-\s*)?["']?([A-Za-z_$][A-Za-z0-9_$.-]*)["']?\s*[:=]\s*([^#\r\n]+?)(\s+#.*)?$/);
    if (!match || !isSensitiveName(match[1])) continue;
    const value = match[2].trim().replace(/[,;]$/, "").replace(/^(?:"(.*)"|'(.*)')$/, "$1$2");
    if (!isPermittedFixtureValue(path, value, match[3] || "")) {
      record(violations, path, "hardcoded-sensitive-literal", index + 1);
    }
  }
}

export function inspectPublicFile({ absolutePath, repositoryPath }) {
  const violations = [];
  const normalizedPath = displayPath(repositoryPath);
  const segments = normalizedPath.split("/");
  const basename = segments.at(-1).toLowerCase();
  const extension = extname(basename).toLowerCase();

  if (segments.some((segment) => prohibitedDirectoryNames.has(segment.toLowerCase()))) {
    record(violations, repositoryPath, "secret-directory-in-public-source");
  }
  if (prohibitedBasenames.has(basename)) {
    record(violations, repositoryPath, "credential-file-in-public-source");
  }
  if (prohibitedExtensions.has(extension)) {
    record(violations, repositoryPath, "secret-bearing-extension-in-public-source");
  }

  const metadata = lstatSync(absolutePath);
  if (metadata.isSymbolicLink()) {
    record(violations, repositoryPath, "symbolic-link-in-public-source");
    return violations;
  }
  if (!metadata.isFile()) return violations;
  if (metadata.size > maximumTextFileBytes && !permittedBinaryExtensions.has(extension)) {
    record(violations, repositoryPath, "oversized-unscanned-public-file");
    return violations;
  }
  if (metadata.size > maximumTextFileBytes) return violations;

  const bytes = readFileSync(absolutePath);
  if (bytes.includes(0)) {
    if (!permittedBinaryExtensions.has(extension)) {
      record(violations, repositoryPath, "unreviewed-binary-public-file");
    }
    return violations;
  }

  const text = bytes.toString("utf8");
  for (const [rule, pattern] of knownSecretPatterns) {
    const match = pattern.exec(text);
    if (match) record(violations, repositoryPath, rule, lineNumber(text, match.index));
    pattern.lastIndex = 0;
  }

  if (basename === ".env" || basename === ".envrc" || basename.startsWith(".env.")) {
    inspectEnvironmentFile(repositoryPath, text, violations);
  } else {
    inspectSensitiveAssignments(repositoryPath, text, violations);
  }
  return violations;
}

export function scanPublicSource(repositoryRoot = root) {
  if (!statSync(repositoryRoot).isDirectory()) throw new Error("Repository root is unavailable.");
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }
  );
  const paths = new Set(output.split("\0").filter(Boolean));
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const absolutePath = resolve(directory, entry.name);
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        visit(absolutePath);
      } else {
        paths.add(displayPath(relative(repositoryRoot, absolutePath)));
      }
    }
  };
  visit(repositoryRoot);
  const sortedPaths = [...paths].sort();
  const violations = sortedPaths.flatMap((repositoryPath) =>
    inspectPublicFile({
      absolutePath: resolve(repositoryRoot, repositoryPath),
      repositoryPath,
    })
  );
  return { files: sortedPaths.length, violations };
}

function run() {
  const result = scanPublicSource();
  if (result.violations.length) {
    console.error("Public secret boundary violation. Values are intentionally redacted:");
    for (const violation of result.violations) {
      const location = violation.line ? `${violation.path}:${violation.line}` : violation.path;
      console.error(`- ${location} [${violation.rule}]`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({ status: "ok", scope: "public-secret-boundary", files: result.files }));
}

if (resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) run();
