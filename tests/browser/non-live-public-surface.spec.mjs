import { expect, test } from "@playwright/test";

const testHost = process.env.FENRUA_TEST_HOST || "127.0.0.2";
const testPort = process.env.FENRUA_TEST_PORT || "4173";
const testOrigin = `http://${testHost}:${testPort}`;

function monitorPayload({
  observedAt = new Date(Date.now() - 5_000).toISOString(),
  sequence = 2113,
  chain521Sequence = 2052,
  chain521Block = 272007,
} = {}) {
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
        observed_block: chain521Block,
        observed_at: observedAt,
        sequence: chain521Sequence,
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
        blockNumber: chain521Block,
        blockAgeSeconds: 5,
        checkedAt: observedAt,
        observationSequence: chain521Sequence,
        confirmation: { evidenceSource: "signed-observation", confidence: "confirmed" },
      },
    ],
  };
}

function partialMonitorPayload({ observedAt = new Date().toISOString(), sequence = 2114, chain521Sequence = 2053 } = {}) {
  const payload = monitorPayload({ observedAt, sequence, chain521Sequence });
  payload.observations[1] = {
    ...payload.observations[1],
    observed_block: null,
    source_quorum: 1,
    status: "partial",
    signature: "signed-521-partial",
  };
  payload.chains[1] = {
    ...payload.chains[1],
    chainId: null,
    status: "partial",
    blockNumber: null,
    blockAgeSeconds: null,
    confirmation: { evidenceSource: "partial-observation", confidence: "partial" },
  };
  return payload;
}

async function mockMonitor(page, response) {
  await page.route("**/api/chain-progress", async (route) => {
    const currentResponse = typeof response === "function" ? response() : response;
    if (currentResponse instanceof Error) {
      await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"unavailable"}' });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(currentResponse) });
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

test("Overview presents an unavailable bounded monitor as a non-current awaiting state", async ({ page }) => {
  await mockMonitor(page, new Error("unavailable"));
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoPublic(page, "/");

  const card = page.locator('.desktop-chain-progress [data-chain-card="978"]');
  await expect(card.locator('[data-chain-field="978-status"]')).toHaveText("Awaiting next observation");
  await expect(card.locator('[data-chain-field="978-block"]')).toContainText("No current observation");
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

test("Status presents an unavailable monitor as a non-current awaiting state", async ({ page }) => {
  await mockMonitor(page, new Error("unavailable"));
  await gotoPublic(page, "/status");

  await expect(page.locator('[data-status-monitor-row="978"] [data-status-monitor-state]')).toHaveText("Awaiting next observation");
  await expect(page.locator("[data-status-monitor-meta]")).toContainText("No current signed observation is asserted");
});

test("Overview retains only a labelled last verified block during a valid signed partial", async ({ page }) => {
  let response = monitorPayload();
  await mockMonitor(page, () => response);
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoPublic(page, "/");

  const card = page.locator('.desktop-chain-progress [data-chain-card="521"]');
  await expect(card.locator('[data-chain-field="521-status"]')).toHaveText("Live");

  response = partialMonitorPayload();
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(card.locator('[data-chain-field="521-status"]')).toHaveText("Awaiting next observation");
  await expect(card.locator('[data-chain-field="521-block"]')).toContainText("Last verified 272,007");
  await expect(card.locator('[data-chain-field="521-block"]')).toContainText("awaiting next observation");
  await expect(card).not.toContainText("Partial");

  response = monitorPayload({
    observedAt: new Date().toISOString(),
    sequence: 2115,
    chain521Sequence: 2054,
    chain521Block: 272008,
  });
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(card.locator('[data-chain-field="521-status"]')).toHaveText("Live");
  await expect(card.locator('[data-chain-field="521-block"]')).toHaveText("272,008");
});

test("Status keeps a valid signed partial neutral after the one-minute presentation window", async ({ page }) => {
  await page.clock.install({ time: new Date() });
  let response = monitorPayload();
  await mockMonitor(page, () => response);
  await gotoPublic(page, "/status");

  const row = page.locator('[data-status-monitor-row="521"]');
  await expect(row.locator('[data-status-monitor-state]')).toHaveText("Live");

  response = partialMonitorPayload();
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(row.locator('[data-status-monitor-state]')).toHaveText("Awaiting next observation");
  await expect(row.locator('[data-status-monitor-block]')).toContainText("Last verified 272,007");

  await page.clock.fastForward(60_100);
  await expect(row.locator('[data-status-monitor-state]')).toHaveText("Awaiting next observation");
  await expect(row.locator('[data-status-monitor-block]')).toContainText("Last verified 272,007");
  await expect(row).not.toContainText("Partial");
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
