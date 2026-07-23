import { createHash, createPublicKey, randomBytes, verify as verifySignature } from "node:crypto";
import { enforceObservationContinuity } from "../server/observation-continuity.js";

// This route is intentionally a bounded public adapter. It never forwards a
// browser request to JSON-RPC and never includes an endpoint, peer, hash, or
// operator detail in its response.
const refreshMs = 60_000;
// A browser refreshes each minute. Keep a confirmed signed observation current
// for three minutes so a normal refresh/cache delay does not present it as stale.
const maxFreshObservationAgeSeconds = 180;
const gatewayTimeoutMs = 5_000;
const maxGatewayResponseBytes = 2_048;
const responseCacheControl = "public, max-age=0, must-revalidate";
// The browser checks every 60 seconds, while a signed observation is published
// at most once per 15-second watcher/publisher cycle. A one-minute edge cache
// keeps public reads responsive without changing the signed observation or its
// timestamp; the client still derives freshness from `observed_at`.
const responseCdnCacheControl = "public, s-maxage=60, stale-while-revalidate=0, stale-if-error=0";
const rateLimitWindowMs = 60_000;
const rateLimitMaximumRequests = 60;
const rateLimitMaximumEntries = 10_000;
const allowedGatewayFields = new Set([
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
const requiredGatewayFields = [
  "chain",
  "observed_block",
  "observed_at",
  "sequence",
  "source_quorum",
  "status",
  "staleness_seconds",
  "signature",
  "key_id",
];
const safeStatuses = new Set(["confirmed", "partial", "unavailable"]);
const keyIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const ed25519SignaturePattern = /^[A-Za-z0-9_-]{86}$/;
const ed25519PublicKeyPattern = /^(?:[A-Za-z0-9_-]{43,512}|[A-Za-z0-9+/]{40,512}={0,2})$/;
const isoUtcPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const ed25519SpkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
const rateLimitSalt = randomBytes(16).toString("base64url");
const rateLimitEntries = new Map();

const observationTargets = [
  {
    id: "fenchain-978",
    chain: "978",
    title: "Chain 978",
    label: "FENc978",
    expectedChainId: 978,
    role: "Public Observation Gateway over Encrypted Private-Mesh Transport",
    env: {
      gatewayUrl: "FENRUA_OBSERVATION_GATEWAY_URL",
      readToken: "FENRUA_OBSERVATION_READ_TOKEN",
      readHeader: "x-fenrua-observation-read-token",
      publicKey: "FENRUA_OBSERVATION_PUBLIC_KEY_B64",
      keyId: "FENRUA_OBSERVATION_KEY_ID",
      rotationCertificate: "FENRUA_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64",
    },
  },
  {
    id: "fenchain-n521",
    chain: "521",
    title: "Chain N521",
    label: "FENn521",
    expectedChainId: 521,
    role: "Public Observation Gateway over Encrypted Private-Mesh Transport",
    env: {
      gatewayUrl: "FENRUA_N521_OBSERVATION_GATEWAY_URL",
      readToken: "FENRUA_N521_OBSERVATION_READ_TOKEN",
      readHeader: "x-fenrua-n521-observation-read-token",
      publicKey: "FENRUA_N521_OBSERVATION_PUBLIC_KEY_B64",
      keyId: "FENRUA_N521_OBSERVATION_KEY_ID",
      rotationCertificate: "FENRUA_N521_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64",
    },
  },
];

let activeSnapshot = null;
let rateLimitSweeps = 0;

function readHeader(request, name) {
  const headers = request?.headers;
  if (!headers) return "";

  if (typeof headers.get === "function") return headers.get(name) || "";

  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}

function requestHasBody(request) {
  const contentLength = readHeader(request, "content-length").trim();
  const transferEncoding = readHeader(request, "transfer-encoding").trim();

  if (transferEncoding) return true;
  if (!contentLength) return false;
  return !/^0+$/.test(contentLength);
}

function clientRateLimitKey(request) {
  const forwarded = readHeader(request, "x-forwarded-for").split(",")[0]?.trim();
  const realIp = readHeader(request, "x-real-ip").trim();
  const socketIp = typeof request?.socket?.remoteAddress === "string" ? request.socket.remoteAddress : "";
  const identifier = (forwarded || realIp || socketIp || "unknown").slice(0, 128);

  // The raw address is not logged or retained. A per-instance random salt also
  // prevents this temporary abuse-control key from being reused elsewhere.
  return createHash("sha256").update(rateLimitSalt).update("\0").update(identifier).digest("base64url");
}

function removeExpiredRateLimitEntries(now) {
  for (const [key, entry] of rateLimitEntries) {
    if (now - entry.startedAt >= rateLimitWindowMs) rateLimitEntries.delete(key);
  }

  while (rateLimitEntries.size >= rateLimitMaximumEntries) {
    const oldest = rateLimitEntries.keys().next().value;
    if (!oldest) break;
    rateLimitEntries.delete(oldest);
  }
}

function allowRequest(request) {
  const now = Date.now();
  rateLimitSweeps += 1;
  if (rateLimitSweeps % 128 === 0 || rateLimitEntries.size >= rateLimitMaximumEntries) {
    removeExpiredRateLimitEntries(now);
  }

  const key = clientRateLimitKey(request);
  const current = rateLimitEntries.get(key);
  if (!current || now - current.startedAt >= rateLimitWindowMs) {
    rateLimitEntries.set(key, { startedAt: now, count: 1 });
    return true;
  }

  if (current.count >= rateLimitMaximumRequests) return false;
  current.count += 1;
  return true;
}

function readGatewayConfig(target) {
  const candidate = process.env[target.env.gatewayUrl]?.trim();
  const readToken = process.env[target.env.readToken]?.trim();
  if (!candidate || !readToken) return { state: "missing" };

  try {
    const endpoint = new URL(candidate);
    if (
      endpoint.protocol !== "https:" ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    ) {
      return { state: "invalid" };
    }

    return { state: "configured", endpoint: endpoint.toString(), readToken };
  } catch {
    return { state: "invalid" };
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeSafeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function parseObservedAt(value) {
  if (typeof value !== "string" || value.length > 32 || !isoUtcPattern.test(value)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function readVerificationKey(target, expectedKeyId) {
  const encodedPublicKey = process.env[target.env.publicKey]?.trim();
  const configuredKeyId = process.env[target.env.keyId]?.trim();
  if (
    !encodedPublicKey ||
    !configuredKeyId ||
    configuredKeyId !== expectedKeyId ||
    !keyIdPattern.test(configuredKeyId) ||
    !ed25519PublicKeyPattern.test(encodedPublicKey)
  ) {
    return null;
  }

  try {
    const keyBytes = Buffer.from(encodedPublicKey, "base64url");
    const der = keyBytes.length === 32 ? Buffer.concat([ed25519SpkiPrefix, keyBytes]) : keyBytes;
    const key = createPublicKey({ key: der, format: "der", type: "spki" });
    return key.asymmetricKeyType === "ed25519" ? key : null;
  } catch {
    return null;
  }
}

function canonicalSignedPayload(observation) {
  // This insertion order is RFC 8785's lexicographic order for the fixed
  // ASCII-only schema. `staleness_seconds` and `signature` are intentionally
  // excluded because freshness is derived at serving time.
  return JSON.stringify({
    chain: observation.chain,
    key_id: observation.key_id,
    observed_at: observation.observed_at,
    observed_block: observation.observed_block,
    sequence: observation.sequence,
    source_quorum: observation.source_quorum,
    status: observation.status,
    version: observation.version,
  });
}

function hasValidSignature(target, observation) {
  const key = readVerificationKey(target, observation.key_id);
  if (!key || typeof observation.signature !== "string") return false;

  try {
    return verifySignature(
      null,
      Buffer.from(canonicalSignedPayload(observation), "utf8"),
      key,
      Buffer.from(observation.signature, "base64url")
    );
  } catch {
    return false;
  }
}

function normalizeGatewayObservation(payload, target) {
  if (!isPlainObject(payload)) return null;

  const keys = Object.keys(payload);
  if (keys.some((key) => !allowedGatewayFields.has(key))) return null;
  if (requiredGatewayFields.some((key) => !Object.hasOwn(payload, key))) return null;
  if (Object.hasOwn(payload, "version") && payload.version !== 1) return null;
  if (payload.chain !== target.chain || !safeStatuses.has(payload.status)) return null;
  if (!isNonNegativeSafeInteger(payload.source_quorum) || payload.source_quorum > 2) return null;
  if (!isNonNegativeSafeInteger(payload.staleness_seconds)) return null;
  if (!keyIdPattern.test(payload.key_id)) return null;

  const observedAtMs = parseObservedAt(payload.observed_at);
  const observedBlock = payload.observed_block;
  const sequence = payload.sequence;
  if (observedBlock !== null && !isNonNegativeSafeInteger(observedBlock)) return null;
  if (!Number.isSafeInteger(sequence) || sequence < 1) return null;

  const signature = payload.signature;
  if (signature !== null && (typeof signature !== "string" || !ed25519SignaturePattern.test(signature))) {
    return null;
  }

  const now = Date.now();
  if (observedAtMs === null || observedAtMs > now + 30_000) return null;
  const calculatedStaleness = Math.max(0, Math.floor((now - observedAtMs) / 1_000));
  const stalenessSeconds = Math.max(payload.staleness_seconds, calculatedStaleness);

  if (payload.status === "confirmed") {
    if (observedBlock === null || payload.source_quorum !== 2 || signature === null) return null;
  } else if (payload.status === "partial") {
    if (observedBlock !== null || payload.source_quorum < 1 || payload.source_quorum >= 2 || signature === null) return null;
  } else if (observedBlock !== null || payload.source_quorum !== 0) {
    // An unavailable record may be a fresh signed statement from the private
    // watcher, or an unsigned bootstrap/fail-closed adapter result. Neither is
    // ever mapped to a successful chain state.
    return null;
  }

  const observation = {
    version: payload.version ?? 1,
    chain: target.chain,
    observed_block: observedBlock,
    observed_at: payload.observed_at,
    sequence,
    source_quorum: payload.source_quorum,
    status: payload.status,
    staleness_seconds: stalenessSeconds,
    signature,
    key_id: payload.key_id,
  };

  if (observation.signature !== null && !hasValidSignature(target, observation)) return null;
  if (observation.status !== "unavailable" && observation.signature === null) return null;
  return observation;
}

async function cancelGatewayResponse(upstream, controller, reason) {
  controller.abort();
  const body = upstream.body;
  if (!body) return;

  try {
    if (typeof body.cancel === "function") {
      await body.cancel(reason);
      return;
    }
    const reader = body.getReader?.();
    if (!reader) return;
    try {
      await reader.cancel(reason);
    } finally {
      reader.releaseLock?.();
    }
  } catch {
    // Abort may error the response stream before explicit cancellation runs;
    // both outcomes terminate the body without treating it as public data.
  }
}

async function readBoundedGatewayResponse(upstream, controller) {
  const reader = upstream.body?.getReader?.();
  if (!reader) return null;

  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) return null;

      totalBytes += value.byteLength;
      if (totalBytes > maxGatewayResponseBytes) {
        // Abort the upstream transfer before awaiting stream cancellation so a
        // chunked response cannot continue consuming bandwidth in the gap.
        controller.abort();
        try {
          await reader.cancel("Gateway response exceeded the public byte limit");
        } catch {
          // The abort may already have errored the reader; either state is the
          // required fail-closed outcome.
        }
        return null;
      }

      chunks.push(Buffer.from(value));
    }

    return Buffer.concat(chunks, totalBytes).toString("utf8");
  } finally {
    reader.releaseLock?.();
  }
}

async function fetchGatewayObservation(target) {
  const config = readGatewayConfig(target);
  if (config.state !== "configured") return { observation: null, configuration: config.state };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), gatewayTimeoutMs);

  try {
    const upstream = await fetch(config.endpoint, {
      method: "GET",
      headers: {
        accept: "application/json",
        [target.env.readHeader]: config.readToken,
      },
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });

    if (!upstream.ok) {
      await cancelGatewayResponse(upstream, controller, "Gateway returned a non-success response");
      return { observation: null, configuration: "configured" };
    }

    const contentLength = upstream.headers?.get?.("content-length");
    if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > maxGatewayResponseBytes)) {
      await cancelGatewayResponse(upstream, controller, "Gateway response exceeded the public byte limit");
      return { observation: null, configuration: "configured" };
    }

    const text = await readBoundedGatewayResponse(upstream, controller);
    if (text === null) {
      return { observation: null, configuration: "configured" };
    }

    const observation = normalizeGatewayObservation(JSON.parse(text), target);
    if (!observation) return { observation: null, configuration: "configured" };

    const continuity = await enforceObservationContinuity({
      target,
      observation,
      canonicalPayload: canonicalSignedPayload(observation),
      freshnessSeconds: maxFreshObservationAgeSeconds,
    });
    return {
      observation: continuity.accepted ? observation : null,
      configuration: "configured",
      keyRotation: continuity.accepted ? continuity.keyRotation ?? null : null,
    };
  } catch {
    return { observation: null, configuration: "configured" };
  } finally {
    clearTimeout(timeout);
  }
}

