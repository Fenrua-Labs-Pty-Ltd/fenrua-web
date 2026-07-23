import assert from "node:assert/strict";
import { generateKeyPairSync, sign as signObservation } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  checkpointTransitionLua,
  evaluateCheckpointTransition,
} from "../server/observation-continuity.js";
import {
  assertChainProgressPayload,
  assertGenericPublicError,
  assertObservationKeyMetadata,
} from "./public-disclosure-contracts.mjs";

const originalFetch = globalThis.fetch;
const maxGatewayResponseBytesForTest = 2_048;
const environmentKeys = [
  "FENRUA_OBSERVATION_GATEWAY_URL",
  "FENRUA_OBSERVATION_READ_TOKEN",
  "FENRUA_OBSERVATION_PUBLIC_KEY_B64",
  "FENRUA_OBSERVATION_KEY_ID",
  "FENRUA_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64",
  "FENRUA_N521_OBSERVATION_GATEWAY_URL",
  "FENRUA_N521_OBSERVATION_READ_TOKEN",
  "FENRUA_N521_OBSERVATION_PUBLIC_KEY_B64",
  "FENRUA_N521_OBSERVATION_KEY_ID",
  "FENRUA_N521_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64",
  "FENRUA_OBSERVATION_CHECKPOINT_MODE",
  "FENRUA_OBSERVATION_CHECKPOINT_NAMESPACE",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "VERCEL_ENV",
];
const originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));

const handler = (await import("../api/chain-progress.js")).default;
const chain978KeyHandler = (await import("../api/chain-observation-key.js")).default;
const chain521KeyHandler = (await import("../api/chain-n521-observation-key.js")).default;
const chainPage = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const chainClient = readFileSync(new URL("../kernel-status.js", import.meta.url), "utf8");
const chainApi = readFileSync(new URL("../api/chain-progress.js", import.meta.url), "utf8");
const signers = {
  "978": generateKeyPairSync("ed25519"),
  "521": generateKeyPairSync("ed25519"),
};
const publicKeys = Object.fromEntries(
  Object.entries(signers).map(([chain, signer]) => [
    chain,
    signer.publicKey.export({ type: "spki", format: "der" }).toString("base64url"),
  ])
);
const replacement978Signer = generateKeyPairSync("ed25519");
const replacement978PublicKey = replacement978Signer.publicKey
  .export({ type: "spki", format: "der" })
  .toString("base64url");

function encodeRotationCertificate({
  fromPayloadSha256 = "a".repeat(64),
  fromSequence = 41,
} = {}) {
  const certificate = {
    chain: "978",
    from_key_id: "fenchain-978-observation-v1",
    from_payload_sha256: fromPayloadSha256,
    from_public_key_b64: publicKeys["978"],
    from_sequence: fromSequence,
    issued_at: new Date().toISOString(),
    purpose: "fenrua-observation-key-rotation",
    to_key_id: "fenchain-978-observation-v2",
    to_public_key_b64: replacement978PublicKey,
    version: 1,
  };
  certificate.signature = signObservation(
    null,
    Buffer.from(JSON.stringify(certificate), "utf8"),
    signers["978"].privateKey
  ).toString("base64url");
  return Buffer.from(JSON.stringify(certificate), "utf8").toString("base64url");
}

