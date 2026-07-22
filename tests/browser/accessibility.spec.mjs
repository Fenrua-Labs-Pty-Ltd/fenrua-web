import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const testHost = process.env.FENRUA_TEST_HOST || "127.0.0.2";
const testPort = process.env.FENRUA_TEST_PORT || "4173";
const testOrigin = `http://${testHost}:${testPort}`;
const sitemapPath = fileURLToPath(new URL("../../sitemap.xml", import.meta.url));
const canonicalRoutes = [...readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, value]) => {
  const url = new URL(value);
  if (url.origin !== "https://fenrua.ai" || url.search || url.hash) {
    throw new TypeError(`Sitemap route must be a canonical Fenrua HTML URL: ${value}`);
  }
  return url.pathname;
});

if (canonicalRoutes.length === 0 || new Set(canonicalRoutes).size !== canonicalRoutes.length) {
  throw new TypeError("Sitemap must contain unique canonical HTML routes for accessibility testing.");
}

function formatFindings(violations) {
  return violations
    .map(({ id, impact, help, nodes }) => {
      const targets = nodes.map((node) => node.target.join(" ")).join(", ");
      return `[${impact ?? "unknown"}] ${id}: ${help}${targets ? ` (${targets})` : ""}`;
    })
    .join("\n");
}

async function gotoCanonicalRoute(page, route) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main")).toBeVisible();
}

async function exposedChainAnnouncementRegions(page) {
  return page.locator('[data-chain-meta="announcer"]').evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        for (let element = node; element; element = element.parentElement) {
          const style = getComputedStyle(element);
          if (element.hidden || element.getAttribute("aria-hidden") === "true" || style.display === "none" || style.visibility === "hidden") {
            return false;
          }
        }
        return true;
      })
      .map((node) => ({
        role: node.getAttribute("role"),
        live: node.getAttribute("aria-live"),
        atomic: node.getAttribute("aria-atomic"),
      }))
  );
}

async function expectSingleExposedChainAnnouncementRegion(page) {
  const regions = await exposedChainAnnouncementRegions(page);
  expect(regions).toHaveLength(1);
  expect(regions[0]).toEqual({ role: "status", live: "polite", atomic: "true" });
}

for (const route of canonicalRoutes) {
  test(`Axe has no serious or critical findings: ${route}`, async ({ page }, testInfo) => {
    await gotoCanonicalRoute(page, route);
    const results = await new AxeBuilder({ page }).analyze();
    const seriousOrCritical = results.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
    const moderate = results.violations.filter(({ impact }) => impact === "moderate");

    if (moderate.length > 0) {
      await testInfo.attach("axe-moderate-findings.json", {
        body: JSON.stringify(moderate, null, 2),
        contentType: "application/json",
      });
    }

    expect(seriousOrCritical, `${route} accessibility findings:\n${formatFindings(seriousOrCritical)}`).toEqual([]);
  });
}

test("observation announcements are limited to the relevant surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoCanonicalRoute(page, "/");
  await expectSingleExposedChainAnnouncementRegion(page);

  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoCanonicalRoute(page, "/architecture");
  expect(await exposedChainAnnouncementRegions(page)).toHaveLength(0);

  await gotoCanonicalRoute(page, "/status");
  await expect(page.locator("[data-status-monitor-announcer]")).toHaveCount(1);
});

test("Toolchain filter results use a live status region", async ({ page }) => {
  await gotoCanonicalRoute(page, "/toolchain");
  const status = page.locator("[data-page-status]");

  await expect(status).toHaveAttribute("role", "status");
  await expect(status).toHaveAttribute("aria-live", "polite");
  await expect(status).toHaveAttribute("aria-atomic", "true");

  const disclosure = page.locator("[data-filter-disclosure]");
  await disclosure.evaluate((element) => {
    element.open = false;
  });
  const summary = disclosure.locator("summary");
  await summary.focus();
  await summary.press("Enter");
  await expect(disclosure).toHaveAttribute("open", "");
  const unavailable = page.locator('[data-filter="unavailable"]');
  await unavailable.click();
  await expect(unavailable).toHaveAttribute("aria-pressed", "true");
  await expect(status).toHaveText(/^Page 1 of \d+ \u00b7 \d+ matching$/);
});

test("Overview keeps an honest signed-observation fallback without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: testOrigin,
    javaScriptEnabled: false,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    await gotoCanonicalRoute(page, "/");
    const card = page.locator('.desktop-chain-progress [data-chain-card="978"]');
    await expect(card).toBeVisible();
    await expect(card.locator('[data-chain-field="978-status"]')).toHaveText("Awaiting signed observation");
    await expect(card.locator('[data-chain-field="978-block"]')).toHaveText("No current observation");
    await expect(page.locator('.desktop-chain-progress [data-chain-meta="countdown"]')).toHaveText("no refresh without JavaScript");
  } finally {
    await context.close();
  }
});

test("the Roadmap mobile navigation category remains visible and keyboard-focusable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoCanonicalRoute(page, "/");
  const terminalLink = page.locator('.site-nav a[href="/roadmap"]');
  await terminalLink.focus();

  await expect(terminalLink).toBeFocused();
  await expect.poll(() => terminalLink.evaluate((link) => {
    const linkBox = link.getBoundingClientRect();
    return linkBox.left >= 0 && linkBox.right <= window.innerWidth && linkBox.top >= 0 && linkBox.bottom <= window.innerHeight;
  })).toBe(true);
});
