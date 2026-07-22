import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  assertChainProgressPayload,
  assertGenericPublicError,
  assertObservationKeyMetadata,
} from "./public-disclosure-contracts.mjs";
import {
  assertNoProtectedCanaryOccurrences,
  assertProtectedCanaryCorpusIntegrity,
  findProtectedCanaryOccurrences,
  protectedCanaryCorpus,
  protectedCanaryOutputPaths,
} from "./protected-canary-corpus.mjs";
import { publicArtifactFiles, root } from "./public-output-lib.mjs";

const chainProgress = {
  version: 1,
  generatedAt: "2026-07-23T00:00:00Z",
  refreshMs: 20_000,
  freshnessSeconds: 90,
  observations: [{
    version: 1,
    chain: "978",
    observed_block: 1,
    observed_at: "2026-07-23T00:00:00Z",
    sequence: 1,
    source_quorum: 2,
    status: "confirmed",
    staleness_seconds: 0,
    signature: "test-signature",
    key_id: "public-key-id",
  }],
  chains: [{
    id: "public-chain",
    title: "Public observation",
    label: "Public",
    role: "Bounded public observation",
    expectedChainId: 978,
    chainId: 978,
    blockNumber: 1,
    blockAgeSeconds: 0,
    observationSequence: 1,
    status: "live",
    confirmation: {
      evidenceSource: "signed-observation",
      confidence: "confirmed",
    },
    checkedAt: "2026-07-23T00:00:00Z",
  }],
};

const observationKeyMetadata = {
  version: 1,
  key_id: "public-key-id",
  algorithm: "Ed25519",
  public_key_b64: "public-verification-material",
  canonicalization: "reviewed public canonicalization",
};

const publicError = { error: "Observation key unavailable" };

function withCanary(payload, canary) {
  return { ...payload, [canary.field]: canary.marker };
}

const contractOutputPaths = [
  {
    id: "chain-progress-api",
    assertRejected: (canary) => assertChainProgressPayload(withCanary(chainProgress, canary)),
  },
  {
    id: "observation-key-api",
    assertRejected: (canary) => assertObservationKeyMetadata(withCanary(observationKeyMetadata, canary)),
  },
  {
    id: "n521-observation-key-api",
    assertRejected: (canary) => assertObservationKeyMetadata(withCanary(observationKeyMetadata, canary)),
  },
  {
    id: "stable-public-error",
    assertRejected: (canary) => assertGenericPublicError(withCanary(publicError, canary)),
  },
];

const staticOutputCandidates = [
  ["static-html-metadata", "index.html"],
  ["static-documents", "docs/canary-coverage.md"],
  ["public-json-records", "data/public-record.json"],
  ["well-known-records", ".well-known/public-record.json"],
  ["static-assets", "assets/public-metadata.js"],
];

const expectedOutputPathIds = new Set([
  ...contractOutputPaths.map(({ id }) => id),
  ...staticOutputCandidates.map(([id]) => id),
]);

const corpusSummary = assertProtectedCanaryCorpusIntegrity();
assert.deepEqual(
  new Set(protectedCanaryOutputPaths.map(({ id }) => id)),
  expectedOutputPathIds,
  "The canary corpus must cover every declared public output path."
);

let contractRejections = 0;
for (const outputPath of contractOutputPaths) {
  for (const canary of protectedCanaryCorpus) {
    assert.throws(
      () => outputPath.assertRejected(canary),
      /Public disclosure contract violation/,
      `${outputPath.id} must reject ${canary.id}`
    );
    contractRejections += 1;
  }
}

const temporaryOutput = mkdtempSync(join(tmpdir(), "fenrua-protected-canary-"));
try {
  const allMarkers = protectedCanaryCorpus.map(({ marker }) => marker).join("\n");
  const candidateFiles = staticOutputCandidates.map(([, relativePath]) => join(temporaryOutput, relativePath));
  for (const candidate of candidateFiles) {
    mkdirSync(dirname(candidate), { recursive: true });
    writeFileSync(candidate, allMarkers, { encoding: "utf8", mode: 0o600 });
  }

  const detected = findProtectedCanaryOccurrences(candidateFiles, temporaryOutput);
  assert.equal(
    detected.length,
    protectedCanaryCorpus.length * staticOutputCandidates.length,
    "Every synthetic static-output canary must be detected."
  );
  assert.throws(
    () => assertNoProtectedCanaryOccurrences(candidateFiles, temporaryOutput),
    /Protected canary marker reached a public-output candidate/
  );
} finally {
  rmSync(temporaryOutput, { recursive: true, force: true });
}

const publicArtifactInputs = publicArtifactFiles().map((relativePath) => resolve(root, relativePath));
assert.deepEqual(
  findProtectedCanaryOccurrences(publicArtifactInputs, root),
  [],
  "Release-bound public artifact inputs must not contain a protected canary marker."
);

console.log(JSON.stringify({
  status: "ok",
  scope: "protected-canary-corpus",
  canaries: corpusSummary.canaries,
  outputPaths: corpusSummary.outputPaths,
  contractRejections,
  staticOutputMarkerRejections: protectedCanaryCorpus.length * staticOutputCandidates.length,
  publicArtifactInputs: publicArtifactInputs.length,
}));