function responseRecorder() {
  const headers = new Map();
  return {
    headers,
    statusCode: null,
    body: null,
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function callHandler({ method = "GET", url = "/api/chain-progress", headers = {} } = {}) {
  const response = responseRecorder();
  await handler({ method, url, headers }, response);
  if (response.statusCode === 200) assertChainProgressPayload(response.body);
  else assertGenericPublicError(response.body);
  return response;
}

async function callKeyHandler(handlerToCall, route, { method = "GET", url = route, headers = {} } = {}) {
  const response = responseRecorder();
  await handlerToCall({ method, url, headers }, response);
  if (response.statusCode === 200) assertObservationKeyMetadata(response.body);
  else assertGenericPublicError(response.body);
  return response;
}

function gatewayResponse(payload, { ok = true, contentLength, omitContentLength = false, chunks } = {}) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  const length = contentLength ?? Buffer.byteLength(text, "utf8");
  const bodyChunks = (chunks ?? [Buffer.from(text, "utf8")]).map((chunk) => Buffer.from(chunk));
  const metrics = {
    canceled: 0,
    getReaderCalls: 0,
    reads: 0,
    released: 0,
    textCalls: 0,
  };
  const response = {
    ok,
    headers: {
      get(name) {
        if (name.toLowerCase() !== "content-length" || omitContentLength) return null;
        return String(length);
      },
    },
    body: {
      async cancel() {
        metrics.canceled += 1;
      },
      getReader() {
        metrics.getReaderCalls += 1;
        let chunkIndex = 0;
        let canceled = false;
        return {
          async read() {
            metrics.reads += 1;
            if (canceled || chunkIndex >= bodyChunks.length) return { done: true, value: undefined };
            const value = bodyChunks[chunkIndex];
            chunkIndex += 1;
            return { done: false, value };
          },
          async cancel() {
            metrics.canceled += 1;
            canceled = true;
          },
          releaseLock() {
            metrics.released += 1;
          },
        };
      },
    },
    async text() {
      metrics.textCalls += 1;
      return text;
    },
  };
  response.metrics = metrics;
  return response;
}

function observation(chain, overrides = {}) {
  const record = {
    version: 1,
    chain,
    observed_block: chain === "978" ? 184201 : 521001,
    observed_at: new Date().toISOString(),
    sequence: chain === "978" ? 41 : 7,
    source_quorum: 2,
    status: "confirmed",
    staleness_seconds: 0,
    key_id: chain === "978" ? "fenchain-978-observation-v1" : "fenchain-521-observation-v1",
    ...overrides,
  };

  if (!Object.hasOwn(overrides, "signature")) {
    record.signature = signObservation(
      null,
      Buffer.from(
        JSON.stringify({
          chain: record.chain,
          key_id: record.key_id,
          observed_at: record.observed_at,
          observed_block: record.observed_block,
          sequence: record.sequence,
          source_quorum: record.source_quorum,
          status: record.status,
          version: record.version,
        }),
        "utf8"
      ),
      signers[chain].privateKey
    ).toString("base64url");
  }

  return record;
}

function resignObservation(record, signer) {
  const signed = { ...record };
  signed.signature = signObservation(
    null,
    Buffer.from(
      JSON.stringify({
        chain: signed.chain,
        key_id: signed.key_id,
        observed_at: signed.observed_at,
        observed_block: signed.observed_block,
        sequence: signed.sequence,
        source_quorum: signed.source_quorum,
        status: signed.status,
        version: signed.version,
      }),
      "utf8"
    ),
    signer.privateKey
  ).toString("base64url");
  return signed;
}

function assertSanitized(snapshot) {
  const forbidden = [
    "endpoint",
    "host",
    "url",
    "rpc",
    "peer",
    "validator",
    "private_ip",
    "topology",
    "authentication",
    "admin",
    "jsonrpc",
    "operator",
    "customer",
    "block_hash",
  ];
  const publicKeys = new Set();
  const collectPublicKeys = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) collectPublicKeys(item);
      return;
    }
    if (value === null || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      publicKeys.add(key.toLowerCase());
      collectPublicKeys(child);
    }
  };
  collectPublicKeys(snapshot);
  for (const field of forbidden) {
    assert.ok(!publicKeys.has(field), `Public chain payload must not include the ${field} field.`);
  }

  const encoded = JSON.stringify(snapshot);
  for (const secret of [
    "observation-978.example.test",
    "observation-521.example.test",
    "test-fixture-978-read-token",
    "test-fixture-521-read-token",
  ]) {
    assert.ok(!encoded.includes(secret), `Public chain payload must not disclose ${secret}.`);
  }

  assert.equal(snapshot.chains.length, 2);
  assert.deepEqual(
    snapshot.chains.map((chain) => chain.expectedChainId),
    [978, 521]
  );
  for (const observationRecord of snapshot.observations) {
    const expectedFields = [
      "chain",
      "key_id",
      "observed_at",
      "observed_block",
      "sequence",
      "signature",
      "source_quorum",
      "staleness_seconds",
      "status",
      "version",
    ];
    if (observationRecord.key_rotation) expectedFields.push("key_rotation");
    assert.deepEqual(Object.keys(observationRecord).sort(), expectedFields.sort());
  }
}

