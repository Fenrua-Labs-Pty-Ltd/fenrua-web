import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { canonicalOrigin, expandRouteGroups, loadRouteLifecycle, repositoryRoot } from "./route-lifecycle-lib.mjs";

const maxBodyBytes = 1_000_000;
const requestTimeoutMs = 15_000;
const auditConcurrency = 8;

function isInside(candidate, parent) {
  const path = relative(parent, candidate);
  return path === "" || (!path.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) && path !== ".." && !isAbsolute(path));
}

function normalizeOrigin(value) {
  const origin = new URL(value);
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
    throw new TypeError("--url must be a canonical HTTPS origin without credentials, path, query, or fragment.");
  }
  return origin.origin;
}

function parseArguments(args) {
  const options = { origin: canonicalOrigin, outputPath: null };
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag !== "--url" && flag !== "--output") throw new TypeError(`Unknown argument: ${flag}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new TypeError(`${flag} requires a value.`);
    if (flag === "--url") options.origin = normalizeOrigin(value);
    else options.outputPath = value;
    index += 1;
  }
  return options;
}

function mediaType(response) {
  return (response.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
}

function header(response, name) {
  return response.headers.get(name) ?? "";
}

function canonicalFrom(html) {
  return html.match(/<link\b[^>]*\brel="canonical"[^>]*\bhref="([^"]+)"[^>]*>/i)?.[1] ?? "";
}

function robotsFrom(html) {
  return html.match(/<meta\b[^>]*\bname="robots"[^>]*\bcontent="([^"]+)"[^>]*>/i)?.[1] ?? "";
}

function concretePath(path) {
  return path
    .replace(/:[A-Za-z][A-Za-z0-9_-]*\*/g, "route-lifecycle-audit")
    .replace(/\(\.\*\)/g, "route-lifecycle-audit");
}

function expectedRedirect(destination, requestUrl) {
  const substituted = destination.replaceAll("$1", new URL(requestUrl).pathname.replace(/^\//, ""));
  return new URL(substituted, requestUrl).toString();
}

function containsNoStore(cacheControl) {
  return /\bno-store\b/i.test(cacheControl) && /\bmax-age=0\b/i.test(cacheControl);
}

function cacheIsRevalidatable(cacheControl) {
  return /\bmust-revalidate\b/i.test(cacheControl);
}

function bodyFingerprint(body) {
  return createHash("sha256").update(body).digest("hex");
}

async function fetchBounded(url, { method = "GET", fetchImpl = fetch } = {}) {
  const response = await fetchImpl(url, {
    method,
    redirect: "manual",
    headers: { accept: "text/html,application/json,text/plain,application/xml,image/*;q=0.9,*/*;q=0.1", "cache-control": "no-cache" },
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  const declaredLength = response.headers.get("content-length");
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > maxBodyBytes)) {
    await response.body?.cancel();
    throw new Error(`Response declares a body larger than ${maxBodyBytes} bytes.`);
  }
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length > maxBodyBytes) throw new Error(`Response body exceeds ${maxBodyBytes} bytes.`);
  return { response, body };
}

async function mapWithConcurrency(items, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(auditConcurrency, items.length) }, () => run()));
  return results;
}

function routeAssertions(record, requestUrl, getResponse, getBody, headResponse, headBody) {
  const failures = [];
  const contentType = mediaType(getResponse);
  const cacheControl = header(getResponse, "cache-control");
  const xRobotsTag = header(getResponse, "x-robots-tag");
  const html = contentType === "text/html" ? getBody.toString("utf8") : "";

  if (getResponse.status !== record.expectedStatus) failures.push(`GET expected ${record.expectedStatus}, received ${getResponse.status}.`);
  if (headResponse.status !== record.expectedStatus) failures.push(`HEAD expected ${record.expectedStatus}, received ${headResponse.status}.`);
  if (headBody.length !== 0) failures.push("HEAD response must not carry a body.");
  // Vercel redirect bodies are provider-generated and their media type is not
  // a lifecycle contract. All other route states own an explicit type.
  if (record.state !== "redirect" && record.contentType && contentType !== record.contentType) {
    failures.push(`Content-Type expected ${record.contentType}, received ${contentType || "missing"}.`);
  }

  if (record.state === "redirect") {
    const location = header(getResponse, "location");
    if (!location) failures.push("Redirect response is missing Location.");
    else if (new URL(location, requestUrl).toString() !== expectedRedirect(record.destination, requestUrl)) {
      failures.push(`Redirect location expected ${expectedRedirect(record.destination, requestUrl)}, received ${new URL(location, requestUrl).toString()}.`);
    }
  }

  if (record.state === "current" && record.routeClass === "html") {
    if (!cacheIsRevalidatable(cacheControl)) failures.push("Current HTML must use a revalidatable cache policy.");
    if (canonicalFrom(html) !== record.canonical) failures.push(`Canonical expected ${record.canonical}, received ${canonicalFrom(html) || "missing"}.`);
    if (record.indexPolicy === "index-follow" && robotsFrom(html) !== "index,follow") failures.push(`Robots meta expected index,follow, received ${robotsFrom(html) || "missing"}.`);
  }

  if (record.state === "current" && record.cacheClass === "short-lived-data" && !cacheIsRevalidatable(cacheControl)) {
    failures.push("Short-lived public data must use a revalidatable cache policy.");
  }

  if (record.state === "gone") {
    if (contentType !== "text/html") failures.push("Retired routes must return HTML.");
    if (!containsNoStore(cacheControl)) failures.push("Retired routes must use Cache-Control: no-store, max-age=0.");
    if (xRobotsTag !== "noindex, nofollow, noarchive") failures.push("Retired routes must carry the exact noindex retirement header.");
    if (!/<h1>This route has been retired\.<\/h1>/.test(html)) failures.push("Retired route body is missing its accessible retirement heading.");
    if (!/Fenrua Protocol/.test(html) || !/Fenrua Labs Pty Ltd/.test(html)) failures.push("Retired route body is missing current Fenrua naming.");
    if (/\b(?:legacy|presale|swap|staking|yield|wallet|market|investment|account|token|trading)\b/i.test(html)) {
      failures.push("Retired route body contains prohibited legacy-promotional language.");
    }
  }

  if (record.state === "archive" && xRobotsTag !== "noindex, nofollow, noarchive") {
    failures.push("Archive route must carry the exact noindex archival header.");
  }

  if (record.state === "gone") {
    if (header(headResponse, "cache-control") !== cacheControl) failures.push("HEAD retirement cache header must agree with GET.");
    if (header(headResponse, "x-robots-tag") !== xRobotsTag) failures.push("HEAD retirement robots header must agree with GET.");
  }

  return failures;
}

export async function auditLiveRouteLifecycle({ origin = canonicalOrigin, fetchImpl = fetch } = {}) {
  const baseOrigin = normalizeOrigin(origin);
  const { lifecycle } = loadRouteLifecycle();
  const records = [...lifecycle.records, ...expandRouteGroups(lifecycle)].filter((record) => record.audit === true);
  const observations = await mapWithConcurrency(records, async (record) => {
    const path = concretePath(record.path);
    const url = new URL(path, `${baseOrigin}/`).toString();
    try {
      const [{ response: getResponse, body: getBody }, { response: headResponse, body: headBody }] = await Promise.all([
        fetchBounded(url, { method: "GET", fetchImpl }),
        fetchBounded(url, { method: "HEAD", fetchImpl }),
      ]);
      const failures = routeAssertions(record, url, getResponse, getBody, headResponse, headBody);
      return {
        id: record.id,
        groupId: record.groupId ?? null,
        configuredPath: record.path,
        auditedPath: path,
        state: record.state,
        expectedStatus: record.expectedStatus,
        get: {
          status: getResponse.status,
          contentType: mediaType(getResponse),
          cacheControl: header(getResponse, "cache-control"),
          location: header(getResponse, "location"),
          xRobotsTag: header(getResponse, "x-robots-tag"),
          bodySha256: bodyFingerprint(getBody),
        },
        head: { status: headResponse.status, bodyBytes: headBody.length },
        passed: failures.length === 0,
        failures,
      };
    } catch (error) {
      return {
        id: record.id,
        groupId: record.groupId ?? null,
        configuredPath: record.path,
        auditedPath: path,
        state: record.state,
        expectedStatus: record.expectedStatus,
        passed: false,
        failures: [error instanceof Error ? error.message : String(error)],
      };
    }
  });
  const failed = observations.filter((observation) => !observation.passed);
  return {
    schemaVersion: "fenrua.live-route-lifecycle-audit.v1",
    auditedAt: new Date().toISOString(),
    origin: baseOrigin,
    routesAudited: observations.length,
    failures: failed.length,
    passed: failed.length === 0,
    observations,
  };
}

function writeExternalResult(outputPath, result) {
  if (!isAbsolute(outputPath)) throw new TypeError("--output must be an absolute path outside the repository.");
  const absolute = resolve(outputPath);
  const outputDirectory = dirname(absolute);
  mkdirSync(outputDirectory, { recursive: true });
  const resolvedDirectory = realpathSync(outputDirectory);
  const resolvedRoot = realpathSync(repositoryRoot);
  if (isInside(resolvedDirectory, resolvedRoot)) throw new TypeError("--output must be outside the repository.");
  if (existsSync(absolute) && lstatSync(absolute).isSymbolicLink()) throw new TypeError("--output must not be a symbolic link.");
  writeFileSync(absolute, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return absolute;
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const { origin, outputPath } = parseArguments(process.argv.slice(2));
  const result = await auditLiveRouteLifecycle({ origin });
  const output = outputPath ? writeExternalResult(outputPath, result) : null;
  console.log(JSON.stringify({ status: result.passed ? "ok" : "failed", origin: result.origin, routesAudited: result.routesAudited, failures: result.failures, ...(output ? { output } : {}) }));
  if (!result.passed) process.exitCode = 1;
}
