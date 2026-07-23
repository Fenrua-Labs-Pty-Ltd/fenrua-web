import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { requireExternalArtifactDirectory } from "../../scripts/external-artifact-paths.mjs";

const visualStress = JSON.parse(readFileSync(new URL("../fixtures/visual-stress.json", import.meta.url), "utf8"));
const testHost = process.env.FENRUA_TEST_HOST || "127.0.0.2";
const testPort = process.env.FENRUA_TEST_PORT || "4173";
const testOrigin = `http://${testHost}:${testPort}`;
const visualMode = process.env.FENRUA_VISUAL_MODE || "compare";
const viewports = [
  ["320x568", 320, 568],
  ["360x800", 360, 800],
  ["390x844", 390, 844],
  ["768x1024", 768, 1024],
  ["1024x768", 1024, 768],
  ["1280x720", 1280, 720],
  ["1440x900", 1440, 900],
  ["1920x1080", 1920, 1080],
  ["2560x1440", 2560, 1440],
];
const visualRoutes = [
  ["platform", "/platform"],
  ["architecture", "/architecture/deployment"],
  ["toolchain", "/toolchain"],
  ["status", "/status"],
  ["claims", "/trust/claims"],
];

if (!["capture", "compare"].includes(visualMode)) {
  throw new TypeError(`Unsupported visual regression mode: ${visualMode}`);
}

const visualArtifactsDirectory = requireExternalArtifactDirectory(
  process.env.FENRUA_VISUAL_ARTIFACTS_DIR || resolve(tmpdir(), "fenrua-web-visual-regression-captures"),
  "Visual artifact directory",
);
const visualBaselineDirectory = visualMode === "compare"
  ? requireExternalArtifactDirectory(
    process.env.FENRUA_VISUAL_BASELINE_DIR || "",
    "Approved visual baseline directory",
    { create: false },
  )
  : null;

function digest(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function artifactName(testInfo, scenario) {
  if (!/^[a-z0-9-]+$/i.test(scenario)) throw new Error(`Unsafe visual scenario name: ${scenario}`);
  return `${testInfo.project.name}-${scenario}.png`;
}

async function capture(page, testInfo, scenario) {
  const name = artifactName(testInfo, scenario);
  const artifactPath = resolve(visualArtifactsDirectory, name);
  await page.screenshot({ path: artifactPath, fullPage: false, animations: "disabled" });
  expect(existsSync(artifactPath), `Visual capture was not created: ${artifactPath}`).toBe(true);
  expect(readFileSync(artifactPath).byteLength, `Visual capture is unexpectedly small: ${artifactPath}`).toBeGreaterThan(512);

  if (!visualBaselineDirectory) return;

  const baselinePath = resolve(visualBaselineDirectory, name);
  expect(existsSync(baselinePath), `Missing approved external visual baseline: ${baselinePath}`).toBe(true);
  expect(digest(artifactPath), `Visual baseline differs for ${scenario}`).toBe(digest(baselinePath));
}

async function gotoRoute(page, route, waitUntil = "networkidle", { waitForPaint = true } = {}) {
  await page.goto(route, { waitUntil });
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator(".site-header")).toBeVisible();
  if (waitForPaint) {
    await page.evaluate(() => new Promise((resolveFrame) => {
      requestAnimationFrame(() => requestAnimationFrame(resolveFrame));
    }));
  } else {
    await page.waitForTimeout(50);
  }
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

async function expectKeyboardFocus(page, locator) {
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Tab");
    if (await locator.evaluate((element) => document.activeElement === element)) break;
  }
  await expect(locator).toBeFocused();
  await expect.poll(() => locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.left >= 0 && box.right <= window.innerWidth && box.top >= 0 && box.bottom <= window.innerHeight;
  })).toBe(true);
  const outlineWidth = await locator.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth));
  expect(outlineWidth).toBeGreaterThan(0);
}

function monitorPayload({ observedAt = new Date(Date.now() - 5_000).toISOString(), sequence = 2113 } = {}) {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    refreshMs: 60_000,
    freshnessSeconds: 180,
    observations: [
      {
        chain: "978",
        observed_block: 333682,
        observed_at: observedAt,
        sequence,
        source_quorum: 2,
        status: "confirmed",
        signature: "signed-978",
        key_id: "fenchain-978-observation-v1",
      },
      {
        chain: "521",
        observed_block: 272007,
        observed_at: observedAt,
        sequence: 2052,
        source_quorum: 2,
        status: "confirmed",
        signature: "signed-521",
        key_id: "fenchain-521-observation-v1",
      },
    ],
    chains: [
      {
        expectedChainId: 978,
        chainId: 978,
        status: "live",
        blockNumber: 333682,
        blockAgeSeconds: 5,
        checkedAt: observedAt,
        observationSequence: sequence,
        confirmation: { evidenceSource: "signed-observation", confidence: "confirmed" },
      },
      {
        expectedChainId: 521,
        chainId: 521,
        status: "live",
        blockNumber: 272007,
        blockAgeSeconds: 5,
        checkedAt: observedAt,
        observationSequence: 2052,
        confirmation: { evidenceSource: "signed-observation", confidence: "confirmed" },
      },
    ],
  };
}

