import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [operations, status, catalogue] = await Promise.all([
  readFile(new URL("../operations/index.html", import.meta.url), "utf8"),
  readFile(new URL("../status/index.html", import.meta.url), "utf8"),
  readFile(new URL("../data/public-service-catalogue.json", import.meta.url), "utf8"),
]);

const planes = [
  "Publication status",
  "Platform service health",
  "Dependency health",
  "Signed external observation status",
  "Security incident status",
  "Maintenance and change status",
];
for (const plane of planes) {
  assert.ok(operations.includes(plane), `Operations must distinguish ${plane}.`);
  assert.ok(status.includes(plane), `Status must distinguish ${plane}.`);
}

assert.match(operations, /SLO not yet defined/i);
assert.match(status, /does not publish uptime or an SLO/i);
assert.match(status, /LIVE SIGNED OBSERVATIONS/);
assert.match(status, /STATIC RELEASE RECORDS/);
assert.doesNotMatch(status, /data-chain-card=/, "Status must use monitor rows rather than duplicate observation cards.");
assert.doesNotMatch(`${operations}\n${status}`, /(?:99\.9%|99\.99%|uptime guarantee|public SLA)/i, "Public status must not invent reliability commitments.");

const services = JSON.parse(catalogue).services;
assert.ok(services.length > 0, "The service catalogue must contain actual scoped records.");
for (const service of services) {
  assert.equal(service.sloState, "not-defined", `${service.id} must not claim a public SLO.`);
  assert.notEqual(service.incidentState, "operational", `${service.id} must not invent an incident-free operational state.`);
}

console.log(JSON.stringify({ status: "ok", scope: "status-plane-separation", planes: planes.length, services: services.length }));
