import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  checkpointTransitionLua,
  enforceObservationContinuity,
  evaluateCheckpointTransition,
  observationContinuityInternals,
  verifyRotationCertificate,
} from "../server/observation-continuity.js";

const target = {
  chain: "978",
  env: {
    publicKey: "FENRUA_OBSERVATION_PUBLIC_KEY_B64",
    rotationCertificate: "FENRUA_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64",
  },
};
const oldKey = generateKeyPairSync("ed25519");
const newKey = generateKeyPairSync("ed25519");
const thirdKey = generateKeyPairSync("ed25519");

function publicKey(keyPair) {
  return keyPair.publicKey.export({ type: "spki", format: "der" }).toString("base64url");
}

const publicKeys = {
  old: observationContinuityInternals.normalizeEd25519PublicKey(publicKey(oldKey)),
  new: observationContinuityInternals.normalizeEd25519PublicKey(publicKey(newKey)),
  third: observationContinuityInternals.normalizeEd25519PublicKey(publicKey(thirdKey)),
};

function candidate(overrides = {}) {
  return {
    version: 1,
    chain: "978",
    key_id: "observation-v1",
    key_sha256: publicKeys.old.sha256,
    sequence: 10,
    observed_at_ms: 1_784_000_000_000,
    last_confirmed_block: 500,
    payload_sha256: "a".repeat(64),
    bootstrap_allowed: true,
    ...overrides,
  };
}

function observation(overrides = {}) {
  return {
    version: 1,
    chain: "978",
    key_id: "observation-v1",
    sequence: 10,
    observed_at: new Date().toISOString(),
    observed_block: 500,
    status: "confirmed",
    staleness_seconds: 0,
    signature: "a".repeat(86),
    ...overrides,
  };
}

function rotationCertificate({
  fromKey = oldKey,
  fromKeyId = "observation-v1",
  fromPayloadSha256 = "a".repeat(64),
  fromSequence = 10,
  issuedAt = new Date().toISOString(),
  toKey = newKey,
  toKeyId = "observation-v2",
  chain = "978",
} = {}) {
  const certificate = {
    chain,
    from_key_id: fromKeyId,
    from_payload_sha256: fromPayloadSha256,
    from_public_key_b64: publicKey(fromKey),
    from_sequence: fromSequence,
    issued_at: issuedAt,
    purpose: observationContinuityInternals.rotationPurpose,
    to_key_id: toKeyId,
    to_public_key_b64: publicKey(toKey),
    version: 1,
  };
  certificate.signature = sign(
    null,
    Buffer.from(observationContinuityInternals.canonicalRotationPayload(certificate), "utf8"),
    fromKey.privateKey
  ).toString("base64url");
  return Buffer.from(JSON.stringify(certificate), "utf8").toString("base64url");
}

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

function createAtomicStoreFetch() {
  const records = new Map();
  const calls = [];

  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    assert.equal(options.method, "POST");
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-store");
    assert.match(options.headers.authorization, /^Bearer /);
    const command = JSON.parse(options.body);
    assert.equal(command[0], "EVAL");
    assert.equal(command[1], checkpointTransitionLua);
    assert.equal(command[2], 1);
    const key = command[3];
    const nextCandidate = JSON.parse(command[4]);
    const rotation = command[5] ? JSON.parse(command[5]) : null;
    const result = evaluateCheckpointTransition(records.get(key) ?? null, nextCandidate, rotation);
    if (result.accepted) records.set(key, result.next);
    return jsonResponse({
      result: [result.accepted ? "accepted" : "rejected", result.reason],
    });
  };

  return { calls, fetchImpl, records };
}

function environment(overrides = {}) {
  return {
    FENRUA_OBSERVATION_CHECKPOINT_MODE: "required",
    FENRUA_OBSERVATION_CHECKPOINT_NAMESPACE: "fenrua-web:test:observation:v1",
    FENRUA_OBSERVATION_PUBLIC_KEY_B64: publicKey(oldKey),
    FENRUA_OBSERVATION_KEY_ID: "observation-v1",
    UPSTASH_REDIS_REST_URL: "https://observation-checkpoint.example.test",
    UPSTASH_REDIS_REST_TOKEN: "test-fixture-token-at-least-sixteen-bytes", // public-secret-fixture
    VERCEL_ENV: "preview",
    ...overrides,
  };
}

