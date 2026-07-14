import {
  checkSchemaMetadata,
  checkSourceReferences,
  documentRecordIds,
  duplicates,
  expect,
  finish,
  isDate,
  isMain,
  isNonEmptyString,
  isPlainObject,
  readJson,
  requireFields,
} from "./check-product-ontology.mjs";

const CAPABILITY_FIELDS = [
  "id",
  "name",
  "category",
  "lifecycle",
  "maturity",
  "availability",
  "summary",
  "interfaces",
  "claimIds",
  "evidenceIds",
  "limitations",
  "nonClaims",
  "dependencies",
  "owner",
  "lastReviewed",
  "promotionGate",
];

const LIFECYCLES = new Set(["planned", "active", "deprecated", "retired"]);
const MATURITIES = new Set(["research", "doctrine", "specification", "prototype", "reference-implementation", "beta", "production"]);
const AVAILABILITIES = new Set(["not-available", "source-only", "local", "limited-preview", "generally-available"]);
const INTERFACE_KINDS = new Set(["public-route", "public-api", "command", "source-artifact", "agreement", "documentation"]);
const USABLE_INTERFACE_KINDS = new Set(["public-route", "public-api", "command", "agreement"]);

function validateStringArray(errors, value, label, { allowEmpty = true } = {}) {
  expect(errors, Array.isArray(value), `${label} must be an array`);
  if (!Array.isArray(value)) return;
  if (!allowEmpty) expect(errors, value.length > 0, `${label} must not be empty`);
  for (const [index, item] of value.entries()) {
    expect(errors, isNonEmptyString(item), `${label}[${index}] must be a non-empty string`);
  }
  for (const duplicate of duplicates(value)) errors.push(`${label} contains duplicate ${duplicate}`);
}

function validateInterfaces(errors, interfaces, label) {
  expect(errors, Array.isArray(interfaces), `${label}.interfaces must be an array`);
  if (!Array.isArray(interfaces)) return [];
  const kinds = [];
  for (const [index, entry] of interfaces.entries()) {
    const entryLabel = `${label}.interfaces[${index}]`;
    requireFields(errors, entry, ["kind", "label", "target"], entryLabel);
    expect(errors, INTERFACE_KINDS.has(entry?.kind), `${entryLabel}.kind is invalid`);
    expect(errors, isNonEmptyString(entry?.label), `${entryLabel}.label must be a non-empty string`);
    expect(errors, isNonEmptyString(entry?.target), `${entryLabel}.target must be a non-empty string`);
    if (isPlainObject(entry)) kinds.push(entry.kind);
  }
  return kinds;
}

function validateProductionEvidence(errors, capability, knownEvidenceIds, label) {
  const evidence = capability.productionEvidence;
  expect(errors, isPlainObject(evidence), `${label} at production maturity requires productionEvidence`);
  if (!isPlainObject(evidence)) return;
  const fields = ["runtimeEvidenceIds", "operationalEvidenceIds", "securityReviewEvidenceIds", "releaseDecisionEvidenceIds"];
  requireFields(errors, evidence, fields, `${label}.productionEvidence`);
  for (const field of fields) {
    validateStringArray(errors, evidence[field], `${label}.productionEvidence.${field}`, { allowEmpty: false });
    for (const evidenceId of evidence[field] ?? []) {
      expect(errors, knownEvidenceIds.has(evidenceId), `${label}.productionEvidence.${field} references unknown evidence ${evidenceId}`);
    }
  }
}