async function mockMonitor(page, { payload = null, status = 200, delayMs = 0 } = {}) {
  await page.route("**/api/chain-progress", async (route) => {
    if (delayMs) await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
    await route.fulfill({
      status,
      contentType: "application/json",
      body: payload ? JSON.stringify(payload) : '{"error":"unavailable"}',
    });
  });
}

console.log(JSON.stringify({
  status: "configured",
  scope: "external-visual-regression",
  artifacts: visualArtifactsDirectory,
  baseline: visualMode === "compare" ? "comparison" : "capture-only",
  playwright: "1.61.1",
}));

test("default public surfaces capture across the required viewport matrix", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await mockMonitor(page, { status: 503 });
  for (const [viewportName, width, height] of viewports) {
    await page.setViewportSize({ width, height });
    for (const [routeName, route] of visualRoutes) {
      await gotoRoute(page, route);
      await expectNoHorizontalOverflow(page);
      await capture(page, testInfo, `default-${routeName}-${viewportName}`);
    }
  }
});

test("reduced motion and forced colours remain inspectable", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoRoute(page, "/platform");
  expect(await page.locator(".site-nav a").first().evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "platform-reduced-motion-390x844");

  await page.emulateMedia({ reducedMotion: "no-preference", forcedColors: "active" });
  await gotoRoute(page, "/platform");
  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "platform-forced-colors-390x844");
});

test("200 percent browser zoom preserves an inspectable layout", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Chromium CDP is required to set a real browser page scale.");
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/platform");

  const client = await page.context().newCDPSession(page);
  try {
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
    await expect.poll(() => page.evaluate(() => window.visualViewport?.scale ?? 1)).toBeCloseTo(2, 2);
    await expectNoHorizontalOverflow(page);
    await capture(page, testInfo, "platform-page-scale-200-390x844");
  } finally {
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
    await client.detach();
  }
});

test("core public content remains visible without JavaScript", async ({ browser }, testInfo) => {
  const context = await browser.newContext({
    baseURL: testOrigin,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  try {
    await gotoRoute(page, "/platform", "domcontentloaded", { waitForPaint: false });
    await expect(page.locator(".capability-card")).toHaveCount(5);
    await expectNoHorizontalOverflow(page);
    await capture(page, testInfo, "platform-javascript-disabled-390x844");
  } finally {
    await context.close();
  }
});

test("slow valid and unavailable observation responses remain bounded visual states", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await mockMonitor(page, { payload: monitorPayload(), delayMs: 800 });
  await gotoRoute(page, "/", "domcontentloaded");
  const card = page.locator('.desktop-chain-progress [data-chain-card="978"]');
  await expect(card.locator('[data-chain-field="978-status"]')).toHaveText("Awaiting signed observation");
  await capture(page, testInfo, "overview-slow-valid-observation-1280x720");
  await expect(card.locator('[data-chain-field="978-status"]')).toHaveText("Live");
  await page.unroute("**/api/chain-progress");

  await mockMonitor(page, { status: 503 });
  await gotoRoute(page, "/", "domcontentloaded");
  await expect(card.locator('[data-chain-field="978-status"]')).toHaveText("Awaiting next observation");
  await capture(page, testInfo, "overview-awaiting-observation-1280x720");
});

test("named long-content stress fixtures cannot create horizontal overflow", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/platform");

  await page.locator(".route-hero h1").evaluate((element, value) => {
    element.textContent = value;
  }, visualStress.longTitle);
  await page.locator('[data-capability-id="capability.local-trust-gate"] dd').nth(1).evaluate((element, value) => {
    element.textContent = value;
  }, visualStress.longHash);
  await page.locator('.site-nav a[href="/developers"]').evaluate((element, value) => {
    element.textContent = value;
  }, visualStress.translatedLength);

  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, "platform-long-content-390x844");
});

test("keyboard traversal keeps the final navigation category visible", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoRoute(page, "/platform");
  await expectKeyboardFocus(page, page.locator('.site-nav a[href="/company"]'));
  await capture(page, testInfo, "platform-keyboard-focus-390x844");
});
