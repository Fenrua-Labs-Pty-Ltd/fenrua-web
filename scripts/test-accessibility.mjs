import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { requireExternalArtifactDirectory } from "./external-artifact-paths.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const playwrightCli = resolve(root, "node_modules", "@playwright", "test", "cli.js");
const testOutputDirectory = requireExternalArtifactDirectory(
  process.env.FENRUA_TEST_OUTPUT_DIR || resolve(tmpdir(), "fenrua-web-accessibility-playwright-results"),
  "Accessibility test output directory",
);
const requestedArguments = process.argv.slice(2);
const projectArguments = requestedArguments.some((argument) => argument === "--project" || argument.startsWith("--project="))
  ? requestedArguments
  : ["--project=chromium", ...requestedArguments];
const result = spawnSync(
  process.execPath,
  [playwrightCli, "test", "tests/browser/accessibility.spec.mjs", ...projectArguments],
  {
    cwd: root,
    env: {
      ...process.env,
      FENRUA_TEST_HOST: process.env.FENRUA_TEST_HOST || "127.0.0.2",
      FENRUA_TEST_PORT: process.env.FENRUA_TEST_PORT || "4199",
      FENRUA_TEST_OUTPUT_DIR: testOutputDirectory,
    },
    stdio: "inherit",
  }
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
