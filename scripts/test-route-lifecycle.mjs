import assert from "node:assert/strict";
import handler from "../api/legacy-gone.js";
import { checkRouteLifecycle, sourcePatternMatches } from "./route-lifecycle-lib.mjs";

assert.deepEqual(checkRouteLifecycle().status, "ok");
assert.equal(sourcePatternMatches("/nexus/:path*", "/nexus/retired"), true);
assert.equal(sourcePatternMatches("/nexus/:path*", "/nexus"), false);
assert.equal(sourcePatternMatches("/(.*)", "/any/current/path"), true);
assert.equal(sourcePatternMatches("/v2/:path*", "/verify"), false);

function responseRecorder() {
  return {
    headers: new Map(),
    statusCode: null,
    body: null,
    setHeader(name, value) { this.headers.set(name.toLowerCase(), value); },
    status(value) { this.statusCode = value; return this; },
    end(value = "") { this.body = value; return this; },
  };
}

const get = responseRecorder();
handler({ method: "GET" }, get);
assert.equal(get.statusCode, 410);
assert.equal(get.headers.get("cache-control"), "no-store, max-age=0");
assert.equal(get.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
assert.match(get.body, /This route has been retired\./);

const head = responseRecorder();
handler({ method: "HEAD" }, head);
assert.equal(head.statusCode, get.statusCode);
assert.equal(head.headers.get("content-type"), get.headers.get("content-type"));
assert.equal(head.headers.get("cache-control"), get.headers.get("cache-control"));
assert.equal(head.body, "");

const unsupported = responseRecorder();
handler({ method: "POST" }, unsupported);
assert.equal(unsupported.statusCode, 405);
assert.equal(unsupported.headers.get("allow"), "GET, HEAD");

console.log(JSON.stringify({ status: "ok", scope: "route-lifecycle", records: checkRouteLifecycle().records }));
