import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const testHost = process.env.FENRUA_TEST_HOST || "127.0.0.2";
const testPort = process.env.FENRUA_TEST_PORT || "4173";
const testOrigin = `http://${testHost}:${testPort}`;
const testOutputDir = process.env.FENRUA_TEST_OUTPUT_DIR || join(tmpdir(), "fenrua-web-playwright-results");

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  outputDir: testOutputDir,
  reporter: "line",
  use: {
    baseURL: testOrigin,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  webServer: {
    command: "node scripts/serve-browser-test.mjs",
    url: `${testOrigin}/__fenrua_browser_test_health`,
    env: { FENRUA_TEST_HOST: testHost, PORT: testPort },
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