const initialized = evaluateCheckpointTransition(null, candidate());
assert.equal(initialized.accepted, true);
assert.equal(initialized.reason, "initialized");
const checkpoint = initialized.next;
assert.equal(Object.hasOwn(checkpoint, "bootstrap_allowed"), false);
assert.equal(
  evaluateCheckpointTransition(null, { ...candidate(), bootstrap_allowed: "yes" }).reason,
  "candidate-schema"
);

const idempotent = evaluateCheckpointTransition(checkpoint, candidate());
assert.equal(idempotent.accepted, true);
assert.equal(idempotent.reason, "idempotent");
assert.equal(idempotent.next, checkpoint);

assert.equal(
  evaluateCheckpointTransition(checkpoint, candidate({ sequence: 9 })).reason,
  "sequence-rollback"
);
assert.equal(
  evaluateCheckpointTransition(checkpoint, candidate({ payload_sha256: "b".repeat(64) })).reason,
  "equivocation"
);
assert.equal(
  evaluateCheckpointTransition(
    checkpoint,
    candidate({ sequence: 11, observed_at_ms: checkpoint.observed_at_ms - 1 })
  ).reason,
  "time-rollback"
);
assert.equal(
  evaluateCheckpointTransition(
    checkpoint,
    candidate({ sequence: 11, observed_at_ms: checkpoint.observed_at_ms + 1, last_confirmed_block: 499 })
  ).reason,
  "block-rollback"
);
assert.equal(
  evaluateCheckpointTransition(
    checkpoint,
    candidate({
      sequence: 11,
      key_id: "observation-v2",
      key_sha256: publicKeys.new.sha256,
      observed_at_ms: checkpoint.observed_at_ms + 1,
      payload_sha256: "c".repeat(64),
    })
  ).reason,
  "unannounced-key-change"
);
assert.equal(
  evaluateCheckpointTransition(
    checkpoint,
    candidate({ sequence: 11, key_sha256: publicKeys.new.sha256 })
  ).reason,
  "key-material-change"
);

const partialAdvance = evaluateCheckpointTransition(
  checkpoint,
  candidate({
    sequence: 11,
    observed_at_ms: checkpoint.observed_at_ms + 1,
    last_confirmed_block: null,
    payload_sha256: "d".repeat(64),
    bootstrap_allowed: false,
  })
);
assert.equal(partialAdvance.accepted, true);
assert.equal(partialAdvance.next.last_confirmed_block, 500);
assert.equal(
  evaluateCheckpointTransition(
    partialAdvance.next,
    candidate({
      sequence: 12,
      observed_at_ms: checkpoint.observed_at_ms + 2,
      last_confirmed_block: 499,
      payload_sha256: "e".repeat(64),
    })
  ).reason,
  "block-rollback"
);
assert.equal(
  evaluateCheckpointTransition(
    null,
    candidate({ bootstrap_allowed: false, last_confirmed_block: null })
  ).reason,
  "bootstrap-not-confirmed"
);

const encodedRotation = rotationCertificate();
const rotationVerification = verifyRotationCertificate({
  encodedCertificate: encodedRotation,
  target,
  observation: observation({ key_id: "observation-v2", sequence: 11 }),
  currentPublicKey: publicKeys.new,
});
assert.equal(rotationVerification.state, "valid");

const rotatedCandidate = candidate({
  key_id: "observation-v2",
  key_sha256: publicKeys.new.sha256,
  sequence: 11,
  observed_at_ms: checkpoint.observed_at_ms + 1,
  last_confirmed_block: 501,
  payload_sha256: "f".repeat(64),
});
const rotated = evaluateCheckpointTransition(
  checkpoint,
  rotatedCandidate,
  rotationVerification.rotation
);
assert.equal(rotated.accepted, true);
assert.equal(rotated.reason, "rotated");
assert.deepEqual(rotated.next.seen_key_sha256, [publicKeys.old.sha256, publicKeys.new.sha256]);

const reusedOldKey = evaluateCheckpointTransition(
  rotated.next,
  candidate({
    sequence: 12,
    observed_at_ms: rotated.next.observed_at_ms + 1,
    payload_sha256: "1".repeat(64),
  }),
  {
    certificate_sha256: "2".repeat(64),
    from_key_id: "observation-v2",
    from_key_sha256: publicKeys.new.sha256,
    from_payload_sha256: rotated.next.payload_sha256,
    from_sequence: rotated.next.sequence,
    to_key_id: "observation-v1",
    to_key_sha256: publicKeys.old.sha256,
  }
);
assert.equal(reusedOldKey.reason, "retired-key-reuse");

