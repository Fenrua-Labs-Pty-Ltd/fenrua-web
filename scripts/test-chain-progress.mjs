import assert from "node:assert/strict";
import { generateKeyPairSync, sign as signObservation } from "node:crypto";
import { readFileSync } from "node:fs";

const originalFetch = globalThis.fetch;
const environmentKeys = [
  "FENRUA_OBSERVATION_GATEWAY_URL",
  "FENRUA_OBSERVATION_READ_TOKEN",
  "FENRUA_OBSERVATION_PUBLIC_KEY_B64",
  "FENRUA_OBSERVATION_KEY_ID",
];
const originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));

const handler = (await import("../api/chain-progress.js")).default;
const observationKeyHandler = (await import("../api/chain-observation-key.js")).default;
const chainPage = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const chainClient = readFileSync(new URL("../kernel-status.js", import.meta.url), "utf8");
const chainApi = readFileSync(new URL("../api/chain-progress.js", import.meta.url), "utf8");
const signingKeyPair = generateKeyPairSync("ed25519");
const signingPublicKeyB64 = signingKeyPair.publicKey
  .export({ type: "spki", format: "der" })
  .toString("base64url");

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
  return response;
}

async function callKeyHandler({ method = "GET", url = "/api/chain-observation-key", headers = {} } = {}) {
  const response = responseRecorder();
  await observationKeyHandler({ method, url, headers }, response);
  return response;
}

function gatewayResponse(payload, { ok = true, contentLength } = {}) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  const length = contentLength ?? Buffer.byteLength(text, "utf8");
  return {
    ok,
    headers: {
      get(name) {
        return name.toLowerCase() === "content-length" ? String(length) : null;
      },
    },
    async text() {
      return text;
    },
  };
}

function observation(overrides = {}) {
  const record = {
    version: 1,
    chain: "978",
    observed_block: 184201,
    observed_at: new Date().toISOString(),
    sequence: 1842,
    source_quorum: 2,
    status: "confirmed",
    staleness_seconds: 0,
    key_id: "fenchain-978-observation-v1",
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
      signingKeyPair.privateKey
    ).toString("base64url");
  }

  return record;
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
  const encoded = JSON.stringify(snapshot).toLowerCase();
  for (const field of forbidden) {
    assert.ok(!encoded.includes(field), `Public chain payload must not include ${field}.`);
  }

  assert.equal(snapshot.chains.length, 2);
  assert.equal(snapshot.chains[1].expectedChainId, 521);
  assert.equal(snapshot.chains[1].status, "unavailable");
  assert.equal(snapshot.chains[1].role, "Private telemetry not published");
  assert.equal(snapshot.chains[1].confirmation.evidenceSource, "private-telemetry");
}

function setGatewayEnvironment() {
  process.env.FENRUA_OBSERVATION_GATEWAY_URL = "https://observation.example.test/status";
  process.env.FENRUA_OBSERVATION_READ_TOKEN = "test-read-token";
  process.env.FENRUA_OBSERVATION_PUBLIC_KEY_B64 = signingPublicKeyB64;
  process.env.FENRUA_OBSERVATION_KEY_ID = "fenchain-978-observation-v1";
}

