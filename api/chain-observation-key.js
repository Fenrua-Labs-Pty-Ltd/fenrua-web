import { createHash, createPublicKey, randomBytes } from "node:crypto";

// This endpoint publishes verification metadata only. The key is public by
// design; the signing key, gateway URL, and every private-mesh detail remain
// server-side and are never returned here.
const keyIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const publicKeyPattern = /^(?:[A-Za-z0-9_-]{43,512}|[A-Za-z0-9+/]{40,512}={0,2})$/;
const ed25519SpkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
const rateLimitWindowMs = 60_000;
const rateLimitMaximumRequests = 120;
const rateLimitMaximumEntries = 10_000;
const rateLimitSalt = randomBytes(16).toString("base64url");
const rateLimitEntries = new Map();
const metadataCacheControl = "public, max-age=300, must-revalidate";
const metadataCdnCacheControl = "public, s-maxage=300, stale-while-revalidate=0, stale-if-error=0";
const canonicalization =
  "RFC 8785 JCS UTF-8; fields: version,chain,observed_block,observed_at,sequence,source_quorum,status,key_id";

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
  return Boolean(readHeader(request, "transfer-encoding").trim()) || (contentLength && !/^0+$/.test(contentLength));
}

function requestKey(request) {
  const forwarded = readHeader(request, "x-forwarded-for").split(",")[0]?.trim();
  const realIp = readHeader(request, "x-real-ip").trim();
  const socketIp = typeof request?.socket?.remoteAddress === "string" ? request.socket.remoteAddress : "";
  const identifier = (forwarded || realIp || socketIp || "unknown").slice(0, 128);
  return createHash("sha256").update(rateLimitSalt).update("\0").update(identifier).digest("base64url");
}

function allowRequest(request) {
  const now = Date.now();
  rateLimitSweeps += 1;
  if (rateLimitSweeps % 128 === 0 || rateLimitEntries.size >= rateLimitMaximumEntries) {
    for (const [key, entry] of rateLimitEntries) {
      if (now - entry.startedAt >= rateLimitWindowMs) rateLimitEntries.delete(key);
    }
    while (rateLimitEntries.size >= rateLimitMaximumEntries) {
      const oldest = rateLimitEntries.keys().next().value;
      if (!oldest) break;
      rateLimitEntries.delete(oldest);
    }
  }

  const key = requestKey(request);
  const current = rateLimitEntries.get(key);
  if (!current || now - current.startedAt >= rateLimitWindowMs) {
    rateLimitEntries.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= rateLimitMaximumRequests) return false;
  current.count += 1;
  return true;
}

function readMetadata() {
  const encodedPublicKey = process.env.FENRUA_OBSERVATION_PUBLIC_KEY_B64?.trim();
  const keyId = process.env.FENRUA_OBSERVATION_KEY_ID?.trim();
  if (!encodedPublicKey || !keyId || !publicKeyPattern.test(encodedPublicKey) || !keyIdPattern.test(keyId)) {
    return null;
  }

  let publicKey;
  try {
    const bytes = Buffer.from(encodedPublicKey, "base64url");
    const der = bytes.length === 32 ? Buffer.concat([ed25519SpkiPrefix, bytes]) : bytes;
    const key = createPublicKey({ key: der, format: "der", type: "spki" });
    if (key.asymmetricKeyType !== "ed25519") return null;
    // Canonical SPKI DER/base64url output keeps independent verification
    // unambiguous even if the server variable was supplied as raw key bytes.
    publicKey = key.export({ type: "spki", format: "der" }).toString("base64url");
  } catch {
    return null;
  }

  return {
    version: 1,
    key_id: keyId,
    algorithm: "Ed25519",
    public_key_b64: publicKey,
    canonicalization,
  };
}

function sendError(response, statusCode, error, headers = {}) {
  response.setHeader("Cache-Control", "private, no-store");
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  response.status(statusCode).json({ error });
}

export default function handler(request, response) {
  if (request.method !== "GET") {
    sendError(response, 405, "Method not allowed", { Allow: "GET" });
    return;
  }

  let requestUrl;
  try {
    requestUrl = new URL(request.url || "/api/chain-observation-key", "https://fenrua.ai");
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

  const metadata = readMetadata();
  if (!metadata) {
    sendError(response, 503, "Observation key unavailable");
    return;
  }

  response.setHeader("Cache-Control", metadataCacheControl);
  response.setHeader("CDN-Cache-Control", metadataCdnCacheControl);
  response.setHeader("Vercel-CDN-Cache-Control", metadataCdnCacheControl);
  response.status(200).json(metadata);
}
