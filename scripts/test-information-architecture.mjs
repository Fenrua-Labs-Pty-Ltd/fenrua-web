import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const playwrightCli = resolve(root, "node_modules", "@playwright", "test", "cli.js");
const result = spawnSync(
  process.execPath,
  [
    playwrightCli,
    "test",
    "tests/browser/information-architecture.spec.mjs",
    "--project=chromium",
    "--project=firefox",
    "--project=webkit",
    ...process.argv.slice(2),
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      FENRUA_TEST_HOST: process.env.FENRUA_TEST_HOST || "127.0.0.2",
      FENRUA_TEST_PORT: process.env.FENRUA_TEST_PORT || "4201",
      FENRUA_TEST_OUTPUT_DIR: process.env.FENRUA_TEST_OUTPUT_DIR || resolve(tmpdir(), "fenrua-web-ia-playwright-results"),
    },
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
