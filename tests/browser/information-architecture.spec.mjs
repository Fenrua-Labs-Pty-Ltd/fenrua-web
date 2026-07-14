import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const sitemapPath = fileURLToPath(new URL("../../sitemap.xml", import.meta.url));
const routes = [...readFileSync(sitemapPath, "utf8").matchAll(/<loc>https:\/\/fenrua\.ai([^<]+)<\/loc>/g)].map(([, route]) => route);
const representativeRoutes = ["/", "/platform", "/architecture/deployment", "/trust/claims", "/operations", "/status", "/toolchain", "/company"];
const viewports = [
  [320, 568],
  [360, 800],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [2560, 1440],
];

async function gotoRoute(page, route) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main")).toBeVisible();
}

async function noHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

test("skip link starts the keyboard order", async ({ page }) => {
  await gotoRoute(page, "/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
});

for (const [width, height] of viewports) {
  test(`six-category navigation remains visible at ${width}x${height}`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height });
    for (const route of representativeRoutes) {
      await gotoRoute(page, route);
      const nav = page.locator(".site-nav");
      await expect(nav.getByRole("link")).toHaveCount(6);
      const terminal = nav.getByRole("link", { name: "Company", exact: true });
      await terminal.focus();
      await expect(terminal).toBeFocused();
      await expect.poll(() => terminal.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return box.left >= 0 && box.right <= window.innerWidth && box.top >= 0 && box.bottom <= window.innerHeight;
      })).toBe(true);
      await noHorizontalOverflow(page);
    }
  });
}

test("all current routes have contextual navigation and desktop/mobile overflow protection", async ({ page }) => {
  test.setTimeout(120_000);
  for (const [width, height] of [[390, 844], [1280, 720]]) {
    await page.setViewportSize({ width, height });
    for (const route of routes) {
      await gotoRoute(page, route);
      if (route !== "/") {
        await expect(page.locator(".breadcrumb-nav")).toBeVisible();
        await expect(page.locator(".section-nav")).toBeVisible();
      }
      await noHorizontalOverflow(page);
    }
  }
});

test("dense records expose a small-screen alternative", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await gotoRoute(page, "/toolchain");
  await expect(page.locator(".toolchain-mobile-list")).toBeVisible();
  await expect(page.locator(".toolchain-table")).toBeHidden();

  await gotoRoute(page, "/evidence");
  await expect(page.locator(".evidence-table tbody tr").first()).toBeVisible();
  await expect(page.locator('.evidence-table td[data-label="Hash"]').first()).toBeVisible();

  await gotoRoute(page, "/status");
  await expect(page.locator('.status-table td[data-label="Current limitation"]').first()).toBeVisible();
});
