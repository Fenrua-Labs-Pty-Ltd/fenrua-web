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
  readJson,
  requireFields,
} from "./check-product-ontology.mjs";

const CLAIM_FIELDS = [
  "id",
  "anchor",
  "statement",
  "subjectId",
  "assertionState",
  "assuranceVerb",
  "evidenceClass",
  "evidenceIds",
  "scope",
  "environment",
  "assessor",
  "independence",
  "validFrom",
  "expiresAt",
  "supersedes",
  "supersededBy",
  "limitations",
  "publicRoutes",
];

const ASSERTION_STATES = new Set(["current", "planned", "design", "research-question", "historical"]);
const INDEPENDENCE_STATES = new Set(["same-author", "internal-independent", "external"]);

function validateStringArray(errors, value, label, { allowEmpty = true } = {}) {
  expect(errors, Array.isArray(value), `${label} must be an array`);
  if (!Array.isArray(value)) return;
  if (!allowEmpty) expect(errors, value.length > 0, `${label} must not be empty`);
  for (const [index, item] of value.entries()) {
    expect(errors, isNonEmptyString(item), `${label}[${index}] must be a non-empty string`);
  }
  for (const duplicate of duplicates(value)) errors.push(`${label} contains duplicate ${duplicate}`);
}

export function validateClaimCapabilityConsistency() {
  const errors = [];
  const schema = readJson("schemas/claim-register.v1.schema.json");
  const claimRegister = readJson("data/claim-register.json");
  const capabilityRegister = readJson("data/capability-register.json");
  const evidenceTaxonomy = readJson("data/evidence-taxonomy.json");
  const assuranceLanguage = readJson("data/assurance-language.json");
  const reviewDate = claimRegister.lastReviewed;

  checkSchemaMetadata(
    errors,
    schema,
    "https://fenrua.ai/schemas/claim-register.v1.schema.json",
    "fenrua.claim-register.v1",
    ["schemaVersion", "lastReviewed", "sourceReferences", "claims"]
  );
  requireFields(errors, claimRegister, ["schemaVersion", "lastReviewed", "sourceReferences", "claims"], "claim register");
  expect(errors, claimRegister.schemaVersion === "fenrua.claim-register.v1", "claim register has an unexpected schemaVersion");
  expect(errors, isDate(reviewDate), "claim register lastReviewed must be an ISO date");
  checkSourceReferences(errors, claimRegister, documentRecordIds(), "claim register");
  expect(errors, Array.isArray(claimRegister.claims), "claim register claims must be an array");
  if (!Array.isArray(claimRegister.claims)) return errors;

  const capabilities = capabilityRegister.capabilities ?? [];
  const capabilityById = new Map(capabilities.map((capability) => [capability.id, capability]));
  const classById = new Map((evidenceTaxonomy.classes ?? []).map((entry) => [entry.id, entry]));
  const evidenceById = new Map((evidenceTaxonomy.evidenceRecords ?? []).map((entry) => [entry.id, entry]));
  const assuranceByTerm = new Map((assuranceLanguage.contracts ?? []).map((entry) => [entry.term, entry]));
  const claimIds = claimRegister.claims.map((claim) => claim?.id);
  const claimById = new Map(claimRegister.claims.map((claim) => [claim.id, claim]));
  const anchors = claimRegister.claims.map((claim) => claim?.anchor);
  for (const duplicate of duplicates(claimIds)) errors.push(`claim register has duplicate id ${duplicate}`);
  for (const duplicate of duplicates(anchors)) errors.push(`claim register has duplicate anchor ${duplicate}`);

  for (const claim of claimRegister.claims) {
    const label = `claim ${claim?.id ?? "<unknown>"}`;
    requireFields(errors, claim, CLAIM_FIELDS, label);
    expect(errors, /^claim\.[a-z0-9.-]+$/.test(claim?.id ?? ""), `${label} has an invalid id`);
    expect(errors, /^claim-[a-z0-9-]+$/.test(claim?.anchor ?? ""), `${label} has an invalid anchor`);
    expect(errors, isNonEmptyString(claim?.statement), `${label}.statement must be a non-empty string`);
    expect(errors, capabilityById.has(claim?.subjectId), `${label} references missing capability ${claim?.subjectId}`);
    expect(errors, ASSERTION_STATES.has(claim?.assertionState), `${label}.assertionState is invalid`);
    expect(errors, isNonEmptyString(claim?.assuranceVerb), `${label}.assuranceVerb must be a non-empty string`);
    expect(errors, classById.has(claim?.evidenceClass), `${label} references unknown evidence class ${claim?.evidenceClass}`);
    expect(errors, isNonEmptyString(claim?.scope), `${label}.scope must be a non-empty string`);
    expect(errors, isNonEmptyString(claim?.environment), `${label}.environment must be a non-empty string`);
    expect(errors, isNonEmptyString(claim?.assessor), `${label}.assessor must be a non-empty string`);
    expect(errors, INDEPENDENCE_STATES.has(claim?.independence), `${label}.independence is invalid`);
    expect(errors, isDate(claim?.validFrom), `${label}.validFrom must be an ISO date`);
    expect(errors, claim?.expiresAt === null || isDate(claim?.expiresAt), `${label}.expiresAt must be null or an ISO date`);
    validateStringArray(errors, claim?.evidenceIds, `${label}.evidenceIds`);
    validateStringArray(errors, claim?.supersedes, `${label}.supersedes`);
    validateStringArray(errors, claim?.limitations, `${label}.limitations`, { allowEmpty: false });
    validateStringArray(errors, claim?.publicRoutes, `${label}.publicRoutes`, { allowEmpty: false });
    for (const route of claim?.publicRoutes ?? []) expect(errors, route.startsWith("/"), `${label} route ${route} must start with /`);

    const assurance = assuranceByTerm.get(claim?.assuranceVerb);
    expect(errors, assurance !== undefined, `${label} uses assurance verb without a contract: ${claim?.assuranceVerb}`);
    expect(errors, assurance?.permittedEvidenceClasses?.includes(claim?.evidenceClass), `${label} uses ${claim?.assuranceVerb} beyond the ${claim?.evidenceClass} evidence contract`);
    const evidenceClass = classById.get(claim?.evidenceClass);
    expect(errors, evidenceClass?.permittedAssuranceVerbs?.includes(claim?.assuranceVerb), `${label} uses ${claim?.assuranceVerb} beyond evidence-taxonomy permission for ${claim?.evidenceClass}`);

    for (const evidenceId of claim?.evidenceIds ?? []) {
      const evidence = evidenceById.get(evidenceId);
      expect(errors, evidence !== undefined, `${label} references missing evidence ${evidenceId}`);
      expect(errors, evidence?.evidenceClassIds?.includes(claim?.evidenceClass), `${label} evidence ${evidenceId} does not support evidence class ${claim?.evidenceClass}`);
      if (claim?.assertionState === "current") expect(errors, evidence?.status === "current", `${label} cannot render current from ${evidenceId} status ${evidence?.status}`);
    }

    if (claim?.assertionState === "current") {
      expect(errors, claim?.evidenceIds?.length > 0, `${label} cannot render current without evidence`);
      expect(errors, claim?.expiresAt === null || claim.expiresAt >= reviewDate, `${label} is expired at review date ${reviewDate}`);
    }
    if ((claim?.evidenceIds ?? []).length === 0) {
      expect(errors, ["planned", "design", "research-question"].includes(claim?.assertionState), `${label} without evidence must be planned, design, or research-question`);
    }
    for (const supersededId of claim?.supersedes ?? []) {
      expect(errors, claimById.has(supersededId), `${label} supersedes unknown claim ${supersededId}`);
      expect(errors, claimById.get(supersededId)?.supersededBy === claim.id, `${label} must be the reciprocal supersededBy for ${supersededId}`);
    }
    if (claim?.supersededBy !== null) {
      expect(errors, claimById.has(claim.supersededBy), `${label} is superseded by unknown claim ${claim.supersededBy}`);
      expect(errors, claim?.assertionState !== "current", `${label} cannot remain current after supersession`);
    }
  }

  for (const capability of capabilities) {
    for (const claimId of capability.claimIds ?? []) {
      const claim = claimById.get(claimId);
      expect(errors, claim !== undefined, `capability ${capability.id} references missing claim ${claimId}`);
      expect(errors, claim?.subjectId === capability.id, `capability ${capability.id} claim ${claimId} has subject ${claim?.subjectId}`);
    }
  }
  for (const claim of claimRegister.claims) {
    const capability = capabilityById.get(claim.subjectId);
    expect(errors, capability?.claimIds?.includes(claim.id), `claim ${claim.id} is not listed by subject capability ${claim.subjectId}`);
  }

  return errors;
}

if (isMain(import.meta.url)) finish(validateClaimCapabilityConsistency(), "check-claim-capability-consistency");
