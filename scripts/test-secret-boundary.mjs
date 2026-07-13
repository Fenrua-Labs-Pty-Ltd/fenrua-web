import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { inspectPublicFile, scanPublicSource } from "./check-secret-boundary.mjs";

const temporaryRoot = mkdtempSync(join(tmpdir(), "fenrua-secret-boundary-"));

function inspect(name, value) {
  const path = join(temporaryRoot, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value, { encoding: "utf8", mode: 0o600 });
  return inspectPublicFile({ absolutePath: path, repositoryPath: name });
}

try {
  assert.deepEqual(
    inspect(".env.example", "FENRUA_OBSERVATION_READ_TOKEN=\nUPSTASH_REDIS_REST_TOKEN=\n"),
    []
  );
  assert.deepEqual(
    inspect(
      "tests/fixture.js",
      'const API_TOKEN = "test-fixture-token"; // public-secret-fixture\n'
    ),
    []
  );

  const privateKey = ["-----BEGIN ", "PRIVATE KEY-----", "not-a-real-key"].join("");
  assert.equal(inspect("source.txt", privateKey)[0].rule, "private-key-pem");

  const ageIdentity = ["AGE-", "SECRET-KEY-1", "NOTAREALIDENTITY"].join("");
  assert.equal(inspect("identity.txt", ageIdentity)[0].rule, "age-secret-identity");

  assert.equal(
    inspect(".env.production", "UPSTASH_REDIS_REST_TOKEN=not-a-real-production-value\n")[0].rule,
    "nonempty-sensitive-environment-value"
  );
  const sensitiveLiteral = ["const PROD_", "API_TOKEN", ' = "not-a-real-production-value";\n'].join("");
  assert.equal(inspect("config.js", sensitiveLiteral)[0].rule, "hardcoded-sensitive-literal");
  assert.equal(inspect("credentials.json", "{}\n")[0].rule, "credential-file-in-public-source");

  assert.equal(inspect(".env.production", "VERCEL_TOKEN=not-a-token\n")[0].rule, "nonempty-sensitive-environment-value");
  assert.equal(inspect(".env.production", "DATABASE_URL=postgres://db.invalid/x\n")[0].rule, "nonempty-sensitive-environment-value");
  assert.equal(inspect(".env.production", "SUPABASE_SERVICE_ROLE_KEY=not-a-key\n")[0].rule, "nonempty-sensitive-environment-value");
  const sensitiveJson = ['{"service_', 'role_key":"not-a-key"}\n'].join("");
  assert.equal(inspect("config.json", sensitiveJson)[0].rule, "hardcoded-sensitive-literal");
  assert.equal(inspect("config.yaml", "apiToken: not-a-token\n")[0].rule, "hardcoded-sensitive-literal");
  assert.equal(inspect("config.js", 'const privateKey = "not-a-key";\n')[0].rule, "hardcoded-sensitive-literal");
  const deceptiveFixture = "test-this-prefix-must-not-bypass-the-gate";
  const deceptiveViolations = inspect("tests/config.js", `const apiToken = "${deceptiveFixture}";\n`);
  assert.equal(deceptiveViolations[0].rule, "hardcoded-sensitive-literal");
  assert.equal(JSON.stringify(deceptiveViolations).includes(deceptiveFixture), false);

  const exportEnv = ["export API_", "TOKEN = not-a-token\n"].join("");
  assert.equal(inspect(".env.production", exportEnv)[0].rule, "nonempty-sensitive-environment-value");
  const spacedEnv = ["API_", "TOKEN = not-a-token\n"].join("");
  assert.equal(inspect(".env.production", spacedEnv)[0].rule, "nonempty-sensitive-environment-value");
  const collapsedJson = ['{"api', 'key":"not-a-key"}\n'].join("");
  assert.equal(inspect("config.json", collapsedJson)[0].rule, "hardcoded-sensitive-literal");
  const yamlList = ["- api", "Token=not-a-token\n"].join("");
  assert.equal(inspect("config.yaml", yamlList)[0].rule, "hardcoded-sensitive-literal");
  const collapsedJs = ["const api", 'key = "not-a-key";\n'].join("");
  assert.equal(inspect("config.js", collapsedJs)[0].rule, "hardcoded-sensitive-literal");
  const templateJs = ["const api", "Tok", "en = `not-a-token`;\n"].join("");
  assert.equal(inspect("config.js", templateJs)[0].rule, "hardcoded-sensitive-literal");
  const markerAsData = [
    "const apiTok",
    'en = "test-fixture-value"; const note = "public-secret-fixture";\n',
  ].join("");
  assert.equal(inspect("tests/config.js", markerAsData)[0].rule, "hardcoded-sensitive-literal");

  const ignoredRepository = join(temporaryRoot, "ignored-repository");
  mkdirSync(ignoredRepository, { recursive: true });
  execFileSync("git", ["init", "-q"], { cwd: ignoredRepository });
  writeFileSync(join(ignoredRepository, ".gitignore"), ".env*\n", { mode: 0o600 });
  writeFileSync(join(ignoredRepository, "safe.txt"), "public\n", { mode: 0o600 });
  const ignoredSecret = ["VERCEL_", "TOKEN=not-a-token\n"].join("");
  writeFileSync(join(ignoredRepository, ".env.local"), ignoredSecret, { mode: 0o600 });
  assert.ok(
    scanPublicSource(ignoredRepository).violations.some(
      (violation) => violation.rule === "nonempty-sensitive-environment-value"
    )
  );

  const envrc = ["export API_", "TOKEN=not-a-token\n"].join("");
  assert.equal(inspect(".envrc", envrc)[0].rule, "nonempty-sensitive-environment-value");
  const quotedTemplate = ["const config = {\"api", "Token\": `not-a-token`};\n"].join("");
  assert.equal(inspect("config.js", quotedTemplate)[0].rule, "hardcoded-sensitive-literal");
  const bracketAssignment = ["config[\"api", 'Token\"] = "not-a-token";\n'].join("");
  assert.equal(inspect("config.js", bracketAssignment)[0].rule, "hardcoded-sensitive-literal");
  const multilineTemplate = ["const api", "Tok", "en = `not-a-token\\nsecond-line`;\n"].join("");
  assert.equal(inspect("config.js", multilineTemplate)[0].rule, "hardcoded-sensitive-literal");

  console.log(JSON.stringify({ status: "ok", scope: "public-secret-boundary-regressions", cases: 27 }));
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
