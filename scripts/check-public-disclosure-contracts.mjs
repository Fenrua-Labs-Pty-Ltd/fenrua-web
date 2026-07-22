import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chainGatewayAllowlist,
  publicDisclosureContracts,
} from "./public-disclosure-contracts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => readFileSync(resolve(root, relativePath), "utf8");

function readQuotedCollection(source, name) {
  const match = source.match(
    new RegExp(`const ${name} = (?:new Set\\()?\\[([\\s\\S]*?)\\]\\)?;`)
  );
  assert.ok(match, `Missing ${name} collection.`);
  return [...match[1].matchAll(/["']([^"']+)["']/g)].map((entry) => entry[1]);
}

function assertSameMembers(actual, expected, label) {
  assert.deepEqual([...actual].sort(), [...expected].sort(), `${label} drifted from the approved disclosure contract.`);
}

function assertGenericErrorShape(source, relativePath) {
  assert.match(
    source,
    /function sendError\(response, statusCode, error, headers = \{\}\) \{[\s\S]*?response\.setHeader\("Cache-Control", "private, no-store"\);[\s\S]*?response\.status\(statusCode\)\.json\(\{ error \}\);[\s\S]*?\}/,
    `${relativePath} must retain the generic, no-store public error shape.`
  );
  const errorMessages = [...source.matchAll(/sendError\(response, \d+, "([^"]+)"/g)].map((entry) => entry[1]);
  assert.ok(errorMessages.length > 0, `${relativePath} must use the generic error helper.`);
  for (const message of errorMessages) {
    assert.ok(
      publicDisclosureContracts.publicError.messages.includes(message),
      `${relativePath} uses an unapproved public error message.`
    );
  }
}

const progressSource = read("api/chain-progress.js");
const keySources = [
  ["api/chain-observation-key.js", read("api/chain-observation-key.js")],
  ["api/chain-n521-observation-key.js", read("api/chain-n521-observation-key.js")],
];

const gatewayFields = readQuotedCollection(progressSource, "allowedGatewayFields");
const requiredGatewayFields = readQuotedCollection(progressSource, "requiredGatewayFields");
assertSameMembers(gatewayFields, chainGatewayAllowlist, "Gateway field allowlist");
assertSameMembers(
  requiredGatewayFields,
  chainGatewayAllowlist.filter((field) => field !== "version"),
  "Gateway required-field allowlist"
);
assert.match(
  progressSource,
  /response\.status\(200\)\.json\(snapshot\);/,
  "The chain-progress success response must remain the reviewed snapshot contract."
);
assertGenericErrorShape(progressSource, "api/chain-progress.js");

for (const [relativePath, source] of keySources) {
  assert.match(
    source,
    /response\.status\(200\)\.json\(result\);/,
    `${relativePath} must retain the reviewed verification-metadata response contract.`
  );
  assertGenericErrorShape(source, relativePath);
}

assert.equal(
  new Set(publicDisclosureContracts.publicError.messages).size,
  publicDisclosureContracts.publicError.messages.length,
  "The public error vocabulary must not contain duplicate messages."
);

console.log(
  JSON.stringify({
    status: "ok",
    scope: "public-disclosure-contract-source-lint",
    responseFamilies: 3,
    gatewayFields: chainGatewayAllowlist.length,
    genericErrorMessages: publicDisclosureContracts.publicError.messages.length,
  })
);
