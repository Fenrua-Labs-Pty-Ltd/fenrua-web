import { expect, test } from "@playwright/test";

const allowedPaths = new Set(["/evidence", "/status", "/toolchain", "/verify"]);

function protectLiveBoundary(page) {
  const failures = [];
  const liveRequests = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") failures.push(`external request: ${request.url()}`);
    if (url.pathname.startsWith("/api/") && url.pathname !== "/api/chain-progress") failures.push(`unexpected API request: ${url.pathname}`);
    if (url.pathname === "/kernel-status.js" || url.pathname === "/api/chain-progress") liveRequests.push(url.pathname);
  });
  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    const url = new URL(frame.url());
    if (url.origin === "http://127.0.0.1:4173" && !allowedPaths.has(url.pathname)) failures.push(`unexpected navigation: ${url.pathname}`);
  });
  const assertBoundary = () => {
    expect(failures, failures.join("\n")).toEqual([]);
  };
  assertBoundary.liveRequests = liveRequests;
  return assertBoundary;
}

async function expectMobileLiveBlocks(page) {
  await expect(page.locator(".mobile-chain-rail")).toBeVisible();
  await expect(page.locator(".mobile-chain-rail [data-chain-card]")).toHaveCount(2);
  await expect(page.locator("[data-chain-card]")).toHaveCount(2);
}

async function expectOverviewMobileHeaderPlacement(page) {
  const placement = await page.locator(".site-header-mobile-live").evaluate((header) => {
    const box = (selector) => header.querySelector(selector).getBoundingClientRect();
    const brand = box(".brand");
    const nav = box(".site-nav");
    const rail = box(".mobile-chain-rail");
    return {
      brandAboveNav: brand.bottom <= nav.top,
      brandAboveRail: brand.bottom <= rail.top,
      navLeftOfRail: nav.left < rail.left,
      navAndRailShareRow: Math.abs(nav.top - rail.top) <= 1,
    };
  });
  expect(placement).toEqual({
    brandAboveNav: true,
    brandAboveRail: true,
    navLeftOfRail: true,
    navAndRailShareRow: true,
  });
}

async function noHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

async function gotoPublic(page, pathname) {
  await page.goto(pathname);
  await page.waitForLoadState("networkidle");
}

function monitorPayload({ sequence978 = 2113, sequence521 = 2052 } = {}) {
  const generatedAt = new Date().toISOString();
  const observed978 = new Date(Date.now() - 7_000).toISOString();
  const observed521 = new Date(Date.now() - 41_000).toISOString();
  const observations = [
    {
      chain: "978",
      observed_block: 333682,
      observed_at: observed978,
      sequence: sequence978,
      source_quorum: 2,
      status: "confirmed",
      signature: "signed-978",
    },
    {
      chain: "521",
      observed_block: 272007,
      observed_at: observed521,
      sequence: sequence521,
      source_quorum: 2,
      status: "confirmed",
      signature: "signed-521",
    },
  ];
  return {
    version: 1,
    generatedAt,
    refreshMs: 20_000,
    freshnessSeconds: 90,
    observations,
    chains: [
      {
        expectedChainId: 978,
        status: "live",
        blockNumber: observations[0].observed_block,
        blockAgeSeconds: 7,
        checkedAt: observations[0].observed_at,
        observationSequence: observations[0].sequence,
        confirmation: { evidenceSource: "signed-observation", confidence: "confirmed" },
      },
      {
        expectedChainId: 521,
        status: "live",
        blockNumber: observations[1].observed_block,
        blockAgeSeconds: 41,
        checkedAt: observations[1].observed_at,
        observationSequence: observations[1].sequence,
        confirmation: { evidenceSource: "signed-observation", confidence: "confirmed" },
      },
    ],
  };
}

async function mockPublicMonitor(page, response) {
  await page.route("**/api/chain-progress", async (route) => {
    if (response instanceof Error) {
      await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"unavailable"}' });
      return;
    }
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(response) });
  });
}

test("Evidence keeps the Overview mobile live blocks without extra API access", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await gotoPublic(page, "/evidence");
  await expect(page.locator(".evidence-table")).toBeVisible();
  await expectMobileLiveBlocks(page);
  await noHorizontalOverflow(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await expectOverviewMobileHeaderPlacement(page);
  assertBoundary();
});

