import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const canonicalOrigin = "https://fenrua.ai";
export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const routeStates = new Set(["current", "redirect", "gone", "archive", "reserved"]);
const indexPolicies = new Set(["index-follow", "noindex-follow", "noindex-nofollow-noarchive"]);
const cacheClasses = new Set(["html-current", "redirect", "gone", "immutable-asset", "short-lived-data", "api-dynamic"]);
const routeClasses = new Set(["html", "metadata", "api", "internal"]);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const identifierPattern = /^[a-z0-9][a-z0-9-]*$/;

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function asPath(value, label, failures) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    failures.push(`${label} must start with '/'.`);
    return false;
  }
  if (value.includes("//") || value.includes("?") || value.includes("#") || /\s/.test(value)) {
    failures.push(`${label} is not a normalized route path: ${value}`);
    return false;
  }
  if (value !== "/" && value.endsWith("/")) {
    failures.push(`${label} must not carry a trailing slash: ${value}`);
    return false;
  }
  return true;
}

function formatFailures(scope, failures) {
  if (failures.length === 0) return;
  throw new Error(`${scope} failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
}

function expectedCanonical(path) {
  return `${canonicalOrigin}${path}`;
}

function decodeXml(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

function sitemapPaths(source, failures) {
  const paths = [];
  for (const match of source.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const url = new URL(decodeXml(match[1]));
      if (url.origin !== canonicalOrigin || url.search || url.hash) {
        failures.push(`Sitemap URL must be a canonical, queryless Fenrua URL: ${match[1]}`);
        continue;
      }
      paths.push(url.pathname);
    } catch {
      failures.push(`Sitemap contains an invalid URL: ${match[1]}`);
    }
  }
  return paths;
}

function hasPattern(path) {
  return /\(\.\*\)|:[A-Za-z][A-Za-z0-9_-]*\*/.test(path);
}

function ruleHostPattern(rule) {
  return rule.has?.find((constraint) => constraint.type === "header" && constraint.key === "host")?.value ?? null;
}

function ruleKey({ ruleKind, path, destination, hostPattern }) {
  return JSON.stringify([ruleKind, hostPattern ?? "", path, destination]);
}

function ruleDescription({ ruleKind, path, destination, hostPattern }) {
  const host = hostPattern ? ` host=${hostPattern}` : "";
  return `${ruleKind}${host} ${path} -> ${destination}`;
}

function currentRouteFile(root, path) {
  return path === "/" ? resolve(root, "index.html") : resolve(root, `.${path}`, "index.html");
}

function toPublicPath(value) {
  return value.startsWith("/") ? value : `/${value}`;
}

function validDate(value) {
  return typeof value === "string" && datePattern.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validateBaseRecord(record, label, failures) {
  for (const key of [
    "id",
    "state",
    "methods",
    "expectedStatus",
    "destination",
    "canonical",
    "indexPolicy",
    "cacheClass",
    "contentOwner",
    "replacement",
    "effectiveDate",
    "reviewDate",
    "evidenceIds",
    "notes",
  ]) {
    if (!(key in record)) failures.push(`${label} is missing required field '${key}'.`);
  }
  if (!identifierPattern.test(record.id ?? "")) failures.push(`${label}.id must be a stable lowercase identifier.`);
  if (!routeStates.has(record.state)) failures.push(`${label}.state is not recognized: ${record.state}`);
  if (!Array.isArray(record.methods) || record.methods.length === 0 || new Set(record.methods).size !== record.methods.length) {
    failures.push(`${label}.methods must be a non-empty, unique array.`);
  } else if (!record.methods.every((method) => method === "GET" || method === "HEAD")) {
    failures.push(`${label}.methods may contain only GET and HEAD.`);
  }
  if (!Number.isInteger(record.expectedStatus) || record.expectedStatus < 100 || record.expectedStatus > 599) {
    failures.push(`${label}.expectedStatus must be a valid HTTP status code.`);
  }
  if (record.destination !== null && typeof record.destination !== "string") failures.push(`${label}.destination must be a string or null.`);
  if (record.canonical !== null && typeof record.canonical !== "string") failures.push(`${label}.canonical must be a string or null.`);
  if (!indexPolicies.has(record.indexPolicy)) failures.push(`${label}.indexPolicy is not recognized: ${record.indexPolicy}`);
  if (!cacheClasses.has(record.cacheClass)) failures.push(`${label}.cacheClass is not recognized: ${record.cacheClass}`);
  if (typeof record.contentOwner !== "string" || record.contentOwner.length === 0) failures.push(`${label}.contentOwner must be set.`);
  if (record.replacement !== null && typeof record.replacement !== "string") failures.push(`${label}.replacement must be a string or null.`);
  if (!validDate(record.effectiveDate)) failures.push(`${label}.effectiveDate must be an ISO calendar date.`);
  if (!validDate(record.reviewDate)) failures.push(`${label}.reviewDate must be an ISO calendar date.`);
  if (!Array.isArray(record.evidenceIds) || new Set(record.evidenceIds).size !== record.evidenceIds.length) {
    failures.push(`${label}.evidenceIds must be a unique array.`);
  }
  if (typeof record.notes !== "string") failures.push(`${label}.notes must be a string.`);
  if (record.routeClass !== undefined && !routeClasses.has(record.routeClass)) {
    failures.push(`${label}.routeClass is not recognized: ${record.routeClass}`);
  }
}

export function sourcePatternMatches(source, path) {
  const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = source.split(/(\(\.\*\)|:[A-Za-z][A-Za-z0-9_-]*\*)/g);
  const expression = parts
    .map((part) => (part === "(.*)" || /^:[A-Za-z][A-Za-z0-9_-]*\*$/.test(part) ? ".*" : escaped(part)))
    .join("");
  return new RegExp(`^${expression}$`).test(path);
}

export function loadRouteLifecycle(root = repositoryRoot) {
  const lifecycle = readJson(resolve(root, "data/route-lifecycle.json"));
  const schema = readJson(resolve(root, "schemas/route-lifecycle.v1.schema.json"));
  return { lifecycle, schema };
}

export function expandRouteGroups(lifecycle) {
  return lifecycle.routeGroups.flatMap((group) =>
    group.paths.map((path) => ({ ...group, path, groupId: group.id, paths: undefined })),
  );
}

export function checkRouteLifecycle({ root = repositoryRoot } = {}) {
  const { lifecycle, schema } = loadRouteLifecycle(root);
  const failures = [];

  if (schema.$id !== "https://fenrua.ai/schemas/route-lifecycle.v1.schema.json") {
    failures.push("Route lifecycle schema must retain its canonical schema ID.");
  }
  if (lifecycle.schemaVersion !== "fenrua.route-lifecycle.v1") failures.push("Route lifecycle must declare schemaVersion fenrua.route-lifecycle.v1.");
  if (lifecycle.canonicalOrigin !== canonicalOrigin) failures.push(`Route lifecycle canonicalOrigin must be ${canonicalOrigin}.`);
  if (!validDate(lifecycle.reviewedAt)) failures.push("Route lifecycle reviewedAt must be an ISO calendar date.");
  if (!Array.isArray(lifecycle.records) || !Array.isArray(lifecycle.routeGroups) || !Array.isArray(lifecycle.documentArchives)) {
    failures.push("Route lifecycle must contain records, routeGroups, and documentArchives arrays.");
    formatFailures("Route lifecycle", failures);
  }

  const identifiers = new Set();
  const explicitPaths = new Map();
  for (const record of lifecycle.records) {
    const label = `record ${record.id ?? "<missing>"}`;
    validateBaseRecord(record, label, failures);
    asPath(record.path, `${label}.path`, failures);
    if (identifiers.has(record.id)) failures.push(`Route lifecycle ID is duplicated: ${record.id}`);
    identifiers.add(record.id);
    if (explicitPaths.has(record.path)) failures.push(`Route lifecycle path is duplicated: ${record.path}`);
    explicitPaths.set(record.path, record);
  }

  const groupPaths = new Map();
  for (const group of lifecycle.routeGroups) {
    const label = `route group ${group.id ?? "<missing>"}`;
    validateBaseRecord(group, label, failures);
    if (identifiers.has(group.id)) failures.push(`Route lifecycle ID is duplicated: ${group.id}`);
    identifiers.add(group.id);
    if (!Array.isArray(group.paths) || group.paths.length === 0 || new Set(group.paths).size !== group.paths.length) {
      failures.push(`${label}.paths must be a non-empty, unique array.`);
      continue;
    }
    if (group.ruleKind !== "redirect" && group.ruleKind !== "rewrite") failures.push(`${label}.ruleKind must be redirect or rewrite.`);
    const anyPattern = group.paths.some(hasPattern);
    if (Boolean(group.pathPattern) !== anyPattern) failures.push(`${label}.pathPattern must reflect whether its paths contain wildcard syntax.`);
    for (const path of group.paths) {
      asPath(path, `${label}.paths`, failures);
      const key = `${group.hostPattern ?? "canonical"}\u0000${path}`;
      if (groupPaths.has(key)) failures.push(`Lifecycle rule path is duplicated: ${path}`);
      groupPaths.set(key, group);
    }
  }

  const allRecords = [...lifecycle.records, ...expandRouteGroups(lifecycle)];
  const currentRecords = lifecycle.records.filter((record) => record.state === "current");
  const currentPaths = new Set(currentRecords.map((record) => record.path));
  const currentOrArchivePaths = new Set(
    lifecycle.records.filter((record) => record.state === "current" || record.state === "archive").map((record) => record.path),
  );

  for (const record of allRecords) {
    const label = record.groupId ? `route group ${record.groupId} (${record.path})` : `record ${record.id}`;
    if (record.state === "current") {
      if (record.expectedStatus !== 200) failures.push(`${label} current routes must expect 200.`);
      if (record.destination !== null) failures.push(`${label} current routes cannot have a destination.`);
      if (record.routeClass === "html") {
        if (record.canonical !== expectedCanonical(record.path)) failures.push(`${label} must self-canonicalize to ${expectedCanonical(record.path)}.`);
        if (record.indexPolicy !== "index-follow") failures.push(`${label} current HTML routes must be index-follow.`);
        if (record.cacheClass !== "html-current") failures.push(`${label} current HTML routes must use html-current cache class.`);
      }
    }
    if (record.state === "redirect") {
      if (![301, 302, 307, 308].includes(record.expectedStatus)) failures.push(`${label} redirects must expect a redirect response.`);
      if (typeof record.destination !== "string" || record.destination.length === 0) failures.push(`${label} redirects require a destination.`);
      if (record.cacheClass !== "redirect") failures.push(`${label} redirects must use the redirect cache class.`);
    }
    if (record.state === "gone") {
      if (record.expectedStatus !== 410) failures.push(`${label} gone routes must expect 410.`);
      if (record.indexPolicy !== "noindex-nofollow-noarchive") failures.push(`${label} gone routes must be noindex, nofollow, noarchive.`);
      if (record.cacheClass !== "gone") failures.push(`${label} gone routes must use the gone cache class.`);
      if (record.destination !== "/api/legacy-gone") failures.push(`${label} gone routes must resolve through the controlled retirement handler.`);
    }
    if (record.state === "archive") {
      if (record.expectedStatus !== 200) failures.push(`${label} archive routes must expect 200.`);
      if (record.indexPolicy !== "noindex-nofollow-noarchive") failures.push(`${label} archive routes must be noindex, nofollow, noarchive.`);
    }
    if (record.state === "reserved" && record.path !== "/api/legacy-gone") {
      failures.push(`${label} is reserved without an approved reserved route purpose.`);
    }
    if (record.state === "redirect" && typeof record.destination === "string" && record.destination.startsWith("/") && !record.destination.includes("$")) {
      if (!currentOrArchivePaths.has(record.destination)) failures.push(`${label} redirects to an unmanaged internal destination: ${record.destination}`);
    }
  }

  for (const retired of allRecords.filter((record) => record.state === "gone" && hasPattern(record.path))) {
    for (const current of currentRecords) {
      if (sourcePatternMatches(retired.path, current.path)) {
        failures.push(`${retired.path} shadows current route ${current.path}.`);
      }
    }
  }

  const sitemap = readFileSync(resolve(root, "sitemap.xml"), "utf8");
  const sitemapRoutePaths = sitemapPaths(sitemap, failures);
  const sitemapSet = new Set(sitemapRoutePaths);
  if (sitemapSet.size !== sitemapRoutePaths.length) failures.push("Sitemap paths must be unique.");
  const currentHtml = currentRecords.filter((record) => record.routeClass === "html");
  const currentHtmlPaths = new Set(currentHtml.map((record) => record.path));
  for (const record of currentHtml) {
    if (!sitemapSet.has(record.path)) failures.push(`Current HTML lifecycle route is missing from sitemap: ${record.path}`);
    if (!existsSync(currentRouteFile(root, record.path))) failures.push(`Current HTML lifecycle route is not generated: ${record.path}`);
  }
  for (const path of sitemapSet) {
    if (!currentHtmlPaths.has(path)) failures.push(`Sitemap contains a path without a current HTML lifecycle record: ${path}`);
  }
  for (const record of allRecords.filter((record) => record.state === "gone" || record.state === "archive")) {
    if (sitemapSet.has(record.path)) failures.push(`${record.state} route must not be in sitemap: ${record.path}`);
  }

  const vercel = readJson(resolve(root, "vercel.json"));
  const configuredRules = [
    ...(vercel.redirects ?? []).map((rule) => ({
      ruleKind: "redirect",
      path: rule.source,
      destination: rule.destination,
      hostPattern: ruleHostPattern(rule),
      permanent: rule.permanent,
    })),
    ...(vercel.rewrites ?? []).map((rule) => ({
      ruleKind: "rewrite",
      path: rule.source,
      destination: rule.destination,
      hostPattern: ruleHostPattern(rule),
      permanent: undefined,
    })),
  ];
  const lifecycleRules = allRecords
    .filter((record) => record.ruleKind)
    .map((record) => ({
      ruleKind: record.ruleKind,
      path: record.path,
      destination: record.destination,
      hostPattern: record.hostPattern ?? null,
      permanent: record.expectedStatus === 308,
    }));
  const lifecycleRuleKeys = new Set(lifecycleRules.map(ruleKey));
  const configuredRuleKeys = new Set(configuredRules.map(ruleKey));
  for (const rule of configuredRules) {
    if (!lifecycleRuleKeys.has(ruleKey(rule))) failures.push(`vercel.json rule is missing a lifecycle record: ${ruleDescription(rule)}`);
    if (rule.ruleKind === "redirect" && rule.permanent !== true) failures.push(`Configured redirect must be permanent: ${ruleDescription(rule)}`);
  }
  for (const rule of lifecycleRules) {
    if (!configuredRuleKeys.has(ruleKey(rule))) failures.push(`Lifecycle rule is missing from vercel.json: ${ruleDescription(rule)}`);
  }

  const archiveHeader = vercel.headers?.find((entry) => entry.source === "/docs/archive/(.*)")?.headers?.find((header) => header.key === "X-Robots-Tag")?.value;
  if (archiveHeader !== "noindex, nofollow, noarchive") failures.push("Archive routes must have the configured noindex, nofollow, noarchive header.");

  const documentRegister = readJson(resolve(root, "data/public-document-register.json"));
  const registeredArchiveById = new Map(
    documentRegister.records.filter((record) => record.status === "archived" || record.status === "superseded").map((record) => [record.id, record]),
  );
  const declaredArchiveIds = new Set();
  for (const archive of lifecycle.documentArchives) {
    declaredArchiveIds.add(archive.id);
    const registered = registeredArchiveById.get(archive.id);
    if (!registered) {
      failures.push(`Lifecycle document archive is absent from the public document register: ${archive.id}`);
      continue;
    }
    if (archive.status !== registered.status) failures.push(`Document archive status differs from register: ${archive.id}`);
    if (archive.path !== toPublicPath(registered.path)) failures.push(`Document archive path differs from register: ${archive.id}`);
    if (archive.formerPath !== toPublicPath(registered.formerPath)) failures.push(`Document archive formerPath differs from register: ${archive.id}`);
    if (archive.replacementPath !== toPublicPath(registered.replacementPath)) failures.push(`Document archive replacementPath differs from register: ${archive.id}`);
    const lifecycleRecord = explicitPaths.get(archive.path);
    if (lifecycleRecord?.state !== "archive") failures.push(`Document archive lacks an archive lifecycle route: ${archive.path}`);
    if (!lifecycleRecord?.evidenceIds?.includes(archive.id)) failures.push(`Document archive lifecycle route must reference its document-register ID: ${archive.path}`);
  }
  for (const archiveId of registeredArchiveById.keys()) {
    if (!declaredArchiveIds.has(archiveId)) failures.push(`Public document archive is missing from the lifecycle register: ${archiveId}`);
  }

  const robots = readFileSync(resolve(root, "robots.txt"), "utf8");
  for (const record of allRecords.filter((record) => record.state === "gone")) {
    const simpleRoot = record.path.replace(/\/:path\*$/, "").replace(/\/(?:\(\.\*\))$/, "");
    if (new RegExp(`Disallow:\\s*${simpleRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(robots)) {
      failures.push(`robots.txt must not hide retired route responses: ${record.path}`);
    }
  }

  formatFailures("Route lifecycle", failures);
  return {
    status: "ok",
    records: lifecycle.records.length,
    routeGroups: lifecycle.routeGroups.length,
    lifecycleRules: lifecycleRules.length,
    currentHtmlRoutes: currentHtml.length,
    archivedDocuments: lifecycle.documentArchives.length,
  };
}
