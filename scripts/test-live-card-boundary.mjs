import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const boundaries = [
  {
    name: "header live block cards",
    start: '<div class="header-chain-rail mobile-chain-rail"',
    end: "    </header>",
    sha256: "79a569fb745a18fc29fe8bb55451e46afcda285a4347724f28449741748d3fb7",
  },
  {
    name: "desktop live block cards",
    start: '<section id="chain-progress"',
    end: '      <section class="section-shell" aria-labelledby="home-answers">',
    sha256: "a3e492f502426499e50d846c182b9fb9323e665ae5b13c5c4dea8588ed803f58",
  },
];

for (const boundary of boundaries) {
  const start = html.indexOf(boundary.start);
  const end = html.indexOf(boundary.end, start);
  assert.ok(start >= 0 && end > start, `${boundary.name} must remain present.`);
  const digest = createHash("sha256").update(html.slice(start, end)).digest("hex");
  assert.equal(digest, boundary.sha256, `${boundary.name} is a frozen public boundary.`);
}

console.log(JSON.stringify({ status: "ok", scope: "frozen-live-card-boundary", boundaries: boundaries.length }));