function unavailableChain(target, checkedAt) {
  return {
    id: target.id,
    title: target.title,
    label: target.label,
    role: target.role,
    expectedChainId: target.expectedChainId,
    chainId: null,
    blockNumber: null,
    blockAgeSeconds: null,
    observationSequence: null,
    status: "unavailable",
    confirmation: {
      evidenceSource: "unavailable",
      confidence: "unavailable",
    },
    checkedAt,
  };
}

function awaitingSignedObservation(target, checkedAt) {
  return {
    id: target.id,
    title: target.title,
    label: target.label,
    role: "Awaiting independently signed bounded observation",
    expectedChainId: target.expectedChainId,
    chainId: null,
    blockNumber: null,
    blockAgeSeconds: null,
    observationSequence: null,
    status: "waiting",
    confirmation: {
      evidenceSource: "awaiting-signed-observation",
      confidence: "unavailable",
    },
    checkedAt,
  };
}

function mapObservation(target, source, checkedAt) {
  const { observation, configuration } = source;
  if (!observation || observation.status === "unavailable") {
    return target.chain === "521" && configuration === "missing"
      ? awaitingSignedObservation(target, checkedAt)
      : unavailableChain(target, checkedAt);
  }

  const isFreshConfirmed =
    observation.status === "confirmed" && observation.staleness_seconds <= maxFreshObservationAgeSeconds;
  const status = isFreshConfirmed ? "live" : observation.status === "confirmed" ? "delayed" : "partial";
  const isConfirmedObservation = observation.status === "confirmed";

  return {
    id: target.id,
    title: target.title,
    label: target.label,
    role: target.role,
    expectedChainId: target.expectedChainId,
    chainId: isConfirmedObservation ? target.expectedChainId : null,
    blockNumber: isConfirmedObservation ? observation.observed_block : null,
    blockAgeSeconds: isConfirmedObservation ? observation.staleness_seconds : null,
    observationSequence: observation.sequence,
    status,
    confirmation:
      status === "live"
        ? { evidenceSource: "signed-observation", confidence: "confirmed" }
        : status === "delayed"
          ? { evidenceSource: "stale-observation", confidence: "stale" }
          : { evidenceSource: "partial-observation", confidence: "partial" },
    checkedAt: observation.observed_at,
  };
}

