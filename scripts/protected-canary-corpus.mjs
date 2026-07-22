import { readFileSync } from "node:fs";
import { relative, sep } from "node:path";

const markerPrefix = "FENRUA_S0_6_SYNTHETIC_INVALID";

function createCanary(id, category, field) {
  return Object.freeze({
    id,
    category,
    field,
    marker: `${markerPrefix}_${id}_DO_NOT_USE`,
  });
}

// These are deliberately invalid test markers, not credentials, endpoints, or
// operational values. Their only purpose is to prove that public-output gates
// reject protected classes before release artifacts are created.
export const protectedCanaryCorpus = Object.freeze([
  createCanary("CREDENTIALS", "credentials", "credential"),
  createCanary("API_TOKENS", "API tokens", "api_token"),
  createCanary("PRIVATE_KEYS", "private keys", "private_key"),
  createCanary("SIGNING_KEYS", "signing keys", "signing_key"),
  createCanary("RECOVERY_KEYS", "recovery keys", "recovery_key"),
  createCanary("PRIVATE_ENDPOINTS", "private endpoints", "endpoint"),
  createCanary("PROVIDER_INTERNALS", "provider internals", "provider"),
  createCanary("PROVIDER_DASHBOARD", "provider dashboard details", "dashboard"),
  createCanary("CONTROL_PLANE_VALUES", "sensitive control-plane values", "control_plane_value"),
  createCanary("NODE_TOPOLOGY", "node topology", "topology"),
  createCanary("PEER_RELATIONSHIPS", "peer relationships", "peer"),
  createCanary("VALIDATOR_DETAILS", "validator details", "validator"),
  createCanary("PRIVATE_CHAIN_WIRING", "private-chain wiring", "private_route"),
  createCanary("PRIVATE_ROUTE_MAPS", "private route maps", "route_map"),
  createCanary("CHECKPOINT_VALUES", "checkpoint values", "checkpoint"),
  createCanary("ACTIVATION_PROFILES", "activation profiles", "activation"),
  createCanary("TREASURY_MAPPINGS", "treasury mappings", "treasury"),
  createCanary("SETTLEMENT_ROUTES", "settlement routes", "settlement"),
  createCanary("LEGAL_RECORDS", "legal or government sensitive records", "legal_record"),
  createCanary("DOCUMENT_3_VALUES", "Document 3 values", "document_3_value"),
  createCanary("PRIVATE_OPS_METADATA", "private-operations ciphertext metadata", "private_ops_metadata"),
  createCanary("VISUAL_BASELINES", "raw visual baselines", "visual_baseline"),
  createCanary("EXTERNAL_AUDIT_REPORTS", "external audit reports", "audit_report"),
  createCanary("PRIVATE_CAPTURES", "screenshots or captures containing private data", "private_capture"),
  createCanary("STACK_TRACES", "stack traces or raw exceptions", "stack_trace"),
  createCanary("PRIVATE_SOURCE_PATHS", "private operator source paths", "source_path"),
  createCanary("PRIVATE_MESH", "private mesh details", "private_mesh"),
]);

export const protectedCanaryOutputPaths = Object.freeze([
  Object.freeze({ id: "static-html-metadata", class: "static public HTML and metadata" }),
  Object.freeze({ id: "static-documents", class: "static public documents" }),
  Object.freeze({ id: "public-json-records", class: "public JSON records" }),
  Object.freeze({ id: "well-known-records", class: "well-known records" }),
  Object.freeze({ id: "static-assets", class: "public static assets" }),
  Object.freeze({ id: "chain-progress-api", class: "bounded chain-progress API" }),
  Object.freeze({ id: "observation-key-api", class: "public observation-key API" }),
  Object.freeze({ id: "n521-observation-key-api", class: "public N521 observation-key API" }),
  Object.freeze({ id: "stable-public-error", class: "stable public error payload" }),
]);

function displayPath(path, root) {
  return relative(root, path).split(sep).join("/");
}

function countMarkerOccurrences(bytes, marker) {
  const needle = Buffer.from(marker, "utf8");
  let count = 0;
  let offset = 0;
  while (offset < bytes.length) {
    const index = bytes.indexOf(needle, offset);
    if (index === -1) break;
    count += 1;
    offset = index + needle.length;
  }
  return count;
}

export function assertProtectedCanaryCorpusIntegrity() {
  const canaryIds = new Set();
  const markerValues = new Set();
  const fields = new Set();
  const outputPathIds = new Set();

  for (const canary of protectedCanaryCorpus) {
    if (!/^[A-Z0-9_]+$/.test(canary.id)) throw new Error("Protected canary ID is invalid.");
    if (!/^[a-z][a-z0-9_]*$/.test(canary.field)) throw new Error(`Protected canary field is invalid: ${canary.id}`);
    if (!canary.marker.startsWith(`${markerPrefix}_${canary.id}_`) || !canary.marker.endsWith("_DO_NOT_USE")) {
      throw new Error(`Protected canary marker is not safely marked: ${canary.id}`);
    }
    if (canaryIds.has(canary.id) || markerValues.has(canary.marker) || fields.has(canary.field)) {
      throw new Error(`Protected canary corpus contains a duplicate: ${canary.id}`);
    }
    canaryIds.add(canary.id);
    markerValues.add(canary.marker);
    fields.add(canary.field);
  }

  for (const outputPath of protectedCanaryOutputPaths) {
    if (!/^[a-z0-9-]+$/.test(outputPath.id) || !outputPath.class) {
      throw new Error("Protected canary output-path coverage is invalid.");
    }
    if (outputPathIds.has(outputPath.id)) throw new Error(`Duplicate protected canary output path: ${outputPath.id}`);
    outputPathIds.add(outputPath.id);
  }

  return Object.freeze({
    canaries: protectedCanaryCorpus.length,
    outputPaths: protectedCanaryOutputPaths.length,
  });
}

export function findProtectedCanaryOccurrences(files, root = process.cwd()) {
  const occurrences = [];
  for (const file of files) {
    const bytes = readFileSync(file);
    for (const canary of protectedCanaryCorpus) {
      const count = countMarkerOccurrences(bytes, canary.marker);
      if (!count) continue;
      occurrences.push(Object.freeze({
        canaryId: canary.id,
        category: canary.category,
        path: displayPath(file, root),
        count,
      }));
    }
  }
  return occurrences;
}

export function assertNoProtectedCanaryOccurrences(files, root = process.cwd()) {
  const occurrences = findProtectedCanaryOccurrences(files, root);
  if (!occurrences.length) return;
  const summary = occurrences
    .map(({ path, canaryId }) => `${path} (${canaryId})`)
    .join(", ");
  throw new Error(`Protected canary marker reached a public-output candidate: ${summary}`);
}