try {
  assert.doesNotMatch(chainPage, /Blocks since check|data-chain-field="(?:978|521)-delta"/);
  assert.doesNotMatch(chainClient, /"0 blocks"|lastChainBlocks|lastChainCheckedAt/);
  assert.doesNotMatch(chainApi, /FENCHAIN_(?:N521_)?RPC_URL|eth_getBlockByNumber|eth_chainId|jsonrpc/);

  setGatewayEnvironment();
  let gatewayCalls = 0;
  globalThis.fetch = async (endpoint, options) => {
    gatewayCalls += 1;
    assert.equal(endpoint, "https://observation.example.test/status");
    assert.equal(options.method, "GET");
    assert.equal(options.headers["x-fenrua-observation-read-token"], "test-read-token");
    assert.equal(options.body, undefined);
    return gatewayResponse(observation());
  };

  const healthy = await callHandler({ headers: { "x-forwarded-for": "198.51.100.1" } });
  assert.equal(healthy.statusCode, 200);
  assert.equal(healthy.headers.get("cache-control"), "public, max-age=0, must-revalidate");
  assert.equal(
    healthy.headers.get("cdn-cache-control"),
    "public, s-maxage=5, stale-while-revalidate=0, stale-if-error=0"
  );
  assert.equal(healthy.headers.get("vercel-cdn-cache-control"), healthy.headers.get("cdn-cache-control"));
  assert.equal(gatewayCalls, 1);
  assert.equal(healthy.body.chains[0].status, "live");
  assert.equal(healthy.body.chains[0].blockNumber, 184201);
  assert.equal(healthy.body.observations.length, 1);
  assert.match(healthy.body.observations[0].signature, /^[A-Za-z0-9_-]{86}$/);
  assertSanitized(healthy.body);

  const query = await callHandler({
    url: "/api/chain-progress?cache-bust=1",
    headers: { "x-forwarded-for": "198.51.100.2" },
  });
  assert.equal(query.statusCode, 400);
  assert.equal(gatewayCalls, 1);

  const method = await callHandler({ method: "POST", headers: { "x-forwarded-for": "198.51.100.3" } });
  assert.equal(method.statusCode, 405);

  const body = await callHandler({ headers: { "content-length": "1", "x-forwarded-for": "198.51.100.4" } });
  assert.equal(body.statusCode, 413);

  globalThis.fetch = async () => gatewayResponse(observation({ rpc_url: "https://must-not-pass.example.test" }));
  const invalidShape = await callHandler({ headers: { "x-forwarded-for": "198.51.100.5" } });
  assert.equal(invalidShape.statusCode, 200);
  assert.equal(invalidShape.body.chains[0].status, "unavailable");
  assert.deepEqual(invalidShape.body.observations, []);
  assertSanitized(invalidShape.body);

  globalThis.fetch = async () => gatewayResponse(observation({ signature: "a".repeat(86) }));
  const invalidSignature = await callHandler({ headers: { "x-forwarded-for": "198.51.100.51" } });
  assert.equal(invalidSignature.statusCode, 200);
  assert.equal(invalidSignature.body.chains[0].status, "unavailable");
  assert.deepEqual(invalidSignature.body.observations, []);
  assertSanitized(invalidSignature.body);

  globalThis.fetch = async () =>
    gatewayResponse(
      observation({
        observed_at: new Date(Date.now() - 46_000).toISOString(),
        staleness_seconds: 46,
      })
    );
  const stale = await callHandler({ headers: { "x-forwarded-for": "198.51.100.6" } });
  assert.equal(stale.statusCode, 200);
  assert.equal(stale.body.chains[0].status, "delayed");
  assert.equal(stale.body.chains[0].blockNumber, 184201);
  assertSanitized(stale.body);

  globalThis.fetch = async () =>
    gatewayResponse(
      observation({
        observed_block: null,
        source_quorum: 1,
        status: "partial",
      })
    );
  const partial = await callHandler({ headers: { "x-forwarded-for": "198.51.100.7" } });
  assert.equal(partial.statusCode, 200);
  assert.equal(partial.body.chains[0].status, "partial");
  assert.equal(partial.body.chains[0].blockNumber, null);
  assert.equal(partial.body.observations[0].source_quorum, 1);
  assertSanitized(partial.body);

  globalThis.fetch = async () =>
    gatewayResponse(
      observation({
        observed_block: null,
        source_quorum: 0,
        status: "unavailable",
      })
    );
  const unavailable = await callHandler({ headers: { "x-forwarded-for": "198.51.100.8" } });
  assert.equal(unavailable.statusCode, 200);
  assert.equal(unavailable.body.chains[0].status, "unavailable");
  assert.match(unavailable.body.observations[0].signature, /^[A-Za-z0-9_-]{86}$/);
  assertSanitized(unavailable.body);

  globalThis.fetch = async () => gatewayResponse("x".repeat(2_049), { contentLength: 2_049 });
  const oversized = await callHandler({ headers: { "x-forwarded-for": "198.51.100.9" } });
  assert.equal(oversized.statusCode, 200);
  assert.equal(oversized.body.chains[0].status, "unavailable");
  assertSanitized(oversized.body);

  const keyMetadata = await callKeyHandler({ headers: { "x-forwarded-for": "203.0.113.1" } });
  assert.equal(keyMetadata.statusCode, 200);
  assert.deepEqual(Object.keys(keyMetadata.body).sort(), [
    "algorithm",
    "canonicalization",
    "key_id",
    "public_key_b64",
    "version",
  ]);
  assert.equal(keyMetadata.body.algorithm, "Ed25519");
  assert.equal(keyMetadata.body.key_id, "fenchain-978-observation-v1");
  assert.equal(keyMetadata.body.public_key_b64, signingPublicKeyB64);
  assert.match(keyMetadata.body.canonicalization, /RFC 8785 JCS UTF-8/);
  assert.equal(keyMetadata.headers.get("cdn-cache-control"), "public, s-maxage=300, stale-while-revalidate=0, stale-if-error=0");

  const keyQuery = await callKeyHandler({
    url: "/api/chain-observation-key?anything=1",
    headers: { "x-forwarded-for": "203.0.113.2" },
  });
  assert.equal(keyQuery.statusCode, 400);

  delete process.env.FENRUA_OBSERVATION_GATEWAY_URL;
  delete process.env.FENRUA_OBSERVATION_READ_TOKEN;
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
      scope: "public-observation-gateway",
      cases: 11,
      rawRpcForwarding: false,
      n521TelemetryPublished: false,
    })
  );
} finally {
  globalThis.fetch = originalFetch;
  for (const key of environmentKeys) {
    if (originalEnvironment[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnvironment[key];
  }
}
