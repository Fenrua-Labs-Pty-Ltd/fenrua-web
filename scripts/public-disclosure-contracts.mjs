const protectedFieldNames = new Set([
  "access_token",
  "activation",
  "admin",
  "api_token",
  "authentication",
  "authorization",
  "checkpoint",
  "checkpoint_id",
  "connection_string",
  "credential",
  "credentials",
  "dashboard",
  "detail",
  "endpoint",
  "error_detail",
  "exception",
  "gateway_url",
  "host",
  "internal_path",
  "mnemonic",
  "node",
  "operator",
  "password",
  "peer",
  "private_ip",
  "private_key",
  "private_route",
  "provider",
  "provider_id",
  "raw_exception",
  "recovery_key",
  "route_map",
  "secret",
  "secret_access_key",
  "seed_phrase",
  "settlement",
  "signing_key",
  "source_path",
  "stack",
  "stack_trace",
  "token",
  "topology",
  "treasury",
  "url",
  "validator",
]);

export const publicDisclosureContracts = Object.freeze({
  chainProgress: Object.freeze({
    topLevelFields: Object.freeze([
      "version",
      "generatedAt",
      "refreshMs",
      "freshnessSeconds",
      "observations",
      "chains",
    ]),
    observationFields: Object.freeze([
      "version",
      "chain",
      "observed_block",
      "observed_at",
      "sequence",
      "source_quorum",
      "status",
      "staleness_seconds",
      "signature",
      "key_id",
      "key_rotation",
    ]),
    keyRotationFields: Object.freeze([
      "version",
      "certificate_sha256",
      "from_key_id",
      "from_payload_sha256",
      "from_sequence",
      "to_key_id",
    ]),
    chainFields: Object.freeze([
      "id",
      "title",
      "label",
      "role",
      "expectedChainId",
      "chainId",
      "blockNumber",
      "blockAgeSeconds",
      "observationSequence",
      "status",
      "confirmation",
      "checkedAt",
    ]),
    confirmationFields: Object.freeze(["evidenceSource", "confidence"]),
  }),
  observationKeyMetadata: Object.freeze({
    fields: Object.freeze([
      "version",
      "key_id",
      "algorithm",
      "public_key_b64",
      "canonicalization",
      "rotation_certificate_b64",
      "rotation_certificate_sha256",
    ]),
  }),
  publicError: Object.freeze({
    fields: Object.freeze(["error"]),
    messages: Object.freeze([
      "Method not allowed",
      "Invalid request URL",
      "Query parameters are not supported",
      "Request body is not supported",
      "Too many requests",
      "Observation key unavailable",
    ]),
  }),
});

export const chainGatewayAllowlist = Object.freeze([
  "version",
  "chain",
  "observed_block",
  "observed_at",
  "sequence",
  "source_quorum",
  "status",
  "staleness_seconds",
  "signature",
  "key_id",
]);

function fail(message) {
  throw new TypeError(`Public disclosure contract violation: ${message}`);
}

function normalizeFieldName(field) {
  return String(field)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function assertPlainObject(value, path) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${path} must be an object`);
  }
}

function assertExactFields(value, allowedFields, requiredFields, path) {
  assertPlainObject(value, path);
  const allowed = new Set(allowedFields);
  for (const field of Object.keys(value)) {
    if (!allowed.has(field)) fail(`${path}.${field} is not allowlisted`);
  }
  for (const field of requiredFields) {
    if (!Object.hasOwn(value, field)) fail(`${path}.${field} is required`);
  }
}

function assertNoProtectedFields(value, path = "response") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoProtectedFields(item, `${path}[${index}]`));
    return;
  }
  if (value === null || typeof value !== "object") return;

  for (const [field, child] of Object.entries(value)) {
    const normalized = normalizeFieldName(field);
    if (protectedFieldNames.has(normalized)) fail(`${path}.${field} is a protected field class`);
    assertNoProtectedFields(child, `${path}.${field}`);
  }
}

export function assertChainProgressPayload(payload) {
  const contract = publicDisclosureContracts.chainProgress;
  assertExactFields(payload, contract.topLevelFields, contract.topLevelFields, "chainProgress");
  if (!Array.isArray(payload.observations)) fail("chainProgress.observations must be an array");
  if (!Array.isArray(payload.chains)) fail("chainProgress.chains must be an array");

  for (const [index, observation] of payload.observations.entries()) {
    const path = `chainProgress.observations[${index}]`;
    const fields = observation?.key_rotation
      ? contract.observationFields
      : contract.observationFields.filter((field) => field !== "key_rotation");
    assertExactFields(observation, fields, fields, path);
    if (observation.key_rotation) {
      assertExactFields(
        observation.key_rotation,
        contract.keyRotationFields,
        contract.keyRotationFields,
        `${path}.key_rotation`
      );
    }
  }

  for (const [index, chain] of payload.chains.entries()) {
    const path = `chainProgress.chains[${index}]`;
    assertExactFields(chain, contract.chainFields, contract.chainFields, path);
    assertExactFields(
      chain.confirmation,
      contract.confirmationFields,
      contract.confirmationFields,
      `${path}.confirmation`
    );
  }
  assertNoProtectedFields(payload);
}

export function assertObservationKeyMetadata(payload) {
  const contract = publicDisclosureContracts.observationKeyMetadata;
  const hasRotationCertificate = Object.hasOwn(payload || {}, "rotation_certificate_b64");
  const hasRotationDigest = Object.hasOwn(payload || {}, "rotation_certificate_sha256");
  if (hasRotationCertificate !== hasRotationDigest) {
    fail("observationKeyMetadata rotation fields must be present together");
  }
  const fields = hasRotationCertificate
    ? contract.fields
    : contract.fields.filter((field) => !field.startsWith("rotation_certificate_"));
  assertExactFields(payload, fields, fields, "observationKeyMetadata");
  assertNoProtectedFields(payload);
}

export function assertGenericPublicError(payload) {
  const contract = publicDisclosureContracts.publicError;
  assertExactFields(payload, contract.fields, contract.fields, "publicError");
  if (typeof payload.error !== "string" || !contract.messages.includes(payload.error)) {
    fail("publicError.error is not an approved generic message");
  }
  assertNoProtectedFields(payload);
}
