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
  "fenpresale/index.html",
  "fenswap/index.html",
  "kernel/index.html",
  "legal/index.html",
  "nexus/index.html",
  "privacy/index.html",
  "research/index.html",
  "research/pn521-cross-limb-borrow/index.html",
  "research/read-only-chain-observation/index.html",
  "research/toolchain-evidence-lock/index.html",
  "security/index.html",
  "status/index.html",
  "support/index.html",
  "terms/index.html",
  "toolchain/index.html",
  "utilities/index.html",
  "verify/index.html",
  "wallet/index.html",
];
const mobileRailSha256 = "79a569fb745a18fc29fe8bb55451e46afcda285a4347724f28449741748d3fb7";

for (const route of routes) {
  const html = await readFile(new URL(`../${route}`, import.meta.url), "utf8");
  const railStart = html.indexOf('<div class="header-chain-rail mobile-chain-rail"');
  const headerEnd = html.indexOf("    </header>", railStart);
  assert.ok(railStart >= 0 && headerEnd > railStart, `${route} must include the mobile live-block rail.`);
  assert.equal(
    createHash("sha256").update(html.slice(railStart, headerEnd)).digest("hex"),
    mobileRailSha256,
    `${route} must reuse the frozen Overview mobile live-block markup.`,
  );
  const isOverview = route === "index.html";
  assert.match(
    html,
    isOverview ? /<header class="site-header site-header-live"/ : /<header class="site-header site-header-mobile-live"/,
    `${route} must use the Overview mobile-header layout without changing desktop headers.`,
  );
  assert.equal([...html.matchAll(/<script src="\/kernel-status\.js" defer><\/script>/g)].length, isOverview ? 1 : 0);
  assert.equal([...html.matchAll(/<script src="\/mobile-chain-status\.js" defer><\/script>/g)].length, isOverview ? 0 : 1);

  const cardCount = [...html.matchAll(/data-chain-card="/g)].length;
  assert.equal(cardCount, isOverview ? 4 : 2, `${route} must not add desktop live cards outside Overview.`);
  if (!isOverview) assert.doesNotMatch(html, /desktop-chain-progress/, `${route} must keep desktop live cards exclusive to Overview.`);
}

console.log(JSON.stringify({ status: "ok", scope: "mobile-live-block-extension", routes: routes.length }));
