const refreshMs = 10_000;
const maxFreshHeadAgeSeconds = 60;
const responseCacheControl = "no-store, max-age=0, must-revalidate";
const responseCdnCacheControl = "no-store";

const chainTargets = [
  {
    id: "fenchain-978",
    title: "Chain 978",
    label: "FENc978",
    expectedChainId: 978,
    role: "FEN protocol support chain",
    envKey: "FENCHAIN_RPC_URL",
  },
  {
    id: "fenchain-n521",
    title: "Chain N521",
    label: "FENn521",
    expectedChainId: 521,
    role: "N / P-521 research chain",
    envKey: "FENCHAIN_N521_RPC_URL",
  },
];

let activeProbe = null;

function readProbeEndpoint(envKey) {
  const endpoint = process.env[envKey]?.trim();
  if (!endpoint) return "";

  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return "";
    return endpoint;
  } catch {
    return "";
  }
}

function hexToNumber(value) {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) return null;
  const parsed = Number.parseInt(value, 16);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function readLatestHead(value) {
  if (!value || typeof value !== "object") {
    return { blockNumber: null, blockTimestamp: null };
  }

  return {
    blockNumber: hexToNumber(value.number),
    blockTimestamp: hexToNumber(value.timestamp),
  };
}

function unavailableChain(chain) {
  return {
    id: chain.id,
    title: chain.title,
    label: chain.label,
    role: chain.role,
    expectedChainId: chain.expectedChainId,
    chainId: null,
    blockNumber: null,
    blockAgeSeconds: null,
    status: "unavailable",
    confirmation: {
      evidenceSource: "unavailable",
      confidence: "unavailable",
    },
    checkedAt: new Date().toISOString(),
  };
}

async function callProbeEndpoint(endpoint, method, params = []) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "cache-control": "no-store",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Upstream unavailable");

    const payload = await response.json();
    if (payload.error) throw new Error("Upstream rejected the read");

    return payload.result;
  } finally {
    clearTimeout(timeout);
  }
}

async function probeChain(chain) {
  const endpoint = readProbeEndpoint(chain.envKey);
  if (!endpoint) return unavailableChain(chain);

  try {
    const [chainIdHex, latestHead] = await Promise.all([
      callProbeEndpoint(endpoint, "eth_chainId"),
      callProbeEndpoint(endpoint, "eth_getBlockByNumber", ["latest", false]),
    ]);
    const chainId = hexToNumber(chainIdHex);
    const { blockNumber, blockTimestamp } = readLatestHead(latestHead);
    const blockAgeSeconds =
      blockTimestamp === null ? null : Math.max(0, Math.floor(Date.now() / 1_000 - blockTimestamp));
    const status =
      chainId === null
        ? "unavailable"
        : chainId !== chain.expectedChainId
          ? "wrong-chain"
          : blockNumber === null || blockAgeSeconds === null
            ? "unavailable"
            : blockAgeSeconds <= maxFreshHeadAgeSeconds
              ? "live"
              : "delayed";
    const confirmation =
      status === "live"
        ? {
            evidenceSource: "confirmed",
            confidence: "confirmed",
          }
        : status === "delayed"
          ? {
              evidenceSource: "stale",
              confidence: "stale",
            }
          : status === "wrong-chain"
            ? {
                evidenceSource: "mismatch",
                confidence: "failure",
              }
            : {
                evidenceSource: "unavailable",
                confidence: "unavailable",
              };

    return {
      id: chain.id,
      title: chain.title,
      label: chain.label,
      role: chain.role,
      expectedChainId: chain.expectedChainId,
      chainId,
      blockNumber,
      blockAgeSeconds,
      status,
      confirmation,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return unavailableChain(chain);
  }
}

function buildSnapshot() {
  if (!activeProbe) {
    activeProbe = Promise.all(chainTargets.map(probeChain))
      .then((chains) => ({
        generatedAt: new Date().toISOString(),
        refreshMs,
        chains,
      }))
      .finally(() => {
        activeProbe = null;
      });
  }

  return activeProbe;
}

function sendSnapshot(response, statusCode, snapshot) {
  response.setHeader("Cache-Control", responseCacheControl);
  response.setHeader("CDN-Cache-Control", responseCdnCacheControl);
  response.setHeader("Vercel-CDN-Cache-Control", responseCdnCacheControl);
  response.status(statusCode).json(snapshot);
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const requestUrl = new URL(request.url || "/api/chain-progress", "https://fenrua.ai");
  if (requestUrl.search) {
    response.status(400).json({ error: "Query parameters are not supported" });
    return;
  }

  const snapshot = await buildSnapshot();
  const allUnavailable = snapshot.chains.every((chain) => chain.status === "unavailable");
  sendSnapshot(response, allUnavailable ? 503 : 200, snapshot);
}
