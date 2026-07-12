import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const originalFetch = globalThis.fetch;
const original978 = process.env.FENCHAIN_RPC_URL;
const original521 = process.env.FENCHAIN_N521_RPC_URL;

const handler = (await import("../api/chain-progress.js")).default;
const chainPage = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const chainClient = readFileSync(new URL("../kernel-status.js", import.meta.url), "utf8");

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

function rpcResponse(result) {
  return {
    ok: true,
    async json() {
      return { result };
    },
  };
}

function head(number, timestamp = Math.floor(Date.now() / 1_000)) {
  return { number: `0x${number.toString(16)}`, timestamp: `0x${timestamp.toString(16)}` };
}

function assertSanitized(snapshot) {
  const forbidden = ["endpoint", "host", "envKey", "latencyMs", "probeId", "error", "blockTimestamp", "primarySource", "independentSource"];
  const encoded = JSON.stringify(snapshot);
  for (const chain of snapshot.chains) {
    for (const key of forbidden) {
      assert.ok(!Object.hasOwn(chain, key), `Public chain payload must not include ${key}.`);
      assert.ok(!encoded.includes(`"${key}"`), `Public chain payload must not include ${key}.`);
    }
  }
}

try {
  assert.doesNotMatch(chainPage, /Blocks since check|data-chain-field="(?:978|521)-delta"/);
  assert.doesNotMatch(chainClient, /"0 blocks"|lastChainBlocks|lastChainCheckedAt/);

  process.env.FENCHAIN_RPC_URL = "https://chain-978.example.test";
  process.env.FENCHAIN_N521_RPC_URL = "https://chain-521.example.test";

  globalThis.fetch = async (endpoint, options) => {
    const method = JSON.parse(options.body).method;
    const chainId = new URL(endpoint).hostname.includes("978") ? 978 : 521;
    if (method === "eth_chainId") return rpcResponse(`0x${chainId.toString(16)}`);
    if (method === "eth_getBlockByNumber") return rpcResponse(head(chainId === 978 ? 100 : 200));
    throw new Error("Unexpected RPC method");
  };

  const healthy = await callHandler();
  assert.equal(healthy.statusCode, 200);
  assert.equal(healthy.headers.get("cache-control"), "no-store, max-age=0, must-revalidate");
  assert.equal(healthy.headers.get("cdn-cache-control"), "no-store");
  assert.equal(healthy.headers.get("vercel-cdn-cache-control"), "no-store");
  assert.equal(healthy.body.chains.length, 2);
  assert.ok(healthy.body.chains.every((chain) => chain.status === "live"));
  assert.ok(
    healthy.body.chains.every(
      (chain) =>
        chain.confirmation?.evidenceSource === "confirmed" &&
        chain.confirmation?.confidence === "confirmed"
    )
  );
  assertSanitized(healthy.body);

  const uncachedRead = await callHandler({ headers: { "cache-control": "no-cache" } });
  assert.equal(uncachedRead.statusCode, 200);
  assertSanitized(uncachedRead.body);

  let queryFetches = 0;
  globalThis.fetch = async () => {
    queryFetches += 1;
    throw new Error("Query request must not reach an upstream.");
  };
  const query = await callHandler({ url: "/api/chain-progress?cache-bust=1" });
  assert.equal(query.statusCode, 400);
  assert.equal(queryFetches, 0);

  globalThis.fetch = async () => {
    throw new Error("Upstream unavailable");
  };
  const unavailable = await callHandler();
  assert.equal(unavailable.statusCode, 503);
  assert.ok(unavailable.body.chains.every((chain) => chain.status === "unavailable"));
  assert.ok(unavailable.body.chains.every((chain) => chain.confirmation?.confidence === "unavailable"));
  assertSanitized(unavailable.body);

  globalThis.fetch = async (endpoint, options) => {
    const method = JSON.parse(options.body).method;
    const expectedChainId = new URL(endpoint).hostname.includes("978") ? 978 : 521;
    if (method === "eth_chainId") return rpcResponse("0x1");
    return rpcResponse(head(expectedChainId === 978 ? 300 : 400));
  };
  const mismatch = await callHandler();
  assert.equal(mismatch.statusCode, 200);
  assert.ok(mismatch.body.chains.every((chain) => chain.status === "wrong-chain"));
  assert.ok(mismatch.body.chains.every((chain) => chain.confirmation?.confidence === "failure"));

  console.log(
    JSON.stringify({
      status: "ok",
      scope: "chain-progress-public-feed",
      cases: 4,
      rpcEndpointExposed: false,
    })
  );
} finally {
  globalThis.fetch = originalFetch;
  if (original978 === undefined) delete process.env.FENCHAIN_RPC_URL;
  else process.env.FENCHAIN_RPC_URL = original978;
  if (original521 === undefined) delete process.env.FENCHAIN_N521_RPC_URL;
  else process.env.FENCHAIN_N521_RPC_URL = original521;
}
