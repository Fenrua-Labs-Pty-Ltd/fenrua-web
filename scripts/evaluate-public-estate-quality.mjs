import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, realpathSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootRealPath = realpathSync(root);
const defaultConfigPath = path.join(root, "config", "public-estate-quality-gates.json");

function isInside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function relativeRepositoryPath(value, label) {
  if (typeof value !== "string" || !value || path.isAbsolute(value)) throw new TypeError(`${label} must be a non-empty repository-relative path.`);
  const absolute = path.resolve(root, value);
  if (!isInside(absolute, root)) throw new TypeError(`${label} must stay inside the repository root.`);
  return absolute;
}

function requireObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
  return value;
}

function validateConfig(config) {
  requireObject(config, "Gate configuration");
  if (config.schemaVersion !== "fenrua.public-estate-quality-gates.v1") throw new TypeError("Unsupported public-estate gate configuration schema.");
  if (!Number.isInteger(config.targetScore) || config.targetScore < 1 || config.targetScore > 100) {
    throw new TypeError("targetScore must be an integer from 1 to 100.");
  }
  if (!Array.isArray(config.domains) || config.domains.length === 0) throw new TypeError("Gate configuration must contain domains.");

  const domainIds = new Set();
  const gateIds = new Set();
  let totalWeight = 0;
  for (const domain of config.domains) {
    requireObject(domain, "Domain");
    if (typeof domain.id !== "string" || !/^[a-z0-9-]+$/.test(domain.id) || domainIds.has(domain.id)) {
      throw new TypeError("Each domain needs a unique kebab-case id.");
    }
    domainIds.add(domain.id);
    if (!Number.isInteger(domain.weight) || domain.weight < 1) throw new TypeError(`Domain ${domain.id} needs a positive integer weight.`);
    if (!Number.isInteger(domain.minimumScore) || domain.minimumScore < 0 || domain.minimumScore > domain.weight) {
      throw new TypeError(`Domain ${domain.id} has an invalid minimum score.`);
    }
    if (!Array.isArray(domain.gates) || domain.gates.length === 0) throw new TypeError(`Domain ${domain.id} must have gates.`);
    let domainPoints = 0;
    for (const gate of domain.gates) {
      requireObject(gate, `Gate in ${domain.id}`);
      if (typeof gate.id !== "string" || !/^[a-z0-9-]+$/.test(gate.id) || gateIds.has(gate.id)) {
        throw new TypeError(`Gate ids must be unique kebab-case values: ${gate.id ?? "unknown"}.`);
      }
      gateIds.add(gate.id);
      if (!Number.isInteger(gate.points) || gate.points < 1) throw new TypeError(`Gate ${gate.id} needs positive integer points.`);
      if (typeof gate.hardBlocker !== "boolean") throw new TypeError(`Gate ${gate.id} must declare hardBlocker.`);
      if (typeof gate.requirement !== "string" || !gate.requirement.trim()) throw new TypeError(`Gate ${gate.id} must describe its requirement.`);
      if (!Array.isArray(gate.checks) || gate.checks.length === 0) throw new TypeError(`Gate ${gate.id} needs at least one machine check.`);
      for (const check of gate.checks) {
        requireObject(check, `Check in ${gate.id}`);
        if (check.kind === "file") relativeRepositoryPath(check.path, `File check in ${gate.id}`);
        else if (check.kind === "node") {
          relativeRepositoryPath(check.script, `Node check in ${gate.id}`);
          if (check.args !== undefined && (!Array.isArray(check.args) || !check.args.every((value) => typeof value === "string"))) {
            throw new TypeError(`Node check arguments in ${gate.id} must be strings.`);
          }
        } else {
          throw new TypeError(`Gate ${gate.id} has an unsupported check kind.`);
        }
      }
      domainPoints += gate.points;
    }
    if (domainPoints !== domain.weight) throw new TypeError(`Domain ${domain.id} points must equal its weight.`);
    totalWeight += domain.weight;
  }
  if (totalWeight !== 100) throw new TypeError(`Gate configuration weights must total 100, received ${totalWeight}.`);
  return config;
}

export function loadGateConfiguration(configPath = defaultConfigPath) {
  const absolute = relativeRepositoryPath(path.relative(root, path.resolve(configPath)), "Gate configuration");
  return validateConfig(JSON.parse(readFileSync(absolute, "utf8")));
}