function configureGateways({ n521 = true } = {}) {
  process.env.FENRUA_OBSERVATION_GATEWAY_URL = "https://observation-978.example.test/status";
  process.env.FENRUA_OBSERVATION_READ_TOKEN = "test-fixture-978-read-token"; // public-secret-fixture
  process.env.FENRUA_OBSERVATION_PUBLIC_KEY_B64 = publicKeys["978"];
  process.env.FENRUA_OBSERVATION_KEY_ID = "fenchain-978-observation-v1";

  if (n521) {
    process.env.FENRUA_N521_OBSERVATION_GATEWAY_URL = "https://observation-521.example.test/status";
    process.env.FENRUA_N521_OBSERVATION_READ_TOKEN = "test-fixture-521-read-token"; // public-secret-fixture
    process.env.FENRUA_N521_OBSERVATION_PUBLIC_KEY_B64 = publicKeys["521"];
    process.env.FENRUA_N521_OBSERVATION_KEY_ID = "fenchain-521-observation-v1";
  } else {
    for (const key of environmentKeys.filter((key) => key.startsWith("FENRUA_N521_"))) delete process.env[key];
  }
}

function removeGatewayConfiguration() {
  for (const key of environmentKeys) delete process.env[key];
}

function twoGatewayFetch(overrides = {}) {
  return async (endpoint, options) => {
    assert.equal(options.method, "GET");
    assert.equal(options.body, undefined);
    if (endpoint === "https://observation-978.example.test/status") {
      assert.equal(options.headers["x-fenrua-observation-read-token"], "test-fixture-978-read-token");
      assert.equal(options.headers["x-fenrua-n521-observation-read-token"], undefined);
      return gatewayResponse(observation("978", overrides["978"]));
    }
    if (endpoint === "https://observation-521.example.test/status") {
      assert.equal(options.headers["x-fenrua-n521-observation-read-token"], "test-fixture-521-read-token");
      assert.equal(options.headers["x-fenrua-observation-read-token"], undefined);
      return gatewayResponse(observation("521", overrides["521"]));
    }
    throw new Error("Unexpected gateway request");
  };
}

