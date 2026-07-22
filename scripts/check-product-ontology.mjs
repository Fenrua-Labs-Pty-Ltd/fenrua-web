import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicArtifactFiles } from "./public-output-lib.mjs";

const scriptPath = fileURLToPath(import.meta.url);
export const REPO_ROOT = path.resolve(path.dirname(scriptPath), "..");

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  return Number.isFinite(Date.parse(`${value}T00:00:00Z`));
}

export function readJson(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read ${relativePath}: ${error.message}`);
  }
}

export function readText(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

export function fileExists(relativePath) {
  return fs.existsSync(path.join(REPO_ROOT, relativePath));
}

export function relativePath(absolutePath) {
  return path.relative(REPO_ROOT, absolutePath).split(path.sep).join("/");
}

export function unique(values) {
  return [...new Set(values)];
}

export function duplicates(values) {
  const seen = new Set();
  const duplicateValues = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicateValues.add(value);
    seen.add(value);
  }
  return [...duplicateValues];
}

export function expect(errors, condition, message) {
  if (!condition) errors.push(message);
}

export function requireFields(errors, record, fields, label) {
  if (!isPlainObject(record)) {
    errors.push(`${label} must be an object`);
    return false;
  }

  for (const field of fields) {
    if (!(field in record)) errors.push(`${label} is missing ${field}`);
  }
  return true;
}

export function checkSchemaMetadata(errors, schema, expectedId, expectedVersion, requiredTopLevelFields) {
  requireFields(errors, schema, ["$schema", "$id", "title", "type", "required", "properties"], expectedId);
  expect(errors, schema.$schema === "https://json-schema.org/draft/2020-12/schema", `${expectedId} must use draft 2020-12`);
  expect(errors, schema.$id === expectedId, `${expectedId} has an unexpected $id`);
  expect(errors, schema.type === "object", `${expectedId} must describe an object`);
  expect(errors, schema.additionalProperties === false, `${expectedId} must reject unknown top-level fields`);
  expect(errors, Array.isArray(schema.required), `${expectedId} must declare required fields`);
  for (const field of requiredTopLevelFields) {
    expect(errors, schema.required?.includes(field), `${expectedId} must require ${field}`);
  }
  expect(errors, schema.properties?.schemaVersion?.const === expectedVersion, `${expectedId} must bind ${expectedVersion}`);
}

export function checkSourceReferences(errors, record, documentRecordIds, label) {
  requireFields(errors, record, ["sourceReferences"], label);
  const references = record.sourceReferences;
  requireFields(errors, references, ["companyIdentityId", "siteEvidenceId", "documentRegisterId"], `${label}.sourceReferences`);
  for (const key of ["companyIdentityId", "siteEvidenceId", "documentRegisterId"]) {
    const id = references?.[key];
    expect(errors, isNonEmptyString(id), `${label}.sourceReferences.${key} must be a non-empty string`);
    expect(errors, documentRecordIds.has(id), `${label}.sourceReferences.${key} references unknown document record ${id}`);
  }
}

export function documentRecordIds() {
  const register = readJson("data/public-document-register.json");
  return new Set((register.records ?? []).map((record) => record.id));
}

export function scanFiles(rootRelativePath, predicate) {
  const root = path.join(REPO_ROOT, rootRelativePath);
  if (!fs.existsSync(root)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else if (entry.isFile() && predicate(absolutePath)) files.push(relativePath(absolutePath));
    }
  };
  visit(root);
  return files.sort();
}

export function normaliseText(value) {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#34;", "\"")
    .replaceAll("&amp;", "&")
    .replaceAll("&nbsp;", " ")
    .replaceAll("\u2018", "'")
    .replaceAll("\u2019", "'")
    .replaceAll("\u201c", "\"")
    .replaceAll("\u201d", "\"")
    .replace(/\s+/g, " ")
    .trim();
}

export function mainTextFromHtml(html) {
  const match = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  return normaliseText(match?.[1] ?? "");
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function termOccurrences(text, term) {
  const source = term.split(/\s+/).map(escapeRegExp).join("\\s+");
  const expression = new RegExp(`\\b${source}\\b`, "gi");
  const matches = [];
  for (const match of text.matchAll(expression)) {
    matches.push({ index: match.index, length: match[0].length });
  }
  return matches;
}

export function contextRanges(text, context) {
  const lowerText = text.toLocaleLowerCase("en-AU");
  const lowerContext = context.toLocaleLowerCase("en-AU");
  const ranges = [];
  let offset = 0;
  while (offset <= lowerText.length - lowerContext.length) {
    const index = lowerText.indexOf(lowerContext, offset);
    if (index === -1) break;
    ranges.push({ start: index, end: index + lowerContext.length });
    offset = index + Math.max(lowerContext.length, 1);
  }
  return ranges;
}

export function occurrenceInRanges(occurrence, ranges) {
  return ranges.some((range) => occurrence.index >= range.start && occurrence.index + occurrence.length <= range.end);
}

export function finish(errors, label) {
  if (errors.length > 0) {
    console.error(`${label}: failed with ${errors.length} issue(s)`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return false;
  }
  console.log(`${label}: ok`);
  return true;
}

export function isMain(moduleUrl) {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(moduleUrl);
}

function validateStringArray(errors, value, label, { allowEmpty = true } = {}) {
  expect(errors, Array.isArray(value), `${label} must be an array`);
  if (!Array.isArray(value)) return;
  if (!allowEmpty) expect(errors, value.length > 0, `${label} must not be empty`);
  for (const [index, item] of value.entries()) {
    expect(errors, isNonEmptyString(item), `${label}[${index}] must be a non-empty string`);
  }
  for (const duplicate of duplicates(value)) errors.push(`${label} contains duplicate ${duplicate}`);
}

function validateLegacyTermScan(errors, data, claimIds) {
  const policy = data.legacyTermPolicy;
  requireFields(errors, policy, ["scanRoot", "terms"], "legacyTermPolicy");
  expect(errors, policy?.scanRoot === "public", "legacyTermPolicy must scan generated public output");
  expect(errors, Array.isArray(policy?.terms), "legacyTermPolicy.terms must be an array");
  if (!Array.isArray(policy?.terms)) return;

  const requiredTerms = ["nexus", "wallet", "swap", "presale", "market", "common", "token"];
  const termsByName = new Map();
  for (const termRecord of policy.terms) {
    requireFields(errors, termRecord, ["term", "status", "replacementId", "allowances"], "legacyTermPolicy term");
    const term = termRecord.term?.toLocaleLowerCase("en-AU");
    expect(errors, isNonEmptyString(term), "legacy term must be a non-empty string");
    expect(errors, !termsByName.has(term), `legacy term ${term} is duplicated`);
    termsByName.set(term, termRecord);
    expect(errors, ["deprecated", "historical"].includes(termRecord.status), `legacy term ${term} has an invalid status`);
    expect(errors, termRecord.replacementId === null || data.entities.some((entity) => entity.id === termRecord.replacementId), `legacy term ${term} has an unknown replacementId`);
    expect(errors, Array.isArray(termRecord.allowances), `legacy term ${term} allowances must be an array`);
  }
  for (const term of requiredTerms) expect(errors, termsByName.has(term), `legacyTermPolicy must include ${term}`);

  // public/ is a disposable staging directory. Scan the exact source artifacts it
  // would contain so `npm ci && npm run generate:static && npm run validate` works
  // from a fresh checkout without accepting stale staged output.
  const generatedFiles = publicArtifactFiles()
    .filter((file) => path.basename(file) === "index.html")
    .map((file) => `public/${file}`);
  expect(errors, generatedFiles.length > 0, "No generated public HTML files were found for legacy-term scanning");
  const textByFile = new Map(
    generatedFiles.map((file) => [file, mainTextFromHtml(readText(file.slice("public/".length)))])
  );

  for (const [term, termRecord] of termsByName) {
    const allowances = termRecord.allowances ?? [];
    const allowedByFile = new Map();
    for (const allowance of allowances) {
      requireFields(errors, allowance, ["file", "context", "claimId", "expectedMatches"], `legacy allowance for ${term}`);
      expect(errors, generatedFiles.includes(allowance.file), `legacy allowance for ${term} references non-generated file ${allowance.file}`);
      expect(errors, isNonEmptyString(allowance.context), `legacy allowance for ${term} needs a context`);
      expect(errors, claimIds.has(allowance.claimId), `legacy allowance for ${term} references unknown claim ${allowance.claimId}`);
      expect(errors, Number.isInteger(allowance.expectedMatches) && allowance.expectedMatches > 0, `legacy allowance for ${term} has invalid expectedMatches`);
      if (!textByFile.has(allowance.file)) continue;
      const text = textByFile.get(allowance.file);
      const ranges = contextRanges(text, allowance.context);
      expect(errors, ranges.length > 0, `legacy allowance for ${term} has no matching context in ${allowance.file}`);
      const matches = termOccurrences(text, term).filter((occurrence) => occurrenceInRanges(occurrence, ranges));
      expect(errors, matches.length === allowance.expectedMatches, `legacy allowance for ${term} in ${allowance.file} expected ${allowance.expectedMatches} matches but found ${matches.length}`);
      const allowed = allowedByFile.get(allowance.file) ?? new Set();
      for (const occurrence of matches) allowed.add(occurrence.index);
      allowedByFile.set(allowance.file, allowed);
    }

    for (const file of generatedFiles) {
      const occurrences = termOccurrences(textByFile.get(file), term);
      const allowed = allowedByFile.get(file) ?? new Set();
      for (const occurrence of occurrences) {
        expect(errors, allowed.has(occurrence.index), `deprecated term ${term} appears outside approved non-claim context in ${file}`);
      }
    }
  }
}

export function validateProductOntology() {
  const errors = [];
  const schema = readJson("schemas/product-ontology.v1.schema.json");
  const data = readJson("data/product-ontology.json");
  const evidenceTaxonomy = readJson("data/evidence-taxonomy.json");
  const claimRegister = readJson("data/claim-register.json");
  const knownEvidenceIds = new Set((evidenceTaxonomy.evidenceRecords ?? []).map((record) => record.id));
  const claimIds = new Set((claimRegister.claims ?? []).map((claim) => claim.id));

  checkSchemaMetadata(
    errors,
    schema,
    "https://fenrua.ai/schemas/product-ontology.v1.schema.json",
    "fenrua.product-ontology.v1",
    ["schemaVersion", "lastReviewed", "sourceReferences", "entities", "legacyTermPolicy"]
  );
  requireFields(errors, data, ["schemaVersion", "lastReviewed", "sourceReferences", "entities", "legacyTermPolicy"], "product ontology");
  expect(errors, data.schemaVersion === "fenrua.product-ontology.v1", "product ontology has an unexpected schemaVersion");
  expect(errors, isDate(data.lastReviewed), "product ontology lastReviewed must be an ISO date");
  checkSourceReferences(errors, data, documentRecordIds(), "product ontology");
  expect(errors, Array.isArray(data.entities), "product ontology entities must be an array");
  if (!Array.isArray(data.entities)) return errors;

  const entityIds = data.entities.map((entity) => entity?.id);
  for (const duplicate of duplicates(entityIds)) errors.push(`product ontology has duplicate entity id ${duplicate}`);
  const allowedTypes = new Set(["organisation", "product", "subsystem", "capability", "research-family", "observation-source"]);
  const allowedStatuses = new Set(["current", "deprecated", "historical", "planned"]);
  const requiredEntityIds = [
    "fenrua.labs",
    "fenrua.protocol",
    "fenrua.ai-efficiency-infrastructure",
    "fenrua.layer-0-security-controls",
    "fenrua.security-kernel",
    "fenrua.utilities",
    "fenrua.evidence",
    "fenrua.verification",
    "fenrua.research",
    "fenrua.pn521",
    "fenrua.fenc978",
    "fenrua.fenn521",
    "fenrua.local-trust-gate",
    "fenrua.public-evidence-interface",
    "fenrua.commercial-service-boundary"
  ];
  for (const id of requiredEntityIds) expect(errors, entityIds.includes(id), `product ontology is missing required entity ${id}`);

  for (const entity of data.entities) {
    const label = `entity ${entity?.id ?? "<unknown>"}`;
    requireFields(errors, entity, ["id", "canonicalName", "entityType", "status", "category", "definition", "aliases", "deprecatedAliases", "prohibitedAmbiguities", "replacementId", "effectiveDate", "publicRoutes", "owner", "evidenceIds"], label);
    expect(errors, /^fenrua\.[a-z0-9-]+$/.test(entity?.id ?? ""), `${label} has an invalid id`);
    expect(errors, isNonEmptyString(entity?.canonicalName), `${label} needs a canonicalName`);
    expect(errors, allowedTypes.has(entity?.entityType), `${label} has an invalid entityType`);
    expect(errors, allowedStatuses.has(entity?.status), `${label} has an invalid status`);
    expect(errors, isNonEmptyString(entity?.category), `${label} needs a category`);
    expect(errors, isNonEmptyString(entity?.definition), `${label} needs a definition`);
    expect(errors, isDate(entity?.effectiveDate), `${label} effectiveDate must be an ISO date`);
    expect(errors, isNonEmptyString(entity?.owner), `${label} needs an owner`);
    validateStringArray(errors, entity?.aliases, `${label}.aliases`);
    validateStringArray(errors, entity?.deprecatedAliases, `${label}.deprecatedAliases`);
    validateStringArray(errors, entity?.prohibitedAmbiguities, `${label}.prohibitedAmbiguities`);
    validateStringArray(errors, entity?.publicRoutes, `${label}.publicRoutes`);
    validateStringArray(errors, entity?.evidenceIds, `${label}.evidenceIds`);
    for (const route of entity?.publicRoutes ?? []) expect(errors, route.startsWith("/"), `${label} route ${route} must start with /`);
    for (const evidenceId of entity?.evidenceIds ?? []) expect(errors, knownEvidenceIds.has(evidenceId), `${label} references unknown evidence ${evidenceId}`);
    expect(errors, entity?.replacementId === null || entityIds.includes(entity?.replacementId), `${label} has an unknown replacementId`);
  }

  const entityById = new Map(data.entities.map((entity) => [entity.id, entity]));
  expect(errors, entityById.get("fenrua.labs")?.entityType === "organisation", "Fenrua Labs must be an organisation");
  expect(errors, entityById.get("fenrua.labs")?.canonicalName === "Fenrua Labs", "Fenrua Labs must retain its canonical company name");
  expect(errors, entityById.get("fenrua.protocol")?.entityType === "product", "Fenrua BlackBox Protocol must be a product direction");
  expect(errors, entityById.get("fenrua.protocol")?.canonicalName === "Fenrua BlackBox Protocol", "Fenrua BlackBox Protocol must retain its canonical platform label");
  expect(errors, entityById.get("fenrua.layer-0-security-controls")?.entityType === "subsystem", "Layer 0 must be represented as a subsystem");
  expect(errors, /security-control/i.test(entityById.get("fenrua.layer-0-security-controls")?.definition ?? ""), "Layer 0 definition must retain its security-control boundary");
  for (const id of ["fenrua.fenc978", "fenrua.fenn521"]) {
    const entity = entityById.get(id);
    expect(errors, entity?.entityType === "observation-source", `${id} must be an observation source`);
    expect(errors, entity?.category === "observation", `${id} must use the observation category`);
    expect(errors, (entity?.prohibitedAmbiguities ?? []).some((value) => /not the definition of the platform/i.test(value)), `${id} must state that it is not the platform definition`);
  }
  const localTrustGate = entityById.get("fenrua.local-trust-gate");
  expect(errors, localTrustGate?.status === "planned", "Local Trust Gate must remain planned without source evidence");
  expect(errors, localTrustGate?.publicRoutes?.length === 0, "Local Trust Gate must not expose a current public route");
  expect(errors, localTrustGate?.evidenceIds?.length === 0, "Local Trust Gate must not imply evidence that is not recorded");

  validateLegacyTermScan(errors, data, claimIds);
  return errors;
}

if (isMain(import.meta.url)) finish(validateProductOntology(), "check-product-ontology");
