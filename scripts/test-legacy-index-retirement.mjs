import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import handler from "../api/legacy-gone.js";
import { routeAssertions } from "./audit-live-route-lifecycle.mjs";
import { RETIRED_ROUTE_CACHE_CONTROL, RETIRED_ROUTE_ROBOTS } from "./retired-route-contract.mjs";

assert.equal(RETIRED_ROUTE_CACHE_CONTROL, "no-store, max-age=0");
assert.equal(RETIRED_ROUTE_ROBOTS, "noindex, nofollow, noarchive");

const [vercelSource, sitemap, robots] = await Promise.all([
  readFile(new URL("../vercel.json", import.meta.url), "utf8"),
  readFile(new URL("../sitemap.xml", import.meta.url), "utf8"),
  readFile(new URL("../robots.txt", import.meta.url), "utf8"),
]);
const vercel = JSON.parse(vercelSource);

function responseRecorder() {
  return {
    headers: new Map(),
    statusCode: null,
    body: null,
    setHeader(name, value) {
      this.headers.set(name.toLowerCase(), value);
    },
    status(value) {
      this.statusCode = value;
      return this;
    },
    end(value = "") {
      this.body = value;
      return this;
    },
  };
}

const get = responseRecorder();
handler({ method: "GET" }, get);
assert.equal(get.statusCode, 410);
assert.equal(get.headers.get("x-robots-tag"), RETIRED_ROUTE_ROBOTS);
assert.match(get.headers.get("content-type"), /^text\/html/);
assert.equal(get.headers.get("cache-control"), RETIRED_ROUTE_CACHE_CONTROL);
assert.match(get.body, /<title>Retired route \| Fenrua BlackBox Protocol<\/title>/);
assert.match(get.body, /<h1>This route has been retired\.<\/h1>/);
assert.match(get.body, /Fenrua Labs Pty Ltd/);
assert.match(get.body, /<nav aria-label="Current Fenrua links">/);
assert.doesNotMatch(get.body, /legacy|presale|swap|staking|yield|wallet|market|investment|account|token|trading/i);
assert.doesNotMatch(get.body, /<(?:script|style|iframe|object|embed)\b|\son[a-z]+\s*=|javascript:/i);

const head = responseRecorder();
handler({ method: "HEAD" }, head);
assert.equal(head.statusCode, 410);
assert.equal(head.headers.get("cache-control"), RETIRED_ROUTE_CACHE_CONTROL);
assert.equal(head.headers.get("content-type"), get.headers.get("content-type"));
assert.equal(head.headers.get("x-robots-tag"), get.headers.get("x-robots-tag"));
assert.equal(head.body, "");

const post = responseRecorder();
handler({ method: "POST" }, post);
assert.equal(post.statusCode, 405);
assert.equal(post.headers.get("allow"), "GET, HEAD");
assert.equal(post.body, "");

const rewrites = new Map(vercel.rewrites.map(({ source, destination }) => [source, destination]));
for (const source of [
  "/nexus/:path*",
  "/explorer/:path*",
  "/fenpresale",
  "/fenswap",
  "/wallet",
  "/register",
  "/login",
  "/account",
  "/codex",
  "/labs",
  "/privacy",
  "/terms",
  "/cookies",
  "/manifest.webmanifest",
  "/v2",
  "/v2/:path*",
  "/api/nexus/:path*",
  "/api/explorer/:path*",
  "/api/internal/:path*",
]) {
  assert.equal(rewrites.get(source), "/api/legacy-gone", `${source} must resolve as HTTP 410.`);
}

