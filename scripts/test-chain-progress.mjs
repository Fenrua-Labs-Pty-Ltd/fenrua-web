import assert from "node:assert/strict";
import { generateKeyPairSync, sign as signObservation } from "node:crypto";
import { readFileSync } from "node:fs";

const originalFetch = globalThis.fetch;
const environmentKeys = [
  "FENRUA_OBSERVATION_GATEWAY_URL",
  "FENRUA_OBSERVATION_READ_TOKEN",
  "FENRUA_OBSERVATION_PUBLIC_KEY_B64",
  "FENRUA_OBSERVATION_KEY_ID",
  "FENRUA_N521_OBSERVATION_GATEWAY_URL",
  "FENRUA_N521_OBSERVATION_READ_TOKEN",
  "FENRUA_N521_OBSERVATION_PUBLIC_KEY_B64",
  "FENRUA_N521_OBSERVATION_KEY_ID",
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

async function callKeyHandler(handlerToCall, route, { method = "GET", url = route, headers = {} } = {}) {
  const response = responseRecorder();
  await handlerToCall({ method, url, headers }, response);
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
  assert.deepEqual(
    snapshot.chains.map((chain) => chain.expectedChainId),
    [978, 521]
  );
  for (const observationRecord of snapshot.observations) {
    assert.deepEqual(Object.keys(observationRecord).sort(), [
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
    ]);
  }
}

function configureGateways({ n521 = true } = {}) {
  process.env.FENRUA_OBSERVATION_GATEWAY_URL = "https://observation-978.example.test/status";
  process.env.FENRUA_OBSERVATION_READ_TOKEN = "test-978-read-token";
  process.env.FENRUA_OBSERVATION_PUBLIC_KEY_B64 = publicKeys["978"];
  process.env.FENRUA_OBSERVATION_KEY_ID = "fenchain-978-observation-v1";

  if (n521) {
    process.env.FENRUA_N521_OBSERVATION_GATEWAY_URL = "https://observation-521.example.test/status";
    process.env.FENRUA_N521_OBSERVATION_READ_TOKEN = "test-521-read-token";
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
      assert.equal(options.headers["x-fenrua-observation-read-token"], "test-978-read-token");
      assert.equal(options.headers["x-fenrua-n521-observation-read-token"], undefined);
      return gatewayResponse(observation("978", overrides["978"]));
    }
    if (endpoint === "https://observation-521.example.test/status") {
      assert.equal(options.headers["x-fenrua-n521-observation-read-token"], "test-521-read-token");
      assert.equal(options.headers["x-fenrua-observation-read-token"], undefined);
      return gatewayResponse(observation("521", overrides["521"]));
    }
    throw new Error("Unexpected gateway request");
  };
}

try {
  assert.doesNotMatch(chainPage, /Blocks since check|data-chain-field="(?:978|521)-delta"/);
  assert.match(chainPage, /data-chain-field="978-activity"/);
  assert.match(chainPage, /data-chain-field="521-activity"/);
  assert.doesNotMatch(chainClient, /"0 blocks"|lastChainBlocks|lastChainCheckedAt|Private telemetry not published/);
  assert.match(chainClient, /secondsSince\(payload\.generatedAt\)/);
  assert.match(chainClient, /const chainRefreshMs = 20_000/);
  assert.match(chainApi, /const refreshMs = 20_000/);
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
    "public, s-maxage=5, stale-while-revalidate=0, stale-if-error=0"
  );
  assert.equal(gatewayCalls, 2);
  assert.equal(healthy.body.refreshMs, 20_000);
  assert.equal(healthy.body.freshnessSeconds, 90);
  assert.equal(healthy.body.chains[0].status, "live");
  assert.equal(healthy.body.chains[0].observationSequence, 41);
  assert.equal(healthy.body.chains[1].status, "live");
  assert.equal(healthy.body.chains[1].blockNumber, 521001);
  assert.equal(healthy.body.chains[1].observationSequence, 7);
  assert.equal(healthy.body.observations.length, 2);
  assertSanitized(healthy.body);

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
    assert.equal(options.headers["x-fenrua-observation-read-token"], "test-978-read-token");
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

  globalThis.fetch = async () => gatewayResponse("x".repeat(2_049), { contentLength: 2_049 });
  const oversized = await callHandler({ headers: { "x-forwarded-for": "198.51.100.9" } });
  assert.equal(oversized.statusCode, 200);
  assert.ok(oversized.body.chains.every((chain) => chain.status === "unavailable"));
  assert.deepEqual(oversized.body.observations, []);
  assertSanitized(oversized.body);

  configureGateways();
  const key978 = await callKeyHandler(chain978KeyHandler, "/api/chain-observation-key", {
    headers: { "x-forwarded-for": "203.0.113.1" },
  });
  const key521 = await callKeyHandler(chain521KeyHandler, "/api/chain-n521-observation-key", {
    headers: { "x-forwarded-for": "203.0.113.2" },
  });
  for (const [metadata, expectedKeyId, expectedPublicKey] of [
    [key978, "fenchain-978-observation-v1", publicKeys["978"]],
    [key521, "fenchain-521-observation-v1", publicKeys["521"]],
  ]) {
    assert.equal(metadata.statusCode, 200);
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
      cases: 12,
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