export function validateCapabilityRegister() {
  const errors = [];
  const schema = readJson("schemas/capability-register.v1.schema.json");
  const data = readJson("data/capability-register.json");
  const evidenceTaxonomy = readJson("data/evidence-taxonomy.json");
  const productOntology = readJson("data/product-ontology.json");
  const claimRegister = readJson("data/claim-register.json");
  const knownEvidenceIds = new Set((evidenceTaxonomy.evidenceRecords ?? []).map((record) => record.id));
  const knownClaimIds = new Set((claimRegister.claims ?? []).map((claim) => claim.id));

  checkSchemaMetadata(
    errors,
    schema,
    "https://fenrua.ai/schemas/capability-register.v1.schema.json",
    "fenrua.capability-register.v1",
    ["schemaVersion", "lastReviewed", "sourceReferences", "capabilities"]
  );
  requireFields(errors, data, ["schemaVersion", "lastReviewed", "sourceReferences", "capabilities"], "capability register");
  expect(errors, data.schemaVersion === "fenrua.capability-register.v1", "capability register has an unexpected schemaVersion");
  expect(errors, isDate(data.lastReviewed), "capability register lastReviewed must be an ISO date");
  checkSourceReferences(errors, data, documentRecordIds(), "capability register");
  expect(errors, Array.isArray(data.capabilities), "capability register capabilities must be an array");
  if (!Array.isArray(data.capabilities)) return errors;

  const capabilityIds = data.capabilities.map((capability) => capability?.id);
  for (const duplicate of duplicates(capabilityIds)) errors.push(`capability register has duplicate id ${duplicate}`);
  const dependencyIds = new Set([...(productOntology.entities ?? []).map((entity) => entity.id), ...capabilityIds]);

  for (const capability of data.capabilities) {
    const label = `capability ${capability?.id ?? "<unknown>"}`;
    requireFields(errors, capability, CAPABILITY_FIELDS, label);
    expect(errors, /^capability\.[a-z0-9-]+$/.test(capability?.id ?? ""), `${label} has an invalid id`);
    expect(errors, isNonEmptyString(capability?.name), `${label}.name must be a non-empty string`);
    expect(errors, isNonEmptyString(capability?.category), `${label}.category must be a non-empty string`);
    expect(errors, LIFECYCLES.has(capability?.lifecycle), `${label}.lifecycle is invalid`);
    expect(errors, MATURITIES.has(capability?.maturity), `${label}.maturity is invalid`);
    expect(errors, AVAILABILITIES.has(capability?.availability), `${label}.availability is invalid`);
    expect(errors, isNonEmptyString(capability?.summary), `${label}.summary must be a non-empty string`);
    expect(errors, isNonEmptyString(capability?.owner), `${label}.owner must be a non-empty string`);
    expect(errors, isDate(capability?.lastReviewed), `${label}.lastReviewed must be an ISO date`);
    expect(errors, isNonEmptyString(capability?.promotionGate), `${label}.promotionGate must be a non-empty string`);

    const interfaceKinds = validateInterfaces(errors, capability?.interfaces, label);
    validateStringArray(errors, capability?.claimIds, `${label}.claimIds`);
    validateStringArray(errors, capability?.evidenceIds, `${label}.evidenceIds`);
    validateStringArray(errors, capability?.limitations, `${label}.limitations`, { allowEmpty: false });
    validateStringArray(errors, capability?.nonClaims, `${label}.nonClaims`, { allowEmpty: false });
    validateStringArray(errors, capability?.dependencies, `${label}.dependencies`);
    for (const claimId of capability?.claimIds ?? []) expect(errors, knownClaimIds.has(claimId), `${label} references unknown claim ${claimId}`);
    for (const evidenceId of capability?.evidenceIds ?? []) expect(errors, knownEvidenceIds.has(evidenceId), `${label} references unknown evidence ${evidenceId}`);
    for (const dependencyId of capability?.dependencies ?? []) expect(errors, dependencyIds.has(dependencyId), `${label} references unknown dependency ${dependencyId}`);

    const hasUsableInterface = interfaceKinds.some((kind) => USABLE_INTERFACE_KINDS.has(kind));
    if (["local", "limited-preview", "generally-available"].includes(capability?.availability)) {
      expect(errors, hasUsableInterface, `${label} cannot use ${capability.availability} without a usable interface`);
    }
    if (capability?.maturity === "beta") {
      expect(errors, hasUsableInterface, `${label} cannot be beta without a usable interface`);
      expect(errors, capability?.evidenceIds?.length > 0, `${label} cannot be beta without evidence`);
    }
    if (capability?.maturity === "production") validateProductionEvidence(errors, capability, knownEvidenceIds, label);
    if (capability?.lifecycle === "planned") {
      expect(errors, capability?.availability === "not-available", `${label} must be not-available while planned`);
      expect(errors, capability?.claimIds?.length === 0 || capability?.claimIds?.every((id) => knownClaimIds.has(id)), `${label} has an invalid planned claim reference`);
    } else {
      expect(errors, capability?.claimIds?.length > 0, `${label} must have at least one claim record`);
      expect(errors, capability?.evidenceIds?.length > 0, `${label} must have at least one evidence record`);
    }
  }

  return errors;
}

if (isMain(import.meta.url)) finish(validateCapabilityRegister(), "check-capability-register");