const redirectMap = new Map(vercel.redirects.map(({ source, destination }) => [source, destination]));
const successorRedirects = [
  ["/nexus", "/architecture"],
  ["/nexus/fenchain", "/status"],
  ["/nexus/n521", "/research/pn521-cross-limb-borrow"],
  ["/nexus/protocol", "/architecture"],
  ["/nexus/trust", "/evidence"],
  ["/nexus/release", "/audit"],
  ["/nexus/audit", "/audit"],
  ["/nexus/monitoring", "/status"],
  ["/about", "/company"],
  ["/brief", "/"],
  ["/contact", "/support"],
  ["/explorer", "/status"],
  ["/explorer/c978", "/status"],
  ["/explorer/n521", "/status"],
  ["/security.txt", "/.well-known/security.txt"],
  ["/docs/archive/2026-07-13/SECURITY_AUDIT_LOG.md", "/audit"],
  ["/docs/archive/2026-07-13/audit-report.json", "/audit"],
  ["/docs/archive/2026-07-13/FENRUA_CURRENT_LIVE_REAUDIT_2026-07-13.md", "/audit"],
  ["/docs/archive/2026-07-13/FENRUA_FINAL_IMPLEMENTATION_REPORT.md", "/audit"],
  ["/docs/archive/2026-07-13/FENRUA_LAYER0_WEBSITE_IMPLEMENTATION_REPORT.md", "/audit"],
  ["/docs/archive/2026-07-13/FENRUA_V2_EVIDENCE_RECONCILIATION.md", "/audit"],
  ["/docs/archive/2026-07-13/FENRUA_V2_FINAL_AUDIT_GATE.md", "/audit"],
  ["/docs/archive/2026-07-13/FENRUA_V2_REMAINING_LIMITATIONS.md", "/audit"],
  ["/docs/archive/2026-07-13/FENRUA_V2_ROADMAP_TO_TRUE_10.md", "/audit"],
  ["/docs/archive/2026-07-13/FENRUA_V2_ARCHITECTURE_REPORT.md", "/architecture"],
  ["/docs/archive/2026-07-13/FENRUA_V2_ACCESSIBILITY_REPORT.md", "/accessibility"],
  ["/docs/archive/2026-07-13/FENRUA_V2_UX_REPORT.md", "/accessibility"],
];
for (const [source, destination] of successorRedirects) {
  assert.equal(redirectMap.get(source), destination, `${source} must permanently consolidate to ${destination}.`);
  assert.equal(
    vercel.redirects.find((entry) => entry.source === source)?.permanent,
    true,
    `${source} consolidation must be permanent.`,
  );
}

for (const source of ["/fenpresale", "/fenswap", "/wallet", "/privacy", "/terms"]) {
  assert.equal(redirectMap.has(source), false, `${source} has no honest current successor and must not redirect.`);
}

for (const legacy of ["nexus", "explorer", "fenpresale", "fenswap", "wallet", "register", "login", "account", "v2"]) {
  assert.doesNotMatch(sitemap, new RegExp(`<loc>[^<]*/${legacy}(?:/|<)`), `Sitemap must exclude ${legacy}.`);
}

const retiredRecord = {
  state: "gone",
  expectedStatus: 410,
  contentType: "text/html",
};
const retiredHeaders = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": RETIRED_ROUTE_CACHE_CONTROL,
  "x-robots-tag": RETIRED_ROUTE_ROBOTS,
};
const retiredHtml = "<!doctype html><html><body><h1>This route has been retired.</h1><p>Fenrua BlackBox Protocol · Fenrua Labs Pty Ltd</p></body></html>";
const cleanResponse = new Response(retiredHtml, { status: 410, headers: retiredHeaders });
assert.deepEqual(
  routeAssertions(retiredRecord, "https://fenrua.ai/retired", cleanResponse, Buffer.from(retiredHtml), new Response(null, { status: 410, headers: retiredHeaders }), Buffer.alloc(0)),
  [],
  "A controlled retirement response must satisfy the live route contract.",
);
const injectedHtml = `${retiredHtml}<script src="https://unapproved.example.invalid/beacon.js?token=synthetic"></script>`;
const injectedResponse = new Response(injectedHtml, { status: 410, headers: retiredHeaders });
assert.deepEqual(
  routeAssertions(retiredRecord, "https://fenrua.ai/retired", injectedResponse, Buffer.from(injectedHtml), new Response(null, { status: 410, headers: retiredHeaders }), Buffer.alloc(0)),
  ["Retired route body contains an unapproved external script."],
  "A third-party injected script must fail the retirement contract without being mistaken for visible route copy.",
);
const whitespaceClosedInjectedHtml = `${retiredHtml}<script src="https://unapproved.example.invalid/beacon.js?token=synthetic"></script\t\n data-boundary>`;
const whitespaceClosedInjectedResponse = new Response(whitespaceClosedInjectedHtml, { status: 410, headers: retiredHeaders });
assert.deepEqual(
  routeAssertions(retiredRecord, "https://fenrua.ai/retired", whitespaceClosedInjectedResponse, Buffer.from(whitespaceClosedInjectedHtml), new Response(null, { status: 410, headers: retiredHeaders }), Buffer.alloc(0)),
  ["Retired route body contains an unapproved external script."],
  "A whitespace-formatted script close must not make injected content appear as visible copy.",
);
assert.match(robots, /User-agent: \*\nAllow: \//, "Retired URLs must remain crawlable so removal responses can be observed.");
assert.doesNotMatch(robots, /Disallow:\s*\/(?:nexus|explorer|v2)/i, "robots.txt must not hide retirement responses.");

console.log(JSON.stringify({ status: "ok", scope: "legacy-index-retirement", goneRules: rewrites.size }));