function conciseError(error) {
  const output = [error?.stdout, error?.stderr, error?.message]
    .filter((value) => typeof value === "string" && value.trim())
    .join("\n")
    .replaceAll(root, "<repository>")
    .trim();
  return output.slice(0, 1200) || "Check failed without diagnostic output.";
}

function defaultCheckRunner(check) {
  if (check.kind === "file") {
    const absolute = relativeRepositoryPath(check.path, "File check");
    if (!existsSync(absolute)) return { ok: false, detail: `Missing ${check.path}.` };
    if (!lstatSync(absolute).isFile()) return { ok: false, detail: `${check.path} is not a file.` };
    return { ok: true, detail: `${check.path} exists.` };
  }
  try {
    execFileSync(process.execPath, [check.script, ...(check.args ?? [])], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
    });
    return { ok: true, detail: `${check.script} passed.` };
  } catch (error) {
    return { ok: false, detail: conciseError(error) };
  }
}

export function evaluatePublicEstateQuality({ config = loadGateConfiguration(), checkRunner = defaultCheckRunner } = {}) {
  validateConfig(config);
  const hardBlockers = [];
  let totalScore = 0;
  const domains = config.domains.map((domain) => {
    let score = 0;
    const gates = domain.gates.map((gate) => {
      const checks = gate.checks.map((check) => {
        const result = checkRunner(check);
        if (!result || typeof result.ok !== "boolean") throw new TypeError(`Check runner returned an invalid result for ${gate.id}.`);
        return { kind: check.kind, target: check.path ?? check.script, ok: result.ok, detail: result.detail ?? "" };
      });
      const passed = checks.every((check) => check.ok);
      if (passed) score += gate.points;
      if (!passed && gate.hardBlocker) hardBlockers.push({ id: gate.id, requirement: gate.requirement });
      return { id: gate.id, points: gate.points, hardBlocker: gate.hardBlocker, requirement: gate.requirement, passed, checks };
    });
    totalScore += score;
    return {
      id: domain.id,
      title: domain.title,
      score,
      weight: domain.weight,
      minimumScore: domain.minimumScore,
      meetsMinimum: score >= domain.minimumScore,
      gates,
    };
  });

  return {
    schemaVersion: "fenrua.public-estate-quality-result.v1",
    evaluatedAt: new Date().toISOString(),
    targetScore: config.targetScore,
    score: totalScore,
    hardBlockerCount: hardBlockers.length,
    hardBlockers,
    domains,
    meetsTarget: totalScore >= config.targetScore && hardBlockers.length === 0 && domains.every((domain) => domain.meetsMinimum),
  };
}

export function writeExternalQualityResult(outputPath, result) {
  if (typeof outputPath !== "string" || !path.isAbsolute(outputPath)) throw new TypeError("--output must be an absolute path outside the repository.");
  const absolute = path.resolve(outputPath);
  const outputDirectory = path.dirname(absolute);
  mkdirSync(outputDirectory, { recursive: true });
  const externalDirectory = realpathSync(outputDirectory);
  if (isInside(externalDirectory, rootRealPath)) throw new TypeError("--output must be outside the repository.");
  if (existsSync(absolute) && lstatSync(absolute).isSymbolicLink()) throw new TypeError("--output must not be a symbolic link.");
  writeFileSync(absolute, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return absolute;
}

function parseArguments(args) {
  let outputPath = null;
  let enforce = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--enforce") {
      enforce = true;
      continue;
    }
    if (argument !== "--output") throw new TypeError(`Unknown argument: ${argument}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new TypeError("--output requires an absolute path.");
    outputPath = value;
    index += 1;
  }
  if (!outputPath) throw new TypeError("--output is required so quality results remain outside the repository.");
  return { outputPath, enforce };
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const { outputPath, enforce } = parseArguments(process.argv.slice(2));
  const result = evaluatePublicEstateQuality();
  const output = writeExternalQualityResult(outputPath, result);
  console.log(JSON.stringify({ status: "evaluated", output, score: result.score, targetScore: result.targetScore, hardBlockerCount: result.hardBlockerCount, meetsTarget: result.meetsTarget }));
  if (enforce && !result.meetsTarget) process.exitCode = 1;
}
