import { expect, test } from "@playwright/test";

const allowedPaths = new Set(["/evidence", "/status", "/toolchain", "/verify"]);

function protectLiveBoundary(page) {
  const failures = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") failures.push(`external request: ${request.url()}`);
    if (url.pathname.startsWith("/api/") || url.pathname === "/kernel-status.js") failures.push(`protected request: ${url.pathname}`);
  });
  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    const url = new URL(frame.url());
    if (url.origin === "http://127.0.0.1:4173" && !allowedPaths.has(url.pathname)) failures.push(`unexpected navigation: ${url.pathname}`);
  });
  return () => {
    expect(failures, failures.join("\n")).toEqual([]);
  };
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

test("Evidence remains usable at a phone viewport without live-card requests", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await gotoPublic(page, "/evidence");
  await expect(page.locator(".evidence-table")).toBeVisible();
  await expect(page.locator("[data-chain-card]")).toHaveCount(0);
  await noHorizontalOverflow(page);
  assertBoundary();
});

test("Status uses the permitted external relative-time script and responsive grid", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 320, height: 900 });
  await gotoPublic(page, "/status");
  await expect(page.locator("[data-relative-time]").first()).toHaveText(/^Updated /);
  await noHorizontalOverflow(page);
  expect(consoleErrors.filter((message) => /content security policy|refused to execute/i.test(message))).toEqual([]);

  await page.setViewportSize({ width: 1280, height: 900 });
  const stateGrid = page.locator(".state-grid");
  await expect.poll(() => stateGrid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length)).toBeGreaterThanOrEqual(3);
  await expect(page.locator(".timestamp-inline").first()).toHaveCSS("display", "grid");
  await expect(page.locator("[data-chain-card]")).toHaveCount(0);
  assertBoundary();
});

for (const width of [768, 820]) {
  test(`Toolchain keeps two summary columns at ${width}px`, async ({ page }) => {
    const assertBoundary = protectLiveBoundary(page);
    await page.setViewportSize({ width, height: 900 });
    await gotoPublic(page, "/toolchain");
    const summary = page.locator(".toolchain-summary:not(.state-grid)").first();
    await expect(summary).toBeVisible();
    await expect.poll(() => summary.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length)).toBe(2);
    await expect(page.locator("[data-chain-card]")).toHaveCount(0);
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
  await expect(page.locator("[data-chain-card]")).toHaveCount(0);
  assertBoundary();
  await context.close();
});