const badSignatureBytes = Buffer.from(encodedRotation, "base64url");
const badSignatureCertificate = JSON.parse(badSignatureBytes.toString("utf8"));
badSignatureCertificate.signature = "a".repeat(86);
assert.equal(
  verifyRotationCertificate({
    encodedCertificate: Buffer.from(JSON.stringify(badSignatureCertificate), "utf8").toString("base64url"),
    target,
    observation: observation({ key_id: "observation-v2" }),
    currentPublicKey: publicKeys.new,
  }).state,
  "invalid"
);
const nonCanonicalSignatureCertificate = JSON.parse(badSignatureBytes.toString("utf8"));
const nonCanonicalLastCharacter = { A: "B", Q: "R", g: "h", w: "x" }[
  nonCanonicalSignatureCertificate.signature.at(-1)
];
assert.ok(nonCanonicalLastCharacter);
nonCanonicalSignatureCertificate.signature =
  nonCanonicalSignatureCertificate.signature.slice(0, -1) + nonCanonicalLastCharacter;
assert.equal(
  verifyRotationCertificate({
    encodedCertificate: Buffer.from(
      JSON.stringify(nonCanonicalSignatureCertificate),
      "utf8"
    ).toString("base64url"),
    target,
    observation: observation({ key_id: "observation-v2" }),
    currentPublicKey: publicKeys.new,
  }).state,
  "invalid"
);
assert.equal(
  verifyRotationCertificate({
    encodedCertificate: rotationCertificate({ chain: "521" }),
    target,
    observation: observation({ key_id: "observation-v2" }),
    currentPublicKey: publicKeys.new,
  }).state,
  "invalid"
);
assert.equal(
  verifyRotationCertificate({
    encodedCertificate: rotationCertificate({ toKey: thirdKey }),
    target,
    observation: observation({ key_id: "observation-v2" }),
    currentPublicKey: publicKeys.new,
  }).state,
  "invalid"
);

const optionalMissing = await enforceObservationContinuity({
  target,
  observation: observation(),
  canonicalPayload: "{}",
  freshnessSeconds: 90,
  environment: {},
});
assert.deepEqual(optionalMissing, { accepted: true, reason: "optional-not-configured" });

const requiredMissing = await enforceObservationContinuity({
  target,
  observation: observation(),
  canonicalPayload: "{}",
  freshnessSeconds: 90,
  environment: { VERCEL_ENV: "production" },
});
assert.equal(requiredMissing.accepted, false);
assert.equal(requiredMissing.reason, "store-missing");

const unsignedUnavailable = await enforceObservationContinuity({
  target,
  observation: observation({
    observed_block: null,
    status: "unavailable",
    signature: null,
  }),
  canonicalPayload: '{"sequence":999}',
  freshnessSeconds: 90,
  environment: environment(),
  fetchImpl: async () => {
    throw new Error("Unsigned observations must never reach checkpoint storage.");
  },
});
assert.deepEqual(unsignedUnavailable, {
  accepted: false,
  reason: "signed-observation-required",
});

for (const badEnvironment of [
  environment({ FENRUA_OBSERVATION_CHECKPOINT_NAMESPACE: "" }),
  environment({ UPSTASH_REDIS_REST_TOKEN: "" }),
  environment({ UPSTASH_REDIS_REST_URL: "http://checkpoint.example.test" }),
  environment({ KV_REST_API_URL: "https://different.example.test" }),
  environment({ VERCEL_ENV: "production", FENRUA_OBSERVATION_CHECKPOINT_MODE: "optional" }),
]) {
  const result = await enforceObservationContinuity({
    target,
    observation: observation(),
    canonicalPayload: "{}",
    freshnessSeconds: 90,
    environment: badEnvironment,
  });
  assert.equal(result.accepted, false);
}

const store = createAtomicStoreFetch();
const firstAccepted = await enforceObservationContinuity({
  target,
  observation: observation(),
  canonicalPayload: '{"sequence":10}',
  freshnessSeconds: 90,
  environment: environment(),
  fetchImpl: store.fetchImpl,
});
assert.equal(firstAccepted.accepted, true);
assert.equal(firstAccepted.reason, "initialized");

const rollbackRejected = await enforceObservationContinuity({
  target,
  observation: observation({ sequence: 9, observed_block: 499 }),
  canonicalPayload: '{"sequence":9}',
  freshnessSeconds: 90,
  environment: environment(),
  fetchImpl: store.fetchImpl,
});
assert.equal(rollbackRejected.accepted, false);
assert.equal(rollbackRejected.reason, "sequence-rollback");

