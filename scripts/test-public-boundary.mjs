import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(resolve(root, relativePath), "utf8");
const evidence = JSON.parse(read("data/site-evidence.json"));
const company = JSON.parse(read("data/company-identity.json"));
const register = JSON.parse(read("data/public-document-register.json"));
const vercel = JSON.parse(read("vercel.json"));

assert.equal(evidence.schemaVersion, "fenrua.site-evidence.v1");
assert.deepEqual(evidence.commercialBoundary?.paragraphs, [
  "Fenrua Labs Pty Ltd researches, develops, and provides privacy-preserving protocol infrastructure for verifiable AI automation and related technology services through service subscriptions and client-specific business agreements. Its work may include software, infrastructure access, hosting, research, development, integration, technical support, and evidence-aware workflows within the scope of the relevant service or agreement.",
  "Fenrua Labs Pty Ltd does not offer investments, token crowdfunding, securities, bonds, equity, debt, managed investment interests, profit-sharing arrangements, revenue-sharing arrangements, yield products, exchange products, trading products, or any financial-return scheme. Neither a subscription nor a client-specific business agreement gives, promises, expects, entitles, or represents profit, return, token appreciation, token allocation, liquidity, resale value, dividends, buyback rights, or ownership in Fenrua Labs Pty Ltd.",
  "Fenrua Labs Pty Ltd does not operate a market, exchange, order book, trading venue, or public swap product. It does not provide financial, investment, legal, or tax advice, or recommend that a person buy, sell, hold, trade, or rely on an asset for financial gain.",
]);
assert.match(evidence.commercialBoundary.paragraphs.join(" "), /does not offer investments, token crowdfunding, securities/i);
assert.match(evidence.commercialBoundary.paragraphs.join(" "), /does not operate a market, exchange, order book, trading venue, or public swap product/i);
assert.match(evidence.commercialBoundary.serviceAgreementBoundary.join(" "), /issue invoices, receive payment, and carry out the research/i);
assert.match(evidence.commercialBoundary.businessOperationsBoundary.join(" "), /may receive payment for its lawful business activities/i);
assert.equal("paymentBoundary" in evidence.commercialBoundary, false);
assert.equal("communityBoundary" in evidence.commercialBoundary, false);
assert.equal(evidence.legalOperatingRecord?.offerings?.length, 7);
assert.deepEqual(
  [...new Set(evidence.legalOperatingRecord.offerings.map((record) => record.status))].sort(),
  [
    "AVAILABLE BY AGREEMENT",
    "AVAILABLE BY OFFER",
    "CURRENT PUBLIC",
    "NOT OFFERED",
    "NOT PART OF THE CURRENT PUBLIC SITE",
    "RESEARCH / EVIDENCE",
  ],
);
assert.match(evidence.legalOperatingRecord.technologyScope.join(" "), /privacy-preserving protocol-infrastructure direction for verifiable AI automation/i);
assert.match(evidence.legalOperatingRecord.technologyScope.join(" "), /business and technical scope includes research, development, software/i);
assert.equal(company.schemaVersion, "fenrua.company-identity.v1");
assert.equal(company.legalName, "FENRUA LABS PTY LTD");
assert.equal(company.abn, "62 700 182 663");
assert.equal(company.acn, "700 182 663");
assert.equal(company.gstStatus, "Registered from 2026-07-13");
assert.equal(company.publicContact, "partnerships@fenrua.ai");
assert.deepEqual(company.publicProfiles, [
  { provider: "github", label: "GitHub", url: "https://github.com/fenrualabs" },
  { provider: "x", label: "X", url: "https://x.com/FenruaLabs" },
  { provider: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/fenrua-labs-80b679388" },
  { provider: "youtube", label: "YouTube", url: "https://www.youtube.com/@FenruaLabs" },
]);
assert.equal(company.publicProfilesVerifiedAt, "2026-07-22");

assert.equal(register.schemaVersion, "fenrua.public-document-register.v1");
for (const record of register.records) {
  assert.ok(["active", "archived", "superseded"].includes(record.status), `Unexpected document status for ${record.id}.`);
  assert.ok(existsSync(resolve(root, record.path)), `Registered document is missing: ${record.path}`);
  if (record.artifactSha256) {
    const actual = createHash("sha256").update(readFileSync(resolve(root, record.path))).digest("hex");
    assert.equal(record.artifactSha256, actual, `Registered artifact hash is stale: ${record.path}`);
  }
  if (record.originalContentSha256) {
    assert.match(read(record.path), new RegExp(record.originalContentSha256), `Archive must bind the original content hash: ${record.path}`);
  }
  if (record.formerPath) {
    assert.ok(!existsSync(resolve(root, record.formerPath)), `Superseded source file must be removed: ${record.formerPath}`);
  }
}

const archiveHeader = vercel.headers.find((entry) => entry.source === "/docs/archive/(.*)");
assert.ok(archiveHeader?.headers.some((header) => header.key === "X-Robots-Tag" && header.value === "noindex, nofollow, noarchive"));
const globalHeaders = vercel.headers.find((entry) => entry.source === "/(.*)")?.headers ?? [];
const headerValue = (key) => globalHeaders.find((header) => header.key === key)?.value;
assert.equal(headerValue("Strict-Transport-Security"), "max-age=63072000");
assert.equal(headerValue("X-Frame-Options"), "DENY");
assert.equal(headerValue("Cross-Origin-Opener-Policy"), "same-origin");
assert.equal(headerValue("Cross-Origin-Resource-Policy"), "same-origin");
assert.match(headerValue("Content-Security-Policy"), /upgrade-insecure-requests/);
const wwwRedirect = vercel.redirects.find(
  (entry) => entry.destination === "https://fenrua.ai/$1" && entry.has?.[0]?.value === "www\\.fenrua\\.ai"
);
assert.equal(wwwRedirect?.source, "/(.*)");
assert.equal(wwwRedirect?.permanent, true);
assert.deepEqual(wwwRedirect?.has, [{ type: "header", key: "host", value: "www\\.fenrua\\.ai" }]);
const previewHostPattern = "(?:fenrua-web-[a-z0-9-]+|fenrua-[a-z0-9]+-fenrualabs-projects)\\.vercel\\.app";
const previewHeader = vercel.headers.find(
  (entry) => entry.has?.[0]?.type === "host" && entry.has[0].value === previewHostPattern,
);
assert.ok(previewHeader?.headers.some(
  (header) => header.key === "X-Robots-Tag" && header.value === "noindex, nofollow, noarchive",
));
const stableVercelAliasRedirect = vercel.redirects.find(
  (entry) => entry.has?.[0]?.value === "fenrua-web\\.vercel\\.app",
);
assert.equal(stableVercelAliasRedirect?.source, "/(.*)");
assert.equal(stableVercelAliasRedirect?.destination, "https://fenrua.ai/$1");
assert.equal(stableVercelAliasRedirect?.permanent, true);
assert.equal(
  vercel.redirects.some((entry) => entry.has?.[0]?.value === previewHostPattern),
  false,
  "Preview deployments must remain inspectable and must not redirect to production.",
);
assert.match(read(".vercelignore"), /(?:^|\n)\.vercel(?:\n|$)/, "Vercel CLI linkage metadata must never enter deployment input.");
for (const [source, destination] of [
  ["/nexus", "/architecture"],
  ["/nexus/fenchain", "/status"],
  ["/nexus/n521", "/research/pn521-cross-limb-borrow"],
  ["/nexus/trust", "/evidence"],
  ["/nexus/audit", "/audit"],
  ["/nexus/monitoring", "/status"],
  ["/explorer", "/status"],
  ["/explorer/c978", "/status"],
  ["/explorer/n521", "/status"],
]) {
  const redirect = vercel.redirects.find((entry) => entry.source === source);
  assert.equal(redirect?.destination, destination, `${source} must redirect to ${destination}.`);
  assert.equal(redirect?.permanent, true, `${source} redirect must be permanent.`);
}
for (const source of ["/fenswap", "/fenpresale", "/wallet", "/privacy", "/terms"]) {
  assert.equal(
    vercel.redirects.find((entry) => entry.source === source),
    undefined,
    `${source} has no honest successor and must not redirect to a current page.`,
  );
  const rewrite = vercel.rewrites.find((entry) => entry.source === source);
  assert.equal(rewrite?.destination, "/api/legacy-gone", `${source} must resolve through the HTTP 410 handler.`);
}
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

const reportPolicy = read("docs/EXTERNAL_ARTIFACT_POLICY.md");
assert.match(reportPolicy, /must be created and retained outside this source repository/i);
assert.match(reportPolicy, /must not be\s+committed, staged into the public output/i);

const audit = read("audit/index.html");
assert.match(audit, /access-only-commercial-boundary/);
assert.match(audit, /docs\/ACCESS_ONLY_COMMERCIAL_BOUNDARY\.md/);
assert.doesNotMatch(audit, /class="section-shell split-section commercial-boundary"/, "Audit must cite, not duplicate, the canonical full policy.");
assert.match(audit, /does not attest to dynamic observations, live block-card data, or protected systems/i);
assert.match(audit, /ABN 62 700 182 663/);

const legal = read("legal/index.html");
assert.match(legal, /Research and technology services/);
assert.match(legal, /Ordinary business activity/);
assert.match(legal, /Protocol infrastructure and related services/);
assert.match(legal, /may separately contract, invoice, receive payment, and deliver services through ordinary business arrangements/i);
assert.equal([...legal.matchAll(/<tr>/g)].length, 8, "Legal must render one header plus the approved seven offering rows.");
for (const status of ["CURRENT PUBLIC", "AVAILABLE BY OFFER", "AVAILABLE BY AGREEMENT", "RESEARCH \/ EVIDENCE", "NOT PART OF THE CURRENT PUBLIC SITE", "NOT OFFERED"]) {
  assert.match(legal, new RegExp(status));
}
assert.doesNotMatch(legal, /\b(?:XP|Fortnight League|Picker|community activity|bounded rewards|payment rails)\b/i);
assert.doesNotMatch(legal, /\b(?:compliance-owned gate|must be approved|compliance-approved)\b/i);
assert.doesNotMatch(legal, /Fenrua Protocol is (?:the|an) AI security/i);
assert.match(legal, /href="\/#commercial-boundary-title">Service boundary<\/a>/);
assert.equal([...legal.matchAll(/class="section-shell split-section commercial-boundary"/g)].length, 0);

const overview = read("index.html");
assert.match(overview, /Fenrua Labs Pty Ltd — Protocol Infrastructure and Technology Services/);
assert.match(overview, /privacy-preserving protocol infrastructure for verifiable AI automation and related technology services/i);
assert.match(overview, /Fenrua BlackBox Protocol/);
assert.match(overview, /Public evidence for private AI execution\./);
assert.match(overview, /Evidence Before Authority/);
assert.match(overview, /Capability is not authority/);
assert.doesNotMatch(overview, /AI efficiency infrastructure for verifiable systems/i);
assert.match(overview, /does not offer investments, token crowdfunding, securities/i);
assert.match(overview, /does not operate a market, exchange, order book, trading venue, or public swap product/i);
assert.equal([...overview.matchAll(/class="section-shell split-section commercial-boundary"/g)].length, 1);

console.log(JSON.stringify({ status: "ok", scope: "access-only-boundary-and-archive-policy", documents: register.records.length }));