test("Status uses the permitted external relative-time script and responsive grid", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  const consoleErrors = [];
  const payload = monitorPayload();
  await mockPublicMonitor(page, payload);
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 320, height: 900 });
  await gotoPublic(page, "/status");
  await expectMobileLiveBlocks(page);
  await expect(page.locator('[data-status-monitor-row="978"] [data-status-monitor-state]')).toHaveText("Live");
  await expect(page.locator('[data-status-monitor-row="521"] [data-status-monitor-state]')).toHaveText("Live");
  await expect(page.locator('[data-status-monitor-row="978"] [data-status-monitor-time] time')).toHaveAttribute("datetime", payload.observations[0].observed_at);
  await expect(page.locator('[data-status-monitor-row="521"] [data-status-monitor-time] time')).toHaveAttribute("datetime", payload.observations[1].observed_at);
  await expect(page.locator('[data-status-monitor-row="978"] [data-status-monitor-sequence]')).toContainText(
    new Intl.NumberFormat("en-US").format(payload.observations[0].sequence)
  );
  await expect(page.locator("[data-status-monitor-meta]")).toContainText("not an activation event");
  expect(await page.locator("[data-relative-time]").count()).toBe(0);
  await noHorizontalOverflow(page);
  expect(consoleErrors.filter((message) => /content security policy|refused to execute/i.test(message))).toEqual([]);

  await page.setViewportSize({ width: 1280, height: 900 });
  const stateGrid = page.locator(".state-grid");
  await expect.poll(() => stateGrid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length)).toBeGreaterThanOrEqual(3);
  await expect(page.locator(".status-monitor-timestamp").first()).toHaveCSS("display", "grid");
  await expect(page.locator("[data-chain-card]")).toHaveCount(2);
  assertBoundary();
});

test("Status keeps the copied live rail hidden while its isolated monitor runs at desktop width", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  await mockPublicMonitor(page, monitorPayload());
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoPublic(page, "/status");
  await expect(page.locator(".mobile-chain-rail")).toBeHidden();
  await expect(page.locator("[data-chain-card]")).toHaveCount(2);
  await expect(page.locator('[data-status-monitor-row="978"] [data-status-monitor-state]')).toHaveText("Live");
  expect(assertBoundary.liveRequests).toContain("/api/chain-progress");
  expect(assertBoundary.liveRequests).not.toContain("/kernel-status.js");
  assertBoundary();
});

test("Status fails closed when the public monitor is unavailable", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  await mockPublicMonitor(page, new Error("unavailable"));
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoPublic(page, "/status");
  await expect(page.locator('[data-status-monitor-row="978"] [data-status-monitor-state]')).toHaveText("Unavailable");
  await expect(page.locator('[data-status-monitor-row="521"] [data-status-monitor-state]')).toHaveText("Unavailable");
  await expect(page.locator('[data-status-monitor-row="978"] [data-status-monitor-time]')).toHaveText(/no current observation is asserted/i);
  await expect(page.locator("[data-status-monitor-meta]")).toContainText("No current state is asserted");
  expect(await page.locator('[data-status-monitor-time] time').count()).toBe(0);
  assertBoundary();
});

for (const width of [768, 820]) {
  test(`Toolchain keeps two summary columns at ${width}px`, async ({ page }) => {
    const assertBoundary = protectLiveBoundary(page);
    await page.setViewportSize({ width, height: 900 });
    await gotoPublic(page, "/toolchain");
    await expectMobileLiveBlocks(page);
    const summary = page.locator(".toolchain-summary:not(.state-grid)").first();
    await expect(summary).toBeVisible();
    await expect.poll(() => summary.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length)).toBe(2);
    await expect(page.locator("[data-chain-card]")).toHaveCount(2);
    assertBoundary();
  });
}

test("Verify table supports keyboard scrolling and forced-colors focus", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:4173",
    forcedColors: "active",
    viewport: { width: 720, height: 900 },
  });
  const page = await context.newPage();
  const assertBoundary = protectLiveBoundary(page);
  await gotoPublic(page, "/verify");
  await expectMobileLiveBlocks(page);
  const table = page.getByRole("region", { name: "Data table" });
  await expect(table).toBeVisible();
  await expect(table).toHaveAttribute("tabindex", "0");
  await expect.poll(() => table.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);

  await table.focus();
  await expect(table).toBeFocused();
  const before = await table.evaluate((element) => element.scrollLeft);
  for (let count = 0; count < 6; count += 1) await page.keyboard.press("ArrowRight");
  await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before);
  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
  await expect.poll(() => table.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  await expect(page.locator("[data-chain-card]")).toHaveCount(2);
  assertBoundary();
  await context.close();
});