const sameSequenceConflict = await Promise.all([
  enforceObservationContinuity({
    target,
    observation: observation({ sequence: 11, observed_block: 501 }),
    canonicalPayload: '{"candidate":"a","sequence":11}',
    freshnessSeconds: 90,
    environment: environment(),
    fetchImpl: store.fetchImpl,
  }),
  enforceObservationContinuity({
    target,
    observation: observation({ sequence: 11, observed_block: 502 }),
    canonicalPayload: '{"candidate":"b","sequence":11}',
    freshnessSeconds: 90,
    environment: environment(),
    fetchImpl: store.fetchImpl,
  }),
]);
assert.equal(sameSequenceConflict.filter((result) => result.accepted).length, 1);
assert.equal(sameSequenceConflict.filter((result) => !result.accepted)[0].reason, "equivocation");

const rotationStore = createAtomicStoreFetch();
const oldEnvironment = environment();
assert.equal(
  (
    await enforceObservationContinuity({
      target,
      observation: observation(),
      canonicalPayload: '{"anchor":"old"}',
      freshnessSeconds: 90,
      environment: oldEnvironment,
      fetchImpl: rotationStore.fetchImpl,
    })
  ).accepted,
  true
);
const anchorRecord = [...rotationStore.records.values()][0];
const exactRotation = rotationCertificate({
  fromPayloadSha256: anchorRecord.payload_sha256,
  fromSequence: anchorRecord.sequence,
});
const newEnvironment = environment({
  FENRUA_OBSERVATION_PUBLIC_KEY_B64: publicKey(newKey),
  FENRUA_OBSERVATION_KEY_ID: "observation-v2",
  FENRUA_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64: exactRotation,
});
const exactRotationVerification = verifyRotationCertificate({
  encodedCertificate: exactRotation,
  target,
  observation: observation({ key_id: "observation-v2", sequence: 11 }),
  currentPublicKey: publicKeys.new,
});
assert.equal(exactRotationVerification.state, "valid");
const rotationAccepted = await enforceObservationContinuity({
  target,
  observation: observation({ key_id: "observation-v2", sequence: 11, observed_block: 501 }),
  canonicalPayload: '{"anchor":"new"}',
  freshnessSeconds: 90,
  environment: newEnvironment,
  fetchImpl: rotationStore.fetchImpl,
});
assert.equal(rotationAccepted.accepted, true);
assert.equal(rotationAccepted.reason, "rotated");
assert.deepEqual(rotationAccepted.keyRotation, {
  version: 1,
  certificate_sha256: exactRotationVerification.rotation.certificate_sha256,
  from_key_id: "observation-v1",
  from_payload_sha256: anchorRecord.payload_sha256,
  from_sequence: anchorRecord.sequence,
  to_key_id: "observation-v2",
});

const oldKeyAfterRotation = await enforceObservationContinuity({
  target,
  observation: observation({ sequence: 12, observed_block: 502 }),
  canonicalPayload: '{"anchor":"old-again"}',
  freshnessSeconds: 90,
  environment: oldEnvironment,
  fetchImpl: rotationStore.fetchImpl,
});
assert.equal(oldKeyAfterRotation.accepted, false);
assert.equal(oldKeyAfterRotation.reason, "unannounced-key-change");

const outage = await enforceObservationContinuity({
  target,
  observation: observation(),
  canonicalPayload: "{}",
  freshnessSeconds: 90,
  environment: environment(),
  fetchImpl: async () => {
    throw new Error("simulated outage");
  },
});
assert.deepEqual(outage, { accepted: false, reason: "store-unavailable" });

const malformed = await enforceObservationContinuity({
  target,
  observation: observation(),
  canonicalPayload: "{}",
  freshnessSeconds: 90,
  environment: environment(),
  fetchImpl: async () => jsonResponse({ result: "not-an-array" }),
});
assert.deepEqual(malformed, { accepted: false, reason: "store-response" });

const overSpecifiedResponse = await enforceObservationContinuity({
  target,
  observation: observation(),
  canonicalPayload: "{}",
  freshnessSeconds: 90,
  environment: environment(),
  fetchImpl: async () => jsonResponse({ result: ["accepted", "initialized", "unexpected"] }),
});
assert.deepEqual(overSpecifiedResponse, { accepted: false, reason: "store-response" });

console.log(
  JSON.stringify({
    status: "ok",
    scope: "durable-observation-continuity",
    cases: 25,
    atomicCompareAndSet: true,
    authenticatedRotation: true,
  })
);
