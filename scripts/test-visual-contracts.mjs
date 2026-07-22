import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [tokens, generatedTokens, styles, overview, architecture, claims, status, statusMonitor, evidence, verify] = await Promise.all([
  readFile(new URL("../design/tokens.json", import.meta.url), "utf8"),
  readFile(new URL("../styles.tokens.css", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../architecture/index.html", import.meta.url), "utf8"),
  readFile(new URL("../trust/claims/index.html", import.meta.url), "utf8"),
  readFile(new URL("../status/index.html", import.meta.url), "utf8"),
  readFile(new URL("../status-monitor.js", import.meta.url), "utf8"),
  readFile(new URL("../evidence/index.html", import.meta.url), "utf8"),
  readFile(new URL("../verify/index.html", import.meta.url), "utf8"),
]);

const designTokens = JSON.parse(tokens);
assert.equal(designTokens.schemaVersion, "fenrua.design-tokens.v1", "The public design system must use the versioned token schema.");
assert.match(generatedTokens, /--surface-0: #080a0b;/, "Generated tokens must retain the canonical base surface.");
assert.match(styles, /^@import url\("\/styles\.tokens\.css"\);/, "Authored CSS must load the generated token surface first.");
assert.match(styles, /main > section:not\(#chain-progress\)\s*\{\s*--dim: var\(--text-muted\);/, "Static content must use the semantic muted token.");
assert.match(styles, /\.status-band\s*\{\s*--dim: var\(--text-secondary\);/, "Overview status labels must meet the accessibility contrast budget.");
assert.doesNotMatch(styles, /linear-gradient|@keyframes/, "The industrial public style must not contain decorative gradients or status animation.");
assert.doesNotMatch(styles, /font-size:\s*15px|clamp\(/, "The public style must retain a fixed 16px minimum and stable display sizing.");
assert.match(styles, /@media \(forced-colors: active\)/, "Static pages need forced-colors support.");
assert.match(styles, /body :is\(a, button, input, select, textarea, summary, \[tabindex\]\):focus-visible/, "Interactive elements need a consistent visible focus indicator.");
assert.match(styles, /\.site-header \.site-nav\s*\{\s*display: grid;\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/, "Mobile navigation must expose all seven categories without horizontal discovery.");
assert.match(styles, /\.site-header \.site-nav a\s*\{\s*justify-content: center;\s*min-height: 2\.75rem;/, "Mobile category controls must be centered and at least 44 CSS pixels high.");
assert.doesNotMatch(styles, /site-header-mobile-live|mobile-nav-hint|mobile-nav-swipe-cue/, "The public mobile navigation must not rely on a hidden swipe cue.");
assert.doesNotMatch(styles, /\.site-header \.site-nav\s*\{[^}]*overflow-x:/, "The public mobile navigation must not rely on horizontal scrolling.");
assert.match(styles, /\.breadcrumb-nav\s*\{/, "Visible breadcrumb navigation must have a dedicated layout contract.");
assert.match(styles, /\.section-nav\s*\{/, "Visible section navigation must have a dedicated layout contract.");
assert.match(styles, /\.architecture-diagram\s*\{/, "Semantic architecture views must have a stable diagram layout.");
assert.match(styles, /\.capability-record,\s*\.claim-record,\s*\.evidence-class-card/, "Model records must use stable individual record surfaces.");
assert.match(styles, /\.capability-card\[data-capability-availability="not-available"\]/, "Unavailable capabilities need an explicit neutral record surface.");
assert.match(styles, /\.capability-card\[data-capability-availability="not-available"\] > span\s*\{\s*color: var\(--text-muted\);/, "Planned capability state must not receive a success colour.");
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/, "The site must respect reduced-motion preferences.");

assert.match(overview, /class="site-header site-header-live"/, "Overview may retain the dedicated compact observation header.");
assert.match(overview, /class="section-shell chain-progress desktop-chain-progress"/, "Overview must retain desktop observation cards under its intro card.");
assert.match(styles, /\.home-intro,\s*\.trust-intro\s*\{\s*display: grid;\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/, "Homepage and Trust must use equal desktop introduction cards.");
assert.doesNotMatch(architecture, /data-chain-card=/, "Architecture must not repeat live cards in unrelated route content.");
assert.match(architecture, /class="breadcrumb-nav"/, "Architecture must expose visible breadcrumbs.");
assert.match(architecture, /class="section-nav"/, "Architecture must expose section navigation.");
assert.match(claims, /data-claim-filter/, "Claims must expose the local filter control.");
assert.match(claims, /data-claim-record/, "Claims must remain server-rendered before filtering.");

assert.match(status, /<script src="\/status-monitor\.js" defer><\/script>/, "Status must use the isolated public-monitor script.");
assert.doesNotMatch(status, /<script>\s*\(\(\) =>/, "Status must not ship a CSP-blocked inline script.");
assert.doesNotMatch(status, /data-relative-time=/, "Static release timestamps must not be represented as live updates.");
assert.match(statusMonitor, /Last signed observation|observed_at/, "The monitor must use signed-observation semantics.");
assert.match(statusMonitor, /function hydrateCompactCard\(chain, state\)/, "Status must mirror a validated state without another poller.");
assert.match(evidence, /data-label="Hash"/, "Evidence must preserve mobile record labels.");
assert.match(verify, /role="region" tabindex="0" aria-label="Data table"/, "Verify's table must remain keyboard-focusable.");

console.log(JSON.stringify({ status: "ok", scope: "information-architecture-and-visual-contracts" }));
