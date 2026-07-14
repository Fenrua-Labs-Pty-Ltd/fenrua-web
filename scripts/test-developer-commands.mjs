import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [packageSource, developers, verify, start] = await Promise.all([
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../developers/index.html", import.meta.url), "utf8"),
  readFile(new URL("../verify/index.html", import.meta.url), "utf8"),
  readFile(new URL("../start/index.html", import.meta.url), "utf8"),
]);
const packageJson = JSON.parse(packageSource);

for (const command of ["npm ci", "npm run validate", "node scripts/test-toolchain-registry.mjs", "node scripts/test-verify-examples.mjs"]) {
  assert.ok(developers.includes(command), `Developers must render the tested command: ${command}`);
}
for (const script of ["validate", "test:toolchain-registry", "test:verify-examples"]) {
  assert.equal(typeof packageJson.scripts?.[script], "string", `package.json must expose ${script}.`);
}

assert.match(developers, /COMPATIBILITY AND CONTRIBUTION/);
assert.match(developers, /Node 24 and the committed npm lockfile/);
assert.match(developers, /Repository contribution channel/);
assert.match(developers, /Private vulnerability reporting/);
assert.match(verify, /No live server-side verifier is claimed/);
assert.match(verify, /UNSUPPORTED_SCHEMA/);
assert.match(verify, /FAIL_CLOSED/);
for (const role of ["Developer", "Security engineer", "Researcher", "Enterprise technical leader", "University or educator", "Open-source contributor", "General technical reviewer"]) {
  assert.ok(start.includes(role), `Start must include the ${role} path.`);
}

console.log(JSON.stringify({ status: "ok", scope: "developer-commands-and-compatibility", commands: 4, roles: 7 }));