try {
  for (const key of [
    "FENRUA_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64",
    "FENRUA_N521_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64",
    "FENRUA_OBSERVATION_CHECKPOINT_MODE",
    "FENRUA_OBSERVATION_CHECKPOINT_NAMESPACE",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "KV_REST_API_URL",
    "KV_REST_API_TOKEN",
    "VERCEL_ENV",
  ]) {
    delete process.env[key];
  }

  assert.doesNotMatch(chainPage, /Blocks since check|data-chain-field="(?:978|521)-delta"/);
  assert.match(chainPage, /data-chain-field="978-activity"/);
  assert.match(chainPage, /data-chain-field="521-activity"/);
  assert.doesNotMatch(chainClient, /"0 blocks"|lastChainBlocks|lastChainCheckedAt|Private telemetry not published/);
  assert.match(
    chainClient,
    /function effectiveHeadAge\(chain\)[\s\S]{0,300}secondsSince\(chain\.checkedAt\)/,
    "Overview freshness must be derived from the signed observation time, not cache or response generation time."
  );
  assert.match(chainClient, /const chainRefreshMs = 60_000/);
  assert.match(chainClient, /highWater:\s*new Map\(\)/, "Overview cards must retain a browser-session high-water record per chain.");
  assert.doesNotMatch(chainClient, /sequences:\s*new Map\(\)/, "Overview cards must not track sequence alone.");
  for (const reason of [
    "verification-key change rejected",
    "signed sequence rollback rejected",
    "same-sequence equivocation rejected",
    "observation-time rollback rejected",
    "confirmed-block rollback rejected",
  ]) {
    assert.match(chainClient, new RegExp(reason), `Overview cards must expose the fail-closed reason: ${reason}.`);
  }
  assert.match(chainClient, /isAcceptedKeyRotation/, "Overview must evaluate server-validated key rotation bindings.");
  assert.match(
    chainClient,
    /rotation\.from_key_id === previous\.keyId[\s\S]{0,350}rotation\.from_sequence >= previous\.sequence/,
    "Overview rotation acceptance must bind the browser high-water key and a non-regressing bridge sequence."
  );
  assert.match(
    chainClient,
    /authenticated key rotation accepted/,
    "Overview must support a valid rotation without requiring a page reload."
  );
  for (const signedField of ["key_id", "sequence", "observed_at", "observed_block", "signature"]) {
    assert.match(chainClient, new RegExp(`observation\\.${signedField}`), `Overview high-water logic must bind ${signedField}.`);
  }
  assert.match(
    chainClient,
    /candidate\.sequence === previous\.sequence[\s\S]{0,500}candidate\.observedAt === previous\.observedAt/,
    "Overview same-sequence acceptance must require an identical signed observation time."
  );
  assert.match(
    chainClient,
    /candidate\.sequence === previous\.sequence[\s\S]{0,500}candidate\.confirmedBlock === previous\.confirmedBlock/,
    "Overview same-sequence acceptance must require an identical signed block payload."
  );
  assert.match(chainClient, /browser-session high-water preserved/, "A rejected Overview candidate must preserve the last accepted high-water record.");
  assert.match(chainClient, /no current observation/i, "A rejected Overview candidate must not be rendered as current.");
  assert.match(chainClient, /Last accepted[^\n]*not current/, "Overview may show the preserved high-water block only when explicitly marked non-current.");
  assert.doesNotMatch(chainClient, /signed sequence[^\n]*reset/i, "Overview sequence rollback must never be presented as a benign reset.");
  assert.match(chainApi, /const refreshMs = 60_000/);
  assert.match(chainApi, /upstream\.body\?\.getReader\?\.\(\)/);
  assert.match(chainApi, /totalBytes > maxGatewayResponseBytes/);
  assert.match(chainApi, /controller\.abort\(\)[\s\S]{0,200}reader\.cancel/);
  assert.doesNotMatch(chainApi, /upstream\.text\(/, "The gateway must never buffer an unbounded response with Response.text().");
  assert.doesNotMatch(chainApi, /FENCHAIN_(?:N521_)?RPC_URL|eth_getBlockByNumber|eth_chainId|jsonrpc/);

  configureGateways();
  let gatewayCalls = 0;
  globalThis.fetch = async (...args) => {
    gatewayCalls += 1;
    return twoGatewayFetch()(...args);
  };

  const healthy = await callHandler({ headers: { "x-forwarded-for": "198.51.100.1" } });
  assert.equal(healthy.statusCode, 200);
  assert.equal(healthy.headers.get("cache-control"), "public, max-age=0, must-revalidate");
  assert.equal(
    healthy.headers.get("cdn-cache-control"),
    "public, s-maxage=60, stale-while-revalidate=0, stale-if-error=0"
  );
  assert.equal(
    healthy.headers.get("vercel-cdn-cache-control"),
    "public, s-maxage=60, stale-while-revalidate=0, stale-if-error=0"
  );
  assert.equal(gatewayCalls, 2);
  assert.equal(healthy.body.refreshMs, 60_000);
  assert.equal(healthy.body.freshnessSeconds, 90);
  assert.equal(healthy.body.chains[0].status, "live");
  assert.equal(healthy.body.chains[0].observationSequence, 41);
  assert.equal(healthy.body.chains[0].checkedAt, healthy.body.observations.find((record) => record.chain === "978")?.observed_at);
  assert.equal(healthy.body.chains[1].status, "live");
  assert.equal(healthy.body.chains[1].blockNumber, 521001);
  assert.equal(healthy.body.chains[1].observationSequence, 7);
  assert.equal(healthy.body.chains[1].checkedAt, healthy.body.observations.find((record) => record.chain === "521")?.observed_at);
  assert.equal(healthy.body.observations.length, 2);
  assertSanitized(healthy.body);

  process.env.VERCEL_ENV = "production";
  globalThis.fetch = twoGatewayFetch();
  const missingProductionCheckpoint = await callHandler({
    headers: { "x-forwarded-for": "198.51.100.200" },
  });
  assert.equal(missingProductionCheckpoint.statusCode, 200);
  assert.ok(
    missingProductionCheckpoint.body.chains.every((chain) => chain.status === "unavailable"),
    "Production must fail closed when durable checkpoint storage is absent."
  );
  assert.deepEqual(missingProductionCheckpoint.body.observations, []);
  delete process.env.VERCEL_ENV;

  configureGateways();
  process.env.FENRUA_OBSERVATION_CHECKPOINT_MODE = "required";
  process.env.FENRUA_OBSERVATION_CHECKPOINT_NAMESPACE = "fenrua-web:test:api-rotation:v1";
  process.env.UPSTASH_REDIS_REST_URL = "https://observation-checkpoint.example.test";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-fixture-token-at-least-sixteen-bytes"; // public-secret-fixture
  const checkpointRecords = new Map();
  const gatewayRecords = {
    "978": observation("978"),
    "521": observation("521"),
  };
  globalThis.fetch = async (endpoint, options) => {
    if (endpoint === "https://observation-checkpoint.example.test") {
      const command = JSON.parse(options.body);
      assert.equal(command[0], "EVAL");
      assert.equal(command[1], checkpointTransitionLua);
      const key = command[3];
      const nextCandidate = JSON.parse(command[4]);
      const rotation = command[5] ? JSON.parse(command[5]) : null;
      const transition = evaluateCheckpointTransition(
        checkpointRecords.get(key) ?? null,
        nextCandidate,
        rotation
      );
      if (transition.accepted) checkpointRecords.set(key, transition.next);
      return new Response(
        JSON.stringify({
          result: [transition.accepted ? "accepted" : "rejected", transition.reason],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    if (endpoint === "https://observation-978.example.test/status") {
      return gatewayResponse(gatewayRecords["978"]);
    }
    if (endpoint === "https://observation-521.example.test/status") {
      return gatewayResponse(gatewayRecords["521"]);
    }
    throw new Error(`Unexpected endpoint: ${endpoint}`);
  };

  const initializedCheckpoint = await callHandler({
    headers: { "x-forwarded-for": "198.51.100.201" },
  });
  assert.ok(initializedCheckpoint.body.chains.every((chain) => chain.status === "live"));
  const chain978Checkpoint = checkpointRecords.get("fenrua-web:test:api-rotation:v1:978");
  assert.equal(chain978Checkpoint.sequence, 41);

  const apiRotationCertificate = encodeRotationCertificate({
    fromPayloadSha256: chain978Checkpoint.payload_sha256,
    fromSequence: chain978Checkpoint.sequence,
  });
  process.env.FENRUA_OBSERVATION_PUBLIC_KEY_B64 = replacement978PublicKey;
  process.env.FENRUA_OBSERVATION_KEY_ID = "fenchain-978-observation-v2";
  process.env.FENRUA_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64 = apiRotationCertificate;
  gatewayRecords["978"] = resignObservation(
    {
      ...gatewayRecords["978"],
      key_id: "fenchain-978-observation-v2",
      observed_at: new Date(Date.parse(gatewayRecords["978"].observed_at) + 1_000).toISOString(),
      observed_block: gatewayRecords["978"].observed_block + 1,
      sequence: gatewayRecords["978"].sequence + 1,
    },
    replacement978Signer
  );
  const rotatedCheckpoint = await callHandler({
    headers: { "x-forwarded-for": "198.51.100.202" },
  });
  assert.equal(rotatedCheckpoint.body.chains[0].status, "live");
  const rotatedPublicObservation = rotatedCheckpoint.body.observations.find(
    (record) => record.chain === "978"
  );
  assert.equal(rotatedPublicObservation.key_id, "fenchain-978-observation-v2");
  assert.deepEqual(rotatedPublicObservation.key_rotation, {
    version: 1,
    certificate_sha256: rotatedPublicObservation.key_rotation.certificate_sha256,
    from_key_id: "fenchain-978-observation-v1",
    from_payload_sha256: chain978Checkpoint.payload_sha256,
    from_sequence: 41,
    to_key_id: "fenchain-978-observation-v2",
  });
  assert.match(rotatedPublicObservation.key_rotation.certificate_sha256, /^[a-f0-9]{64}$/);
  assertSanitized(rotatedCheckpoint.body);

  for (const key of [
    "FENRUA_OBSERVATION_CHECKPOINT_MODE",
    "FENRUA_OBSERVATION_CHECKPOINT_NAMESPACE",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "FENRUA_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64",
  ]) {
    delete process.env[key];
  }
  configureGateways();

  const query = await callHandler({
    url: "/api/chain-progress?cache-bust=1",
    headers: { "x-forwarded-for": "198.51.100.2" },
  });
  assert.equal(query.statusCode, 400);

  const method = await callHandler({ method: "POST", headers: { "x-forwarded-for": "198.51.100.3" } });
  assert.equal(method.statusCode, 405);

  const body = await callHandler({ headers: { "content-length": "1", "x-forwarded-for": "198.51.100.4" } });
  assert.equal(body.statusCode, 413);

  configureGateways({ n521: false });
  globalThis.fetch = async (endpoint, options) => {
    assert.equal(endpoint, "https://observation-978.example.test/status");
    assert.equal(options.headers["x-fenrua-observation-read-token"], "test-fixture-978-read-token");
    assert.equal(options.headers["x-fenrua-n521-observation-read-token"], undefined);
    return gatewayResponse(observation("978"));
  };
  const awaitingN521 = await callHandler({ headers: { "x-forwarded-for": "198.51.100.5" } });
  assert.equal(awaitingN521.statusCode, 200);
  assert.equal(awaitingN521.body.observations.length, 1);
  assert.equal(awaitingN521.body.chains[1].status, "waiting");
  assert.equal(awaitingN521.body.chains[1].observationSequence, null);
  assert.equal(awaitingN521.body.chains[1].confirmation.evidenceSource, "awaiting-signed-observation");
  assertSanitized(awaitingN521.body);

  configureGateways();
  globalThis.fetch = twoGatewayFetch({ "521": { signature: "a".repeat(86) } });
  const invalidN521Signature = await callHandler({ headers: { "x-forwarded-for": "198.51.100.6" } });
  assert.equal(invalidN521Signature.statusCode, 200);
  assert.equal(invalidN521Signature.body.chains[0].status, "live");
  assert.equal(invalidN521Signature.body.chains[1].status, "unavailable");
  assert.equal(invalidN521Signature.body.observations.length, 1);
  assertSanitized(invalidN521Signature.body);

  globalThis.fetch = twoGatewayFetch({
    "978": {
      observed_at: new Date(Date.now() - 91_000).toISOString(),
      staleness_seconds: 91,
    },
  });
  const stale = await callHandler({ headers: { "x-forwarded-for": "198.51.100.7" } });
  assert.equal(stale.statusCode, 200);
  assert.equal(stale.body.chains[0].status, "delayed");
  assert.equal(stale.body.chains[1].status, "live");
  assertSanitized(stale.body);

  globalThis.fetch = twoGatewayFetch({
    "978": {
      status: "unavailable",
      observed_block: null,
      source_quorum: 0,
    },
  });
  const signedUnavailable = await callHandler({ headers: { "x-forwarded-for": "198.51.100.8" } });
  assert.equal(signedUnavailable.statusCode, 200);
  assert.equal(signedUnavailable.body.chains[0].status, "unavailable");
  assert.equal(signedUnavailable.body.chains[0].observationSequence, null);
  assert.equal(signedUnavailable.body.observations.some((record) => record.chain === "978"), false);
  assert.equal(signedUnavailable.body.observations.some((record) => record.chain === "521"), true);
  assertSanitized(signedUnavailable.body);

  globalThis.fetch = twoGatewayFetch({
    "978": {
      status: "unavailable",
      observed_block: null,
      source_quorum: 0,
      signature: null,
      sequence: 999,
    },
  });
  const unsignedUnavailable = await callHandler({ headers: { "x-forwarded-for": "198.51.100.81" } });
  assert.equal(unsignedUnavailable.statusCode, 200);
  assert.equal(unsignedUnavailable.body.chains[0].status, "unavailable");
  assert.equal(unsignedUnavailable.body.chains[0].observationSequence, null);
  assert.equal(unsignedUnavailable.body.observations.some((record) => record.chain === "978"), false);
  assertSanitized(unsignedUnavailable.body);

  globalThis.fetch = twoGatewayFetch({
    "978": {
      observed_block: null,
      source_quorum: 1,
      status: "partial",
    },
  });
  const partial = await callHandler({ headers: { "x-forwarded-for": "198.51.100.8" } });
  assert.equal(partial.statusCode, 200);
  assert.equal(partial.body.chains[0].status, "partial");
  assert.equal(partial.body.chains[0].blockNumber, null);
  assert.equal(partial.body.chains[0].observationSequence, 41);
  assertSanitized(partial.body);

  const nonSuccessResponses = [];
  globalThis.fetch = async () => {
    const response = gatewayResponse("x".repeat(4_096), {
      ok: false,
      omitContentLength: true,
      chunks: [Buffer.alloc(1_024, 0x78), Buffer.alloc(3_072, 0x78)],
    });
    nonSuccessResponses.push(response);
    return response;
  };
  const nonSuccess = await callHandler({ headers: { "x-forwarded-for": "198.51.100.12" } });
  assert.equal(nonSuccess.statusCode, 200);
  assert.ok(nonSuccess.body.chains.every((chain) => chain.status === "unavailable"));
  assert.deepEqual(nonSuccess.body.observations, []);
  assert.equal(nonSuccessResponses.length, 2);
  for (const response of nonSuccessResponses) {
    assert.equal(response.metrics.canceled, 1, "A non-success gateway body must be canceled immediately.");
    assert.equal(response.metrics.getReaderCalls, 0, "A non-success gateway body must not be read.");
    assert.equal(response.metrics.reads, 0);
    assert.equal(response.metrics.textCalls, 0);
  }
  assertSanitized(nonSuccess.body);

  const declaredOversizeResponses = [];
  globalThis.fetch = async () => {
    const response = gatewayResponse("x".repeat(2_049), { contentLength: 2_049 });
    declaredOversizeResponses.push(response);
    return response;
  };
  const declaredOversize = await callHandler({ headers: { "x-forwarded-for": "198.51.100.9" } });
  assert.equal(declaredOversize.statusCode, 200);
  assert.ok(declaredOversize.body.chains.every((chain) => chain.status === "unavailable"));
  assert.deepEqual(declaredOversize.body.observations, []);
  assert.equal(declaredOversizeResponses.length, 2);
  for (const response of declaredOversizeResponses) {
    assert.equal(response.metrics.getReaderCalls, 0, "A declared oversized response must be rejected before reading its body.");
    assert.equal(response.metrics.canceled, 1, "A declared oversized response body must be canceled.");
    assert.equal(response.metrics.reads, 0);
    assert.equal(response.metrics.textCalls, 0);
  }
  assertSanitized(declaredOversize.body);

  const chunkedOversizeResponses = [];
  globalThis.fetch = async () => {
    const response = gatewayResponse("unused", {
      omitContentLength: true,
      chunks: [Buffer.alloc(1_024, 0x78), Buffer.alloc(1_024, 0x78), Buffer.alloc(1, 0x78), Buffer.alloc(512, 0x78)],
    });
    chunkedOversizeResponses.push(response);
    return response;
  };
  const chunkedOversize = await callHandler({ headers: { "x-forwarded-for": "198.51.100.10" } });
  assert.equal(chunkedOversize.statusCode, 200);
  assert.ok(chunkedOversize.body.chains.every((chain) => chain.status === "unavailable"));
  assert.deepEqual(chunkedOversize.body.observations, []);
  assert.equal(chunkedOversizeResponses.length, 2);
  for (const response of chunkedOversizeResponses) {
    assert.equal(response.metrics.reads, 3, "The reader must stop at the first byte above the 2,048-byte cap.");
    assert.equal(response.metrics.canceled, 1, "An oversized chunked stream must be canceled.");
    assert.equal(response.metrics.textCalls, 0);
  }
  assertSanitized(chunkedOversize.body);

  const exactBoundaryResponses = [];
  globalThis.fetch = async (endpoint) => {
    const chain = endpoint === "https://observation-978.example.test/status" ? "978" : "521";
    const serialized = JSON.stringify(observation(chain));
    const paddingLength = maxGatewayResponseBytesForTest - Buffer.byteLength(serialized, "utf8");
    assert.ok(paddingLength >= 0);
    const encoded = Buffer.from(`${serialized}${" ".repeat(paddingLength)}`, "utf8");
    assert.equal(encoded.byteLength, maxGatewayResponseBytesForTest);
    const response = gatewayResponse("unused", {
      omitContentLength: true,
      chunks: [encoded.subarray(0, 1_024), encoded.subarray(1_024)],
    });
    exactBoundaryResponses.push(response);
    return response;
  };
  const exactBoundary = await callHandler({ headers: { "x-forwarded-for": "198.51.100.11" } });
  assert.equal(exactBoundary.statusCode, 200);
  assert.ok(exactBoundary.body.chains.every((chain) => chain.status === "live"));
  assert.equal(exactBoundary.body.observations.length, 2);
  for (const response of exactBoundaryResponses) {
    assert.equal(response.metrics.reads, 3, "The exact boundary must be read through the terminal stream record.");
    assert.equal(response.metrics.canceled, 0);
    assert.equal(response.metrics.textCalls, 0);
  }
  assertSanitized(exactBoundary.body);

  configureGateways();
  const metadata978 = await callKeyHandler(chain978KeyHandler, "/api/chain-observation-key", {
    headers: { "x-forwarded-for": "203.0.113.1" },
  });
  const metadata521 = await callKeyHandler(chain521KeyHandler, "/api/chain-n521-observation-key", {
    headers: { "x-forwarded-for": "203.0.113.2" },
  });
  for (const [metadata, expectedKeyId, expectedPublicKey] of [
    [metadata978, "fenchain-978-observation-v1", publicKeys["978"]],
    [metadata521, "fenchain-521-observation-v1", publicKeys["521"]],
  ]) {
    assert.equal(metadata.statusCode, 200);
    assert.equal(metadata.headers.get("cache-control"), "public, max-age=0, must-revalidate");
    assert.equal(
      metadata.headers.get("cdn-cache-control"),
      "public, s-maxage=0, stale-while-revalidate=0, stale-if-error=0"
    );
    assert.deepEqual(Object.keys(metadata.body).sort(), [
      "algorithm",
      "canonicalization",
      "key_id",
      "public_key_b64",
      "version",
    ]);
    assert.equal(metadata.body.algorithm, "Ed25519");
    assert.equal(metadata.body.key_id, expectedKeyId);
    assert.equal(metadata.body.public_key_b64, expectedPublicKey);
    assert.match(metadata.body.canonicalization, /RFC 8785 JCS UTF-8/);
  }

  const encodedRotationCertificate = encodeRotationCertificate();
  process.env.FENRUA_OBSERVATION_PUBLIC_KEY_B64 = replacement978PublicKey;
  process.env.FENRUA_OBSERVATION_KEY_ID = "fenchain-978-observation-v2";
  process.env.FENRUA_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64 = encodedRotationCertificate;
  const rotatingMetadata = await callKeyHandler(chain978KeyHandler, "/api/chain-observation-key", {
    headers: { "x-forwarded-for": "203.0.113.4" },
  });
  assert.equal(rotatingMetadata.statusCode, 200);
  assert.equal(rotatingMetadata.headers.get("cache-control"), "public, max-age=0, must-revalidate");
  assert.equal(rotatingMetadata.headers.get("cdn-cache-control"), "public, s-maxage=0, stale-while-revalidate=0, stale-if-error=0");
  assert.equal(rotatingMetadata.body.key_id, "fenchain-978-observation-v2");
  assert.equal(rotatingMetadata.body.public_key_b64, replacement978PublicKey);
  assert.equal(rotatingMetadata.body.rotation_certificate_b64, encodedRotationCertificate);
  assert.match(rotatingMetadata.body.rotation_certificate_sha256, /^[a-f0-9]{64}$/);
  delete process.env.FENRUA_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64;
  configureGateways();

  const n521KeyQuery = await callKeyHandler(chain521KeyHandler, "/api/chain-n521-observation-key", {
    url: "/api/chain-n521-observation-key?anything=1",
    headers: { "x-forwarded-for": "203.0.113.3" },
  });
  assert.equal(n521KeyQuery.statusCode, 400);

  removeGatewayConfiguration();
  for (let index = 0; index < 60; index += 1) {
    const accepted = await callHandler({ headers: { "x-forwarded-for": "203.0.113.99" } });
    assert.equal(accepted.statusCode, 200);
  }
  const limited = await callHandler({ headers: { "x-forwarded-for": "203.0.113.99" } });
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.headers.get("retry-after"), "60");

  console.log(
    JSON.stringify({
      status: "ok",
      scope: "dual-public-observation-gateway",
      cases: 20,
      rawRpcForwarding: false,
      fakeN521Telemetry: false,
    })
  );
} finally {
  globalThis.fetch = originalFetch;
  for (const key of environmentKeys) {
    if (originalEnvironment[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnvironment[key];
  }
}
