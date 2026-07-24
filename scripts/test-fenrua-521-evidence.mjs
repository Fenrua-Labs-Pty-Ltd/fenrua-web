import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { publicArtifactFiles } from "./public-output-lib.mjs";

const [readerSource, routeHtml, vercelSource] = await Promise.all([
  readFile(new URL("../fenrua-521-evidence.js", import.meta.url), "utf8"),
  readFile(new URL("../fenrua-521/index.html", import.meta.url), "utf8"),
  readFile(new URL("../vercel.json", import.meta.url), "utf8"),
]);
const vercel = JSON.parse(vercelSource);

assert.ok(publicArtifactFiles().includes("fenrua-521-evidence.js"), "The public output must include the Fenrua-521 reader.");
assert.ok(publicArtifactFiles().includes("fenrua-521/index.html"), "The public output must include the Fenrua-521 route.");
assert.match(routeHtml, /data-fenrua-521-releases/, "The route must retain its server-rendered release region.");
assert.match(routeHtml, /fenrua-521-evidence\.js/, "The route must load the bounded public source reader.");
assert.match(routeHtml, /Public evidence is not private execution/, "The route must state its public/private boundary.");
assert.match(readerSource, /Fenrua-Labs-Pty-Ltd\/fenrua-521-public-evidence/, "The reader must be pinned to the approved public evidence repository.");
assert.match(readerSource, /fenrua-521-public-evidence\/v1/, "The reader must require the public manifest schema.");
assert.match(readerSource, /build_state !== "VERIFIED"/, "The reader must reject non-VERIFIED manifests.");
assert.match(readerSource, /10 \* 60 \* 1000/, "The reader must use the approved ten-minute refresh window.");
assert.match(readerSource, /api\.github\.com/, "The reader must list only the public repository release directory.");
assert.match(readerSource, /raw\.githubusercontent\.com/, "The reader must fetch only public manifest files from the approved repository.");
assert.doesNotMatch(readerSource, /\bAuthorization\b/i, "The reader must not send credentials.");
assert.doesNotMatch(readerSource, /localStorage|sessionStorage|document\.cookie/i, "The reader must not persist or read browser credentials.");
assert.match(readerSource, /catch \{\s*setStatus\("Public source refresh is unavailable/, "The reader must fail closed without diagnostics.");

const csp = vercel.headers.find((entry) => entry.source === "/(.*)")?.headers.find((header) => header.key === "Content-Security-Policy")?.value ?? "";
assert.match(csp, /connect-src 'self' https:\/\/api\.github\.com https:\/\/raw\.githubusercontent\.com/, "CSP must allow only the approved public evidence source hosts.");

console.log(JSON.stringify({ status: "ok", scope: "fenrua-521-public-evidence-reader" }));
