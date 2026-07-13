import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [styles, status, evidence, verify, technicalData] = await Promise.all([
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../status/index.html", import.meta.url), "utf8"),
  readFile(new URL("../evidence/index.html", import.meta.url), "utf8"),
  readFile(new URL("../verify/index.html", import.meta.url), "utf8"),
  readFile(new URL("../technical-data.js", import.meta.url), "utf8"),
]);

assert.match(styles, /main > section:not\(#chain-progress\)\s*\{\s*--dim: #7d8581;/, "Static content must use the AA dim token.");
assert.match(styles, /\.state-grid\s*\{\s*grid-template-columns: repeat\(auto-fit, minmax\(15rem, 1fr\)\);/, "Status needs an independent responsive grid.");
assert.match(styles, /\.toolchain-summary:not\(\.state-grid\)\s*\{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/, "Toolchain must keep tablet columns.");
assert.match(styles, /\.evidence-table td:nth-child\(3\),\s*\.evidence-table td:nth-child\(5\)\s*\{\s*min-width: 0;/, "Mobile evidence hash cells must reset desktop min-width.");
assert.match(styles, /@media \(forced-colors: active\)/, "Static pages need forced-colors support.");
assert.match(styles, /\.site-header-live,\s*\.site-header-mobile-live/, "Mobile header rails must use the Overview layout without changing desktop headers.");
assert.match(styles, /\.registry\[tabindex\]:focus-visible/, "Scrollable table regions need visible keyboard focus.");
assert.match(status, /<script src="\/technical-data\.js" defer><\/script>/, "Status must use the allowed external script.");
assert.doesNotMatch(status, /<script>\s*\(\(\) =>/, "Status must not ship a CSP-blocked inline script.");
assert.match(status, /data-relative-time=/, "Status must retain relative-time targets.");
assert.match(technicalData, /function bindRelativeTimes\(\)/, "The external script must update relative time.");
assert.match(evidence, /data-label="Hash"/, "Evidence must preserve mobile record labels.");
assert.match(verify, /role="region" tabindex="0" aria-label="Data table"/, "Verify's table must remain keyboard-focusable.");

console.log(JSON.stringify({ status: "ok", scope: "non-live-visual-contracts" }));
