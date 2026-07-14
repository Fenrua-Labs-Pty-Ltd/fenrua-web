import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { requireExternalArtifactDirectory } from "./external-artifact-paths.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const playwrightCli = resolve(root, "node_modules", "@playwright", "test", "cli.js");
const testOutputDirectory = requireExternalArtifactDirectory(
  process.env.FENRUA_TEST_OUTPUT_DIR || resolve(tmpdir(), "fenrua-web-js-disabled-playwright-results"),
  "JavaScript-disabled test output directory",
);
const result = spawnSync(
  process.execPath,
  [playwrightCli, "test", "tests/browser/javascript-disabled.spec.mjs", "--project=chromium", ...process.argv.slice(2)],
  {
    cwd: root,
    env: {
      ...process.env,
      FENRUA_TEST_HOST: process.env.FENRUA_TEST_HOST || "127.0.0.2",
      FENRUA_TEST_PORT: process.env.FENRUA_TEST_PORT || "4202",
      FENRUA_TEST_OUTPUT_DIR: testOutputDirectory,
    },
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
