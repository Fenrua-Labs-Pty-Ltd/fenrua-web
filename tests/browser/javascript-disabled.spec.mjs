import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const testHost = process.env.FENRUA_TEST_HOST || "127.0.0.2";
const testPort = process.env.FENRUA_TEST_PORT || "4173";
const testOrigin = `http://${testHost}:${testPort}`;
const sitemapPath = fileURLToPath(new URL("../../sitemap.xml", import.meta.url));
const routes = [...readFileSync(sitemapPath, "utf8").matchAll(/<loc>https:\/\/fenrua\.ai([^<]+)<\/loc>/g)].map(([, route]) => route);

test("every current route retains core content and navigation without JavaScript", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({
    baseURL: testOrigin,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  try {
    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator(".site-nav a")).toHaveCount(6);
      const geometry = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    }

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator('.desktop-chain-progress [data-chain-field="978-status"]')).toHaveText("Awaiting signed observation");
    await expect(page.locator('.desktop-chain-progress [data-chain-field="978-block"]')).toHaveText("No current observation");
  } finally {
    await context.close();
  }
});
