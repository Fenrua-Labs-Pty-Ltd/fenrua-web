import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [styles, status, statusMonitor, evidence, verify, technicalData] = await Promise.all([
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../status/index.html", import.meta.url), "utf8"),
  readFile(new URL("../status-monitor.js", import.meta.url), "utf8"),
  readFile(new URL("../evidence/index.html", import.meta.url), "utf8"),
  readFile(new URL("../verify/index.html", import.meta.url), "utf8"),
  readFile(new URL("../technical-data.js", import.meta.url), "utf8"),
]);

assert.match(styles, /main > section:not\(#chain-progress\)\s*\{\s*--dim: #7d8581;/, "Static content must use the AA dim token.");
assert.match(styles, /\.state-grid\s*\{\s*grid-template-columns: repeat\(auto-fit, minmax\(15rem, 1fr\)\);/, "Status needs an independent responsive grid.");
assert.match(styles, /\.toolchain-summary:not\(\.state-grid\)\s*\{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/, "Toolchain must keep tablet columns.");
assert.match(styles, /\.evidence-table td:nth-child\(3\),\s*\.evidence-table td:nth-child\(5\)\s*\{\s*min-width: 0;/, "Mobile evidence hash cells must reset desktop min-width.");
assert.match(styles, /\.status-monitor-table td:nth-child\(8\)\s*\{\s*min-width: 0;/, "Mobile status-monitor limitation cells must reset their desktop min-width.");
assert.match(styles, /\.static-release-table table\s*\{\s*table-layout: fixed;\s*min-width: 68rem;/, "Static release columns must use a stable desktop layout without changing the live monitor table.");
assert.match(styles, /\.status-artifact-value\s*\{[\s\S]*?-webkit-line-clamp: 2;[\s\S]*?line-clamp: 2;/, "Long public-artifact values must be capped at two visible rows.");
assert.match(styles, /\.static-release-table th,\s*\.static-release-table td\s*\{\s*overflow-wrap: anywhere;\s*word-break: break-word;/, "Every static release column must wrap instead of widening the table.");
assert.match(styles, /@media \(forced-colors: active\)/, "Static pages need forced-colors support.");
assert.match(styles, /\.site-header-live,\s*\.site-header-mobile-live/, "Mobile header rails must use the Overview layout without changing desktop headers.");
assert.match(styles, /@media \(min-width: 901px\)\s*\{\s*\.site-header-live,\s*\.site-header-mobile-live\s*\{\s*display: flex;\s*align-items: center;\s*justify-content: space-between;/, "Every desktop route must share the compact Overview header geometry.");
assert.match(styles, /\.site-header-mobile-live \.brand\s*\{\s*grid-area: brand;/, "Non-Overview mobile headers must place the brand in Overview's top grid row.");
assert.match(styles, /\.site-header-mobile-live \.site-nav\s*\{\s*grid-area: nav;/, "Non-Overview mobile headers must place navigation in the unified header grid.");
assert.match(styles, /--font-ui: system-ui,[\s\S]*?--font-mono:/, "The public surface must define separate UI and technical font stacks.");
assert.match(styles, /body\s*\{[\s\S]*?font-family: var\(--font-mono\);/, "Public prose must retain the founder-approved mono typography without a remote font dependency.");
assert.doesNotMatch(styles, /font-family: var\(--font-ui\);/, "No public selector may override the founder-approved mono typography.");
assert.match(styles, /h1,\s*h2,\s*h3,\s*\.brand strong\s*\{\s*font-family: var\(--font-mono\);\s*letter-spacing: normal;/, "Headings and the brand must retain the approved mono family without compressed tracking.");
assert.match(styles, /\.button\s*\{[\s\S]*?font-family: var\(--font-mono\);/, "Buttons must remain typographically unified with the public surface.");
assert.match(styles, /code,\s*pre,\s*kbd,\s*samp\s*\{\s*font-family: var\(--font-mono\);/, "Code and technical text must retain the mono stack.");
assert.match(styles, /\.route-hero-copy > \.eyebrow,\s*\.route-hero-copy > h1,\s*\.route-hero-copy > p:not\(\.eyebrow\)\s*\{\s*margin: 0;/, "Intro-card grid spacing must not be doubled by child margins.");
assert.match(styles, /\.route-hero\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) minmax\(15rem, 0\.42fr\);/, "Desktop intro cards must reserve a compact right-side observation column.");
assert.match(styles, /\.route-hero h1\s*\{\s*max-width: 28ch;/, "Mono intro headings must preserve the compact two-line desktop geometry.");
assert.match(styles, /@media \(max-width: 900px\)[\s\S]*?\.route-hero-chain-rail\s*\{\s*display: none;/, "The desktop intro observation copy must not duplicate the mobile header cards.");
assert.match(styles, /\.site-header-live \.site-nav,\s*\.site-header-mobile-live \.site-nav\s*\{[\s\S]*?flex-wrap: nowrap;[\s\S]*?overflow-x: auto;/, "Mobile navigation must remain a single keyboard-scrollable row.");
assert.match(styles, /\.site-header-live \.site-nav,\s*\.site-header-mobile-live \.site-nav\s*\{[\s\S]*?scroll-padding-inline: 1rem;/, "Mobile navigation must fully reveal the terminal Legal item on keyboard focus.");
assert.match(styles, /\.site-header-live \.site-nav a,\s*\.site-header-mobile-live \.site-nav a\s*\{[\s\S]*?min-height: 2\.75rem;/, "Mobile navigation targets must remain at least 44 CSS pixels high.");
assert.match(styles, /\.site-header-live \.mobile-nav-hint,\s*\.site-header-mobile-live \.mobile-nav-hint\s*\{[\s\S]*?grid-area: hint;[\s\S]*?display: flex;/, "Mobile navigation must expose its horizontal overflow cue below the controls.");
assert.match(styles, /@keyframes mobile-nav-swipe-cue/, "The mobile overflow cue must visually indicate the swipe direction.");
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.mobile-nav-hint-track > i\s*\{[\s\S]*?animation: none;/, "The mobile overflow cue must respect reduced-motion preferences.");
assert.match(styles, /\.desktop-chain-progress\s*\{\s*--dim: #7f8984;\s*display: none;/, "Detailed live-card labels must use the AA contrast token with rendering margin.");
assert.match(styles, /\.registry\[tabindex\]:focus-visible/, "Scrollable table regions need visible keyboard focus.");
assert.match(styles, /\.constraint-list code\s*\{\s*white-space: normal;\s*overflow-wrap: anywhere;\s*word-break: break-word;/, "Audit hashes must wrap inside mobile constraint lists.");
assert.match(status, /<script src="\/technical-data\.js" defer><\/script>/, "Status must use the allowed external script.");
assert.match(status, /<script src="\/status-monitor\.js" defer><\/script>/, "Status must use the isolated public-monitor script.");
assert.doesNotMatch(status, /<script>\s*\(\(\) =>/, "Status must not ship a CSP-blocked inline script.");
assert.doesNotMatch(status, /data-relative-time=/, "Static release timestamps must not be represented as live updates.");
assert.match(statusMonitor, /Last signed observation|observed_at/, "The monitor must use signed-observation semantics.");
assert.match(statusMonitor, /function hydrateCompactCard\(chain, state\)/, "Status must mirror its already-validated render state into compact cards without another poller.");
assert.match(status, /<span class="status-artifact-value" title="[^"]+">[^<]+<\/span>/, "Static release artifacts must expose full text while using the two-row visual wrapper.");
assert.match(technicalData, /function bindRelativeTimes\(\)/, "The shared external script must preserve generic relative-time support.");
assert.match(evidence, /data-label="Hash"/, "Evidence must preserve mobile record labels.");
assert.match(verify, /role="region" tabindex="0" aria-label="Data table"/, "Verify's table must remain keyboard-focusable.");

console.log(JSON.stringify({ status: "ok", scope: "non-live-visual-contracts" }));