async function buildSnapshot() {
  if (!activeSnapshot) {
    activeSnapshot = Promise.all(observationTargets.map(fetchGatewayObservation))
      .then((sources) => {
        const generatedAt = new Date().toISOString();
        return {
          version: 1,
          generatedAt,
          refreshMs,
          freshnessSeconds: maxFreshObservationAgeSeconds,
          // Every entry is a verified bounded record. No synthetic N521 block,
          // sequence, or successful state is created when its gateway is absent.
          // Only records that can support a current or partial public state are
          // exposed here. A signed `unavailable` watcher statement remains a
          // fail-closed source result; it is not a current chain observation.
          observations: sources.flatMap(({ observation, keyRotation }) =>
            observation && observation.status !== "unavailable"
              ? [{ ...observation, ...(keyRotation ? { key_rotation: keyRotation } : {}) }]
              : []
          ),
          chains: observationTargets.map((target, index) => mapObservation(target, sources[index], generatedAt)),
        };
      })
      .finally(() => {
        activeSnapshot = null;
      });
  }

  return activeSnapshot;
}

function setSnapshotCacheHeaders(response) {
  response.setHeader("Cache-Control", responseCacheControl);
  response.setHeader("CDN-Cache-Control", responseCdnCacheControl);
  response.setHeader("Vercel-CDN-Cache-Control", responseCdnCacheControl);
}

function sendError(response, statusCode, error, headers = {}) {
  response.setHeader("Cache-Control", "private, no-store");
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  response.status(statusCode).json({ error });
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    sendError(response, 405, "Method not allowed", { Allow: "GET" });
    return;
  }

  let requestUrl;
  try {
    requestUrl = new URL(request.url || "/api/chain-progress", "https://fenrua.ai");
  } catch {
    sendError(response, 400, "Invalid request URL");
    return;
  }

  if (requestUrl.search) {
    sendError(response, 400, "Query parameters are not supported");
    return;
  }

  if (requestHasBody(request)) {
    sendError(response, 413, "Request body is not supported");
    return;
  }

  if (!allowRequest(request)) {
    sendError(response, 429, "Too many requests", { "Retry-After": "60" });
    return;
  }

  const snapshot = await buildSnapshot();
  setSnapshotCacheHeaders(response);
  response.status(200).json(snapshot);
}
