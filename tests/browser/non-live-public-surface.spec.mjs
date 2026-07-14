import { expect, test } from "@playwright/test";

const testHost = process.env.FENRUA_TEST_HOST || "127.0.0.2";
const testPort = process.env.FENRUA_TEST_PORT || "4173";
const testOrigin = `http://${testHost}:${testPort}`;

function monitorPayload({ observedAt = new Date(Date.now() - 5_000).toISOString(), sequence = 2113 } = {}) {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    refreshMs: 60_000,
    freshnessSeconds: 90,
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

async function mockMonitor(page, response) {
  await page.route("**/api/chain-progress", async (route) => {
    if (response instanceof Error) {
      await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"unavailable"}' });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(response) });
  });
}

async function gotoPublic(page, pathname) {
  await page.goto(pathname, { waitUntil: "networkidle" });
  await expect(page.locator("main")).toBeVisible();
}

async function noHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

test("Overview alone hydrates detailed observation cards", async ({ page }) => {
  await mockMonitor(page, monitorPayload());
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoPublic(page, "/");

  const card = page.locator('.desktop-chain-progress [data-chain-card="978"]');
  await expect(card.locator('[data-chain-field="978-status"]')).toHaveText("Live");
  await expect(card.locator('[data-chain-field="978-block"]')).toHaveText("333,682");
  await expect(page.locator(".desktop-chain-progress [data-chain-card]")).toHaveCount(2);
  await noHorizontalOverflow(page);
});

test("Overview fails closed when its bounded monitor is unavailable", async ({ page }) => {
  await mockMonitor(page, new Error("unavailable"));
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoPublic(page, "/");

  const card = page.locator('.desktop-chain-progress [data-chain-card="978"]');
  await expect(card.locator('[data-chain-field="978-status"]')).toHaveText("Failure");
  await expect(card.locator('[data-chain-field="978-block"]')).toContainText("Observation unavailable");
});

test("Status hydrates monitor rows without duplicating observation cards", async ({ page }) => {
  const payload = monitorPayload();
  await mockMonitor(page, payload);
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoPublic(page, "/status");

  await expect(page.locator('[data-status-monitor-row="978"] [data-status-monitor-state]')).toHaveText("Live");
  await expect(page.locator('[data-status-monitor-row="521"] [data-status-monitor-state]')).toHaveText("Live");
  await expect(page.locator('[data-status-monitor-row="978"] [data-status-monitor-time] time')).toHaveAttribute("datetime", payload.observations[0].observed_at);
  await expect(page.locator("[data-chain-card]")).toHaveCount(0);
  await noHorizontalOverflow(page);
});

test("Status retains an explicit unavailable state", async ({ page }) => {
  await mockMonitor(page, new Error("unavailable"));
  await gotoPublic(page, "/status");

  await expect(page.locator('[data-status-monitor-row="978"] [data-status-monitor-state]')).toHaveText("Unavailable");
  await expect(page.locator("[data-status-monitor-meta]")).toContainText("No current state is asserted");
});

test("non-observation routes do not load a monitor or duplicate cards", async ({ page }) => {
  const apiRequests = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === testOrigin && url.pathname.startsWith("/api/")) apiRequests.push(url.pathname);
  });

  for (const route of ["/platform", "/architecture", "/trust", "/trust/claims", "/operations", "/company", "/evidence", "/toolchain", "/verify"]) {
    await gotoPublic(page, route);
    await expect(page.locator("[data-chain-card]")).toHaveCount(0);
  }
  expect(apiRequests).toEqual([]);
});
