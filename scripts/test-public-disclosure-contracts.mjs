import assert from "node:assert/strict";
import {
  assertChainProgressPayload,
  assertGenericPublicError,
  assertObservationKeyMetadata,
} from "./public-disclosure-contracts.mjs";

const chainProgress = {
  version: 1,
  generatedAt: "2026-07-23T00:00:00Z",
  refreshMs: 20_000,
  freshnessSeconds: 90,
  observations: [
    {
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
      key_rotation: {
        version: 1,
        certificate_sha256: "a".repeat(64),
        from_key_id: "public-key-id-a",
        from_payload_sha256: "b".repeat(64),
        from_sequence: 1,
        to_key_id: "public-key-id-b",
      },
    },
  ],
  chains: [
    {
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
    },
  ],
};

assert.doesNotThrow(() => assertChainProgressPayload(chainProgress));
assert.doesNotThrow(() =>
  assertObservationKeyMetadata({
    version: 1,
    key_id: "public-key-id",
    algorithm: "Ed25519",
    public_key_b64: "public-verification-material",
    canonicalization: "reviewed public canonicalization",
  })
);
assert.doesNotThrow(() => assertGenericPublicError({ error: "Observation key unavailable" }));

assert.throws(
  () => assertChainProgressPayload({ ...chainProgress, endpoint: "https://example.test" }),
  /not allowlisted|protected field class/
);
assert.throws(
  () => assertObservationKeyMetadata({ version: 1, key_id: "public-key-id" }),
  /is required/
);
assert.throws(
  () => assertGenericPublicError({ error: "Unexpected internal failure" }),
  /approved generic message/
);
assert.throws(
  () => assertGenericPublicError({ error: "Method not allowed", detail: "not public" }),
  /not allowlisted/
);

console.log(JSON.stringify({ status: "ok", scope: "public-disclosure-contract-regressions", cases: 7 }));
