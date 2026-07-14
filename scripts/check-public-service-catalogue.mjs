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

const SERVICE_FIELDS = [
  "id",
  "name",
  "purpose",
  "availability",
  "interface",
  "dependencies",
  "dataClassification",
  "operationalOwner",
  "statusSource",
  "evidenceSource",
  "supportBoundary",
  "knownLimitation",
  "sloState",
  "incidentState",
  "retirementState",
];

const AVAILABILITY = new Set(["public", "agreement-specific"]);
const INTERFACE_TYPES = new Set(["website", "public-api", "business-enquiry", "agreement"]);
const DATA_CLASSIFICATIONS = new Set(["public", "agreement-specific", "mixed"]);
const SLO_STATES = new Set(["not-defined", "internal", "public"]);
const INCIDENT_STATES = new Set(["not-defined", "private", "public-status"]);
const RETIREMENT_STATES = new Set(["active", "planned-retirement", "retired"]);

function validateStringArray(errors, value, label, { allowEmpty = false } = {}) {
  expect(errors, Array.isArray(value), `${label} must be an array`);
  if (!Array.isArray(value)) return;
  if (!allowEmpty) expect(errors, value.length > 0, `${label} must not be empty`);
  for (const [index, item] of value.entries()) {
    expect(errors, isNonEmptyString(item), `${label}[${index}] must be a non-empty string`);
  }
  for (const duplicate of duplicates(value)) errors.push(`${label} contains duplicate ${duplicate}`);
}

function validateInterface(errors, value, label) {
  expect(errors, isPlainObject(value), `${label}.interface must be an object`);
  if (!isPlainObject(value)) return null;
  requireFields(errors, value, ["type", "targets"], `${label}.interface`);
  expect(errors, INTERFACE_TYPES.has(value.type), `${label}.interface.type is invalid`);
  validateStringArray(errors, value.targets, `${label}.interface.targets`);
  return value.type;
}

export function validatePublicServiceCatalogue() {
  const errors = [];
  const schema = readJson("schemas/public-service-catalogue.v1.schema.json");
  const data = readJson("data/public-service-catalogue.json");
  const taxonomy = readJson("data/evidence-taxonomy.json");
  const knownEvidence = new Map((taxonomy.evidenceRecords ?? []).map((record) => [record.id, record]));

  checkSchemaMetadata(
    errors,
    schema,
    "https://fenrua.ai/schemas/public-service-catalogue.v1.schema.json",
    "fenrua.public-service-catalogue.v1",
    ["schemaVersion", "lastReviewed", "sourceReferences", "services"]
  );
  requireFields(errors, data, ["schemaVersion", "lastReviewed", "sourceReferences", "services"], "public service catalogue");
  expect(errors, data.schemaVersion === "fenrua.public-service-catalogue.v1", "public service catalogue has an unexpected schemaVersion");
  expect(errors, isDate(data.lastReviewed), "public service catalogue lastReviewed must be an ISO date");
  checkSourceReferences(errors, data, documentRecordIds(), "public service catalogue");
  expect(errors, Array.isArray(data.services), "public service catalogue services must be an array");
  if (!Array.isArray(data.services)) return errors;

  const serviceIds = data.services.map((service) => service?.id);
  for (const duplicate of duplicates(serviceIds)) errors.push(`public service catalogue has duplicate id ${duplicate}`);

  for (const service of data.services) {
    const label = `service ${service?.id ?? "<unknown>"}`;
    requireFields(errors, service, SERVICE_FIELDS, label);
    expect(errors, /^service\.[a-z0-9-]+$/.test(service?.id ?? ""), `${label} has an invalid id`);
    for (const field of ["name", "purpose", "operationalOwner", "statusSource", "evidenceSource", "supportBoundary", "knownLimitation"]) {
      expect(errors, isNonEmptyString(service?.[field]), `${label}.${field} must be a non-empty string`);
    }
    expect(errors, AVAILABILITY.has(service?.availability), `${label}.availability is invalid`);
    expect(errors, DATA_CLASSIFICATIONS.has(service?.dataClassification), `${label}.dataClassification is invalid`);
    expect(errors, SLO_STATES.has(service?.sloState), `${label}.sloState is invalid`);
    expect(errors, INCIDENT_STATES.has(service?.incidentState), `${label}.incidentState is invalid`);
    expect(errors, RETIREMENT_STATES.has(service?.retirementState), `${label}.retirementState is invalid`);
    validateStringArray(errors, service?.dependencies, `${label}.dependencies`);
    const interfaceType = validateInterface(errors, service?.interface, label);

    const statusSource = knownEvidence.get(service?.statusSource);
    const evidenceSource = knownEvidence.get(service?.evidenceSource);
    expect(errors, statusSource !== undefined, `${label} references unknown status source ${service?.statusSource}`);
    expect(errors, evidenceSource !== undefined, `${label} references unknown evidence source ${service?.evidenceSource}`);
    expect(errors, statusSource?.status === "current", `${label} cannot present current service state from ${service?.statusSource}`);
    expect(errors, evidenceSource?.status === "current", `${label} cannot present current service evidence from ${service?.evidenceSource}`);

    if (service?.availability === "public") {
      expect(errors, ["website", "public-api"].includes(interfaceType), `${label} public availability requires a website or public-api interface`);
      expect(errors, ["public", "mixed"].includes(service?.dataClassification), `${label} public availability cannot have agreement-specific-only data classification`);
    }
    if (service?.availability === "agreement-specific") {
      expect(errors, ["business-enquiry", "agreement"].includes(interfaceType), `${label} agreement-specific availability requires a business-enquiry or agreement interface`);
      expect(errors, ["agreement-specific", "mixed"].includes(service?.dataClassification), `${label} agreement-specific availability needs agreement-specific or mixed data classification`);
    }
    if (service?.sloState === "public") expect(errors, service?.availability === "public", `${label} cannot expose a public SLO for a non-public service`);
    if (service?.retirementState === "retired") expect(errors, service?.availability !== "public", `${label} retired service cannot be listed as publicly available`);
  }

  return errors;
}

if (isMain(import.meta.url)) finish(validatePublicServiceCatalogue(), "check-public-service-catalogue");
