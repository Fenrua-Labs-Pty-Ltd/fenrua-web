import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(resolve(root, relativePath), "utf8");
const evidence = JSON.parse(read("data/site-evidence.json"));
const register = JSON.parse(read("data/public-document-register.json"));
const vercel = JSON.parse(read("vercel.json"));

assert.equal(evidence.schemaVersion, "fenrua.site-evidence.v1");
assert.ok(Array.isArray(evidence.commercialBoundary?.paragraphs) && evidence.commercialBoundary.paragraphs.length === 3);
assert.match(evidence.commercialBoundary.paragraphs.join(" "), /tiered service subscriptions and client-specific business agreements only/i);
assert.match(evidence.commercialBoundary.paragraphs.join(" "), /does not offer investments, token crowdfunding, securities/i);
assert.match(evidence.commercialBoundary.paragraphs.join(" "), /does not operate a market, exchange, order book, trading venue, or public swap product/i);

assert.equal(register.schemaVersion, "fenrua.public-document-register.v1");
for (const record of register.records) {
  assert.ok(["active", "archived", "superseded"].includes(record.status), `Unexpected document status for ${record.id}.`);
  assert.ok(existsSync(resolve(root, record.path)), `Registered document is missing: ${record.path}`);
  if (record.formerPath) {
    assert.ok(!existsSync(resolve(root, record.formerPath)), `Superseded source file must be removed: ${record.formerPath}`);
  }
}

const archiveHeader = vercel.headers.find((entry) => entry.source === "/docs/archive/(.*)");
assert.ok(archiveHeader?.headers.some((header) => header.key === "X-Robots-Tag" && header.value === "noindex, nofollow, noarchive"));
const wwwRedirect = vercel.redirects.find((entry) => entry.destination === "https://fenrua.ai/$1");
assert.equal(wwwRedirect?.source, "/(.*)");
assert.equal(wwwRedirect?.permanent, true);
assert.deepEqual(wwwRedirect?.has, [{ type: "header", key: "host", value: "www\\.fenrua\\.ai" }]);
for (const record of register.records.filter((record) => record.formerPath)) {
  const redirect = vercel.redirects.find((entry) => entry.source === `/${record.formerPath}`);
  assert.equal(redirect?.destination, `/${record.path}`, `Former document must redirect to archive: ${record.formerPath}`);
  assert.equal(redirect?.permanent, true, `Former document redirect must be permanent: ${record.formerPath}`);
}
for (const record of register.records.filter((record) => record.status !== "active")) {
  assert.match(record.path, /^docs\/archive\/2026-07-13\//, `Archived record must be stored under the cutover archive: ${record.id}`);
  assert.match(read(record.path), /\b(?:archived|superseded)\b/i, `Archive notice must state its status: ${record.id}`);
}

const sitemap = read("sitemap.xml");
assert.doesNotMatch(sitemap, /docs\/archive\//, "Archived records must not be discoverable through the sitemap.");

const securityReview = read("docs/FENRUA_V2_SECURITY_REVIEW.md");
assert.doesNotMatch(securityReview, /contract evidence refresh/i);
assert.match(securityReview, /No public contract, token, investment, exchange, trading, or financial-return product is offered or claimed\./);

const audit = read("audit/index.html");
assert.match(audit, /Fenrua Labs Pty Ltd — access-only services/);
assert.match(audit, /does not offer investments, token crowdfunding, securities/i);
assert.match(audit, /does not operate a market, exchange, order book, trading venue, or public swap product/i);
assert.match(audit, /does not attest to dynamic observations, live block-card data, or protected systems/i);

console.log(JSON.stringify({ status: "ok", scope: "access-only-boundary-and-archive-policy", documents: register.records.length }));
