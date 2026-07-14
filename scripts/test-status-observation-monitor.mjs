import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [status, monitor] = await Promise.all([
  readFile(new URL("../status/index.html", import.meta.url), "utf8"),
  readFile(new URL("../status-monitor.js", import.meta.url), "utf8"),
]);

assert.match(status, /<script src="\/status-monitor\.js" defer><\/script>/, "Status must load its isolated public monitor.");
assert.doesNotMatch(status, /<script src="\/mobile-chain-status\.js" defer><\/script>/, "Status must not start a second public-observation poller.");
assert.doesNotMatch(status, /data-chain-card=/, "Status must use its monitor table rather than duplicate detailed observation cards.");
assert.match(status, /LIVE SIGNED OBSERVATIONS/, "Status must distinguish live observations from static release records.");
assert.match(status, /STATIC RELEASE RECORDS/, "Static records must be explicitly scoped as non-live.");
assert.match(status, /STATUS PLANE BOUNDARIES/, "Status must make its plane separation visible.");
assert.match(status, /data-status-monitor-row="978"/, "Status must render a Chain 978 monitor target.");
assert.match(status, /data-status-monitor-row="521"/, "Status must render a Chain N521 monitor target.");
assert.match(status, /Last signed observation/, "Live rows must label the true observation time.");
assert.match(status, /not an activation event or release-build time/i, "Status must not imply an activation event.");
assert.doesNotMatch(status, /data-relative-time=/, "Static release timestamps must not masquerade as live monitor updates.");
assert.doesNotMatch(status, /data-label="Timestamp"/, "Static release records must not expose a faux event-time column.");
assert.doesNotMatch(status, /Last successful check/, "Static records must not claim a per-record runtime check.");
assert.doesNotMatch(status, /2026-07-13T07:56:58Z/, "The shared release-input time must not be rendered as Status evidence.");

assert.match(monitor, /fetch\("\/api\/chain-progress"/, "The monitor may consume only the bounded public observation endpoint.");
assert.match(monitor, /cache: "no-store"/, "The monitor must request a current public response.");
assert.match(monitor, /function hydrateCompactCard\(chain, state\)/, "The validated status render must hydrate the compact intro cards.");
assert.match(monitor, /observation\.observed_at !== chain\.checkedAt/, "The monitor must bind the row time to the signed observation time.");
assert.match(monitor, /chain\.observationSequence !== observation\.sequence/, "The monitor must bind the displayed sequence to the signed observation.");
assert.match(monitor, /No current state is asserted/, "Unavailable monitor responses must fail closed.");
assert.match(monitor, /advanced in this browser session/, "Sequence progress must be scoped to the current browser session.");
assert.match(monitor, /highWater: new Map\(\)/, "The monitor must retain a browser-session high-water record per chain.");
assert.match(monitor, /candidate\.keyId !== previous\.keyId/, "An unannounced verification-key change must be rejected.");
assert.match(monitor, /isAcceptedKeyRotation/, "The monitor must evaluate server-validated key rotation bindings.");
assert.match(
  monitor,
  /rotation\.from_key_id === previous\.keyId[\s\S]{0,350}rotation\.from_sequence >= previous\.sequence/,
  "Rotation acceptance must bind the browser high-water key and a non-regressing bridge sequence."
);
assert.match(monitor, /authenticated key rotation accepted/, "A valid rotation must advance without a page reload.");
assert.match(monitor, /candidate\.sequence < previous\.sequence/, "A lower signed sequence must be rejected.");
assert.match(monitor, /candidate\.signature !== previous\.signature/, "Same-sequence equivocation must be rejected.");
assert.match(
  monitor,
  /candidate\.sequence === previous\.sequence[\s\S]{0,500}candidate\.observedAt !== previous\.observedAt/,
  "Same-sequence acceptance must require an identical signed observation time."
);
assert.match(
  monitor,
  /candidate\.sequence === previous\.sequence[\s\S]{0,500}candidate\.confirmedBlock !== previous\.confirmedBlock/,
  "Same-sequence acceptance must require an identical signed block payload."
);
assert.match(monitor, /Date\.parse\(candidate\.observedAt\) < Date\.parse\(previous\.observedAt\)/, "Observation-time rollback must be rejected.");
assert.match(monitor, /observation\.observed_block < previous\.confirmedBlock/, "Confirmed-block rollback must be rejected.");
for (const reason of [
  "verification-key change rejected",
  "signed sequence rollback rejected",
  "same-sequence equivocation rejected",
  "observation-time rollback rejected",
  "confirmed-block rollback rejected",
]) {
  assert.match(monitor, new RegExp(reason), `The monitor must expose the fail-closed reason: ${reason}.`);
}
assert.match(monitor, /browser-session high-water preserved/, "A rejected candidate must preserve the last accepted high-water record.");
assert.match(monitor, /state: "failure", sequence: null/, "A rejected candidate must be represented as a failure, never live or current.");
assert.doesNotMatch(monitor, /signed sequence[^\n]*reset/i, "Sequence rollback must never be presented as a benign reset.");
assert.doesNotMatch(monitor, /FENRUA_[A-Z_]+/, "The browser monitor must not read protected configuration.");
assert.doesNotMatch(monitor, /https?:\/\//, "The browser monitor must not contact an external or protected endpoint.");

console.log(JSON.stringify({ status: "ok", scope: "status-observation-monitor", chains: 2 }));
