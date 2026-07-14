import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
const tokens = JSON.parse(read("design/tokens.json"));
const generated = read("styles.tokens.css");
const styles = read("styles.css");

assert.equal(tokens.schemaVersion, "fenrua.design-tokens.v1");
for (const name of [
  "surface-0",
  "surface-1",
  "surface-2",
  "line-subtle",
  "line-strong",
  "text-primary",
  "text-secondary",
  "text-muted",
  "signal-info",
  "signal-pass",
  "signal-warn",
  "signal-fail",
  "signal-paused",
  "font-mono",
  "content-max",
  "radius-sm",
  "radius-md",
  "radius-lg",
]) {
  assert.equal(typeof tokens.tokens[name], "string", `Missing canonical token: ${name}`);
  assert.match(generated, new RegExp(`--${name}:`), `Generated CSS must expose ${name}.`);
}

for (const document of [
  "design/components.md",
  "design/content-guidelines.md",
  "design/status-semantics.md",
  "design/diagram-standard.md",
]) {
  assert.match(read(document), /Status: Active public-interface/i, `${document} must remain versioned public-system documentation.`);
}

assert.match(styles, /^@import url\("\/styles\.tokens\.css"\);/, "Authored styles must import the generated token surface first.");
assert.doesNotMatch(styles, /linear-gradient|@keyframes|animation:\s*[^;]*(?:infinite|live-|sweep|pulse)/, "The public design must not use decorative gradients or status animation.");
assert.doesNotMatch(styles, /font-size:\s*15px/, "The public body typography must retain a 16px minimum.");
assert.doesNotMatch(styles, /clamp\(/, "Display text must use stable breakpoint sizing rather than viewport-scaled text.");
assert.doesNotMatch(styles, /border-radius:\s*(?:8px|999px)/, "Public components must use the restrained token radius scale.");
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/, "Reduced-motion behavior must remain supported.");
assert.match(styles, /@media \(forced-colors: active\)/, "Forced-colours behavior must remain supported.");
assert.match(styles, /width: min\(var\(--max\), calc\(100% - 2rem\)\)/, "The canonical 1440px content constraint must be used by the page shell.");

console.log(JSON.stringify({ status: "ok", scope: "industrial-design-system", tokens: Object.keys(tokens.tokens).length }));
