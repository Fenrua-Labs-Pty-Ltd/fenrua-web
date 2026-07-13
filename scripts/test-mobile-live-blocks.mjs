import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const routes = [
  "index.html",
  "accessibility/index.html",
  "architecture/index.html",
  "audit/index.html",
  "developers/index.html",
  "evidence/index.html",
  "kernel/index.html",
  "legal/index.html",
  "research/index.html",
  "research/pn521-cross-limb-borrow/index.html",
  "research/read-only-chain-observation/index.html",
  "research/toolchain-evidence-lock/index.html",
  "security/index.html",
  "status/index.html",
  "support/index.html",
  "toolchain/index.html",
  "utilities/index.html",
  "verify/index.html",
];
const mobileRailSha256 = {
  withoutAnnouncer: "9bfc88ca41ebd4e5e07163eda320c7f3fa3ce0e904c8f4778029d269ac260d78",
  withAnnouncer: "a42178d905ac7f21db729e23a7f0dd8f2dce5b314175911e4503f14113eaeed7",
};

for (const route of routes) {
  const html = await readFile(new URL(`../${route}`, import.meta.url), "utf8");
  assert.equal(
    [...html.matchAll(/<span>Swipe left for more<\/span>/g)].length,
    1,
    `${route} must expose one mobile navigation overflow cue.`,
  );
  const railStart = html.indexOf('<div class="header-chain-rail mobile-chain-rail"');
  const headerEnd = html.indexOf("    </header>", railStart);
  assert.ok(railStart >= 0 && headerEnd > railStart, `${route} must include the mobile live-block rail.`);
  const rail = html.slice(railStart, headerEnd);
  const ownsAnnouncer = route !== "index.html" && route !== "status/index.html";
  assert.equal(
    createHash("sha256").update(rail).digest("hex"),
    ownsAnnouncer ? mobileRailSha256.withAnnouncer : mobileRailSha256.withoutAnnouncer,
    `${route} must reuse the frozen Overview mobile live-block markup.`,
  );
  assert.doesNotMatch(
    rail,
    /data-chain-field="(?:978|521)-confidence"/,
    `${route} compact live-block cards must not duplicate the detailed Confidence field.`,
  );
  const isOverview = route === "index.html";
  const isStatus = route === "status/index.html";
  assert.match(
    html,
    isOverview ? /<header class="site-header site-header-live"/ : /<header class="site-header site-header-mobile-live"/,
    `${route} must use the Overview mobile-header layout without changing desktop headers.`,
  );
  assert.equal([...html.matchAll(/<script src="\/kernel-status\.js" defer><\/script>/g)].length, isOverview ? 1 : 0);
  assert.equal(
    [...html.matchAll(/<script src="\/mobile-chain-status\.js" defer><\/script>/g)].length,
    isOverview || isStatus ? 0 : 1,
  );

  const cardCount = [...html.matchAll(/data-chain-card="/g)].length;
  assert.equal(cardCount, 4, `${route} must expose exactly one responsive pair and one desktop pair.`);
  if (!isOverview) {
    assert.match(html, /class="route-hero-chain-rail"/, `${route} must place the compact desktop pair in its intro card.`);
    assert.doesNotMatch(html, /desktop-chain-progress/, `${route} must use compact rather than detailed cards in its intro.`);
  }
}

console.log(JSON.stringify({ status: "ok", scope: "mobile-live-block-extension", routes: routes.length }));
