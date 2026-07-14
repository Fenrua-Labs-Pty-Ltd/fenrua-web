import {
  checkSchemaMetadata,
  checkSourceReferences,
  documentRecordIds,
  duplicates,
  expect,
  fileExists,
  finish,
  isDate,
  isMain,
  isNonEmptyString,
  readJson,
  requireFields,
} from "./check-product-ontology.mjs";

const REQUIRED_CLASS_IDS = [
  "specification",
  "test",
  "build",
  "release",
  "runtime",
  "operational",
  "observation",
  "incident",
  "independent-reproduction",
  "external-review",
  "regulatory-compliance",
];

const CLASS_FIELDS = [
  "id",
  "name",
  "purpose",
  "acceptedSources",
  "authority",
  "integrityMethod",
  "freshnessModel",
  "expiry",
  "retention",
  "revocation",
  "supersession",
  "disclosureBoundary",
  "verificationMethod",
  "doesNotProve",
  "permittedAssuranceVerbs",
];

function validateStringArray(errors, value, label, { minItems = 1 } = {}) {
  expect(errors, Array.isArray(value), `${label} must be an array`);
  if (!Array.isArray(value)) return;
  expect(errors, value.length >= minItems, `${label} must contain at least ${minItems} item(s)`);
  for (const [index, item] of value.entries()) {
    expect(errors, isNonEmptyString(item), `${label}[${index}] must be a non-empty string`);
  }
  for (const duplicate of duplicates(value)) errors.push(`${label} contains duplicate ${duplicate}`);
}

export function validateEvidenceTaxonomy() {
  const errors = [];
  const schema = readJson("schemas/evidence-taxonomy.v1.schema.json");
  const data = readJson("data/evidence-taxonomy.json");
  const documentIds = documentRecordIds();

  checkSchemaMetadata(
    errors,
    schema,
    "https://fenrua.ai/schemas/evidence-taxonomy.v1.schema.json",
    "fenrua.evidence-taxonomy.v1",
    ["schemaVersion", "lastReviewed", "sourceReferences", "classes", "evidenceRecords"]
  );
  requireFields(errors, data, ["schemaVersion", "lastReviewed", "sourceReferences", "classes", "evidenceRecords"], "evidence taxonomy");
  expect(errors, data.schemaVersion === "fenrua.evidence-taxonomy.v1", "evidence taxonomy has an unexpected schemaVersion");
  expect(errors, isDate(data.lastReviewed), "evidence taxonomy lastReviewed must be an ISO date");
  checkSourceReferences(errors, data, documentIds, "evidence taxonomy");
  expect(errors, Array.isArray(data.classes), "evidence taxonomy classes must be an array");
  expect(errors, Array.isArray(data.evidenceRecords), "evidence taxonomy evidenceRecords must be an array");
  if (!Array.isArray(data.classes) || !Array.isArray(data.evidenceRecords)) return errors;

  const classIds = data.classes.map((entry) => entry?.id);
  for (const duplicate of duplicates(classIds)) errors.push(`evidence taxonomy has duplicate class ${duplicate}`);
  for (const id of REQUIRED_CLASS_IDS) expect(errors, classIds.includes(id), `evidence taxonomy is missing required class ${id}`);
  for (const entry of data.classes) {
    const label = `evidence class ${entry?.id ?? "<unknown>"}`;
    requireFields(errors, entry, CLASS_FIELDS, label);
    expect(errors, /^[a-z][a-z-]+$/.test(entry?.id ?? ""), `${label} has an invalid id`);
    for (const field of ["name", "purpose", "authority", "integrityMethod", "freshnessModel", "expiry", "retention", "revocation", "supersession", "disclosureBoundary", "verificationMethod"]) {
      expect(errors, isNonEmptyString(entry?.[field]), `${label}.${field} must be a non-empty string`);
    }
    validateStringArray(errors, entry?.acceptedSources, `${label}.acceptedSources`);
    validateStringArray(errors, entry?.doesNotProve, `${label}.doesNotProve`);
    validateStringArray(errors, entry?.permittedAssuranceVerbs, `${label}.permittedAssuranceVerbs`);
  }

  const classIdSet = new Set(classIds);
  const evidenceIds = data.evidenceRecords.map((entry) => entry?.id);
  for (const duplicate of duplicates(evidenceIds)) errors.push(`evidence taxonomy has duplicate evidence record ${duplicate}`);
  const allowedStatuses = new Set(["current", "historical", "superseded", "archived"]);
  for (const record of data.evidenceRecords) {
    const label = `evidence record ${record?.id ?? "<unknown>"}`;
    requireFields(errors, record, ["id", "evidenceClassIds", "sourcePath", "documentRegisterId", "status", "scope"], label);
    expect(errors, /^[a-z][a-z0-9-]+$/.test(record?.id ?? ""), `${label} has an invalid id`);
    validateStringArray(errors, record?.evidenceClassIds, `${label}.evidenceClassIds`);
    for (const classId of record?.evidenceClassIds ?? []) {
      expect(errors, classIdSet.has(classId), `${label} references unknown evidence class ${classId}`);
    }
    expect(errors, isNonEmptyString(record?.sourcePath) && !record.sourcePath.startsWith("/"), `${label}.sourcePath must be a repository-relative path`);
    if (isNonEmptyString(record?.sourcePath)) expect(errors, fileExists(record.sourcePath), `${label}.sourcePath does not exist: ${record.sourcePath}`);
    expect(errors, record?.documentRegisterId === null || documentIds.has(record?.documentRegisterId), `${label} references unknown document-register id ${record?.documentRegisterId}`);
    expect(errors, allowedStatuses.has(record?.status), `${label} has an invalid status`);
    expect(errors, isNonEmptyString(record?.scope), `${label}.scope must be a non-empty string`);
  }

  return errors;
}

if (isMain(import.meta.url)) finish(validateEvidenceTaxonomy(), "check-evidence-taxonomy");
