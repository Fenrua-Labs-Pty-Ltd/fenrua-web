import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { requireExternalArtifactDirectory } from "./external-artifact-paths.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const playwrightCli = resolve(root, "node_modules", "@playwright", "test", "cli.js");
const requestedArguments = process.argv.slice(2);
const captureOnly = requestedArguments.includes("--capture");
const playwrightArguments = requestedArguments.filter((argument) => argument !== "--capture");
const projectArguments = requestedArguments.some((argument) => argument === "--project" || argument.startsWith("--project="))
  ? playwrightArguments
  : ["--project=chromium", ...playwrightArguments];
const testOutputDirectory = requireExternalArtifactDirectory(
  process.env.FENRUA_TEST_OUTPUT_DIR || resolve(tmpdir(), "fenrua-web-visual-regression-playwright-results"),
  "Visual regression test output directory",
);
const visualArtifactsDirectory = requireExternalArtifactDirectory(
  process.env.FENRUA_VISUAL_ARTIFACTS_DIR || resolve(tmpdir(), "fenrua-web-visual-regression-captures"),
  "Visual artifact directory",
);
const visualBaselineDirectory = captureOnly
  ? undefined
  : requireExternalArtifactDirectory(
    process.env.FENRUA_VISUAL_BASELINE_DIR || "",
    "Approved visual baseline directory",
    { create: false },
  );
const result = spawnSync(
  process.execPath,
  [playwrightCli, "test", "tests/browser/visual-regression.spec.mjs", ...projectArguments],
  {
    cwd: root,
    env: {
      ...process.env,
      FENRUA_TEST_HOST: process.env.FENRUA_TEST_HOST || "127.0.0.2",
      FENRUA_TEST_PORT: process.env.FENRUA_TEST_PORT || "4203",
      FENRUA_TEST_OUTPUT_DIR: testOutputDirectory,
      FENRUA_VISUAL_ARTIFACTS_DIR: visualArtifactsDirectory,
      FENRUA_VISUAL_MODE: captureOnly ? "capture" : "compare",
      ...(visualBaselineDirectory ? { FENRUA_VISUAL_BASELINE_DIR: visualBaselineDirectory } : {}),
    },
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
