import { expect, test } from "@playwright/test";

const allowedPaths = new Set(["/", "/evidence", "/legal", "/status", "/toolchain", "/verify"]);
const testHost = process.env.FENRUA_TEST_HOST || "127.0.0.2";
const testPort = process.env.FENRUA_TEST_PORT || "4173";
const testOrigin = `http://${testHost}:${testPort}`;

function protectLiveBoundary(page) {
  const failures = [];
  const liveRequests = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== testOrigin) failures.push(`external request: ${request.url()}`);
    if (url.pathname.startsWith("/api/") && url.pathname !== "/api/chain-progress") failures.push(`unexpected API request: ${url.pathname}`);
    if (url.pathname === "/kernel-status.js" || url.pathname === "/api/chain-progress") liveRequests.push(url.pathname);
  });
  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    const url = new URL(frame.url());
    if (url.origin === testOrigin && !allowedPaths.has(url.pathname)) failures.push(`unexpected navigation: ${url.pathname}`);
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
  await expect(page.locator(".route-hero-chain-rail")).toBeHidden();
  await expect(page.locator(".route-hero-chain-rail [data-chain-card]")).toHaveCount(2);
  await expect(page.locator("[data-chain-card]")).toHaveCount(4);
}

async function expectUnifiedMobileHeaderPlacement(page) {
  const placement = await page.locator(".site-header-mobile-live").evaluate((header) => {
    const box = (selector) => header.querySelector(selector).getBoundingClientRect();
    const brand = box(".brand");
    const nav = box(".site-nav");
    const rail = box(".mobile-chain-rail");
    const navStyle = getComputedStyle(header.querySelector(".site-nav"));
    const navLinkHeights = [...header.querySelectorAll(".site-nav a")].map(
      (link) => link.getBoundingClientRect().height
    );
    return {
      brandAboveRail: brand.bottom <= rail.top,
      railAboveNav: rail.bottom <= nav.top,
      horizontalNav: navStyle.display === "flex" && navStyle.flexWrap === "nowrap",
      scrollableNav: ["auto", "scroll"].includes(navStyle.overflowX),
      minimumTargetHeight: Math.min(...navLinkHeights),
      headerHeight: header.getBoundingClientRect().height,
    };
  });
  expect(placement.brandAboveRail).toBe(true);
  expect(placement.railAboveNav).toBe(true);
  expect(placement.horizontalNav).toBe(true);
  expect(placement.scrollableNav).toBe(true);
  expect(placement.minimumTargetHeight).toBeGreaterThanOrEqual(44);
  expect(placement.headerHeight).toBeLessThanOrEqual(430);
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

function monitorPayload({
  sequence978 = 2113,
  sequence521 = 2052,
  block978 = 333682,
  block521 = 272007,
  observed978 = new Date(Date.now() - 7_000).toISOString(),
  observed521 = new Date(Date.now() - 41_000).toISOString(),
  signature978 = "signed-978",
  signature521 = "signed-521",
  keyId978 = "fenchain-978-observation-v1",
  keyId521 = "fenchain-521-observation-v1",
  keyRotation978: rotation978 = null,
  refreshMs = 20_000,
} = {}) {
  const generatedAt = new Date().toISOString();
  const observations = [
    {
      chain: "978",
      observed_block: block978,
      observed_at: observed978,
      sequence: sequence978,
      source_quorum: 2,
      status: "confirmed",
      signature: signature978,
      key_id: keyId978,
    },
    {
      chain: "521",
      observed_block: block521,
      observed_at: observed521,
      sequence: sequence521,
      source_quorum: 2,
      status: "confirmed",
      signature: signature521,
      key_id: keyId521,
    },
  ];
  if (rotation978) observations[0].key_rotation = rotation978;
  return {
    version: 1,
    generatedAt,
    refreshMs,
    freshnessSeconds: 90,
    observations,
    chains: [
      {
        expectedChainId: 978,
        chainId: 978,
        status: "live",
        blockNumber: observations[0].observed_block,
        blockAgeSeconds: 7,
        checkedAt: observations[0].observed_at,
        observationSequence: observations[0].sequence,
        confirmation: { evidenceSource: "signed-observation", confidence: "confirmed" },
      },
      {
        expectedChainId: 521,
        chainId: 521,
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

function rotationBinding(fromSequence, toKeyId = "fenchain-978-observation-v2") {
  return {
    version: 1,
    certificate_sha256: "a".repeat(64),
    from_key_id: "fenchain-978-observation-v1",
    from_payload_sha256: "b".repeat(64),
    from_sequence: fromSequence,
    to_key_id: toKeyId,
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

async function mockSequentialPublicMonitor(page, responses) {
  let requestCount = 0;
  await page.route("**/api/chain-progress", async (route) => {
    const response = responses[Math.min(requestCount, responses.length - 1)];
    requestCount += 1;
    if (response instanceof Error) {
      await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"unavailable"}' });
      return;
    }
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(response) });
  });
  return () => requestCount;
}

for (const [label, mutate] of [
  ["unknown schema version", (payload) => { payload.version = 999; }],
  ["unknown chain state", (payload) => { payload.chains[0].status = "untrusted"; }],
]) {
  test(`Overview fails closed on ${label}`, async ({ page }) => {
    const assertBoundary = protectLiveBoundary(page);
    const payload = monitorPayload();
    mutate(payload);
    await mockPublicMonitor(page, payload);
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoPublic(page, "/");

    const card = page.locator('.desktop-chain-progress [data-chain-card="978"]');
    await expect(card.locator('[data-chain-field="978-status"]')).toHaveText("Failure");
    await expect(card.locator('[data-chain-field="978-block"]')).toHaveText("Observation unavailable");
    await expect(card).toHaveAttribute("data-status", "unavailable");
    await expect(page.locator('[data-chain-meta="feed-status"]').first()).toHaveText("retrying");
    await expect(card).not.toContainText("333,682");
    assertBoundary();
  });
}

test("Overview removes current-state claims after a successful snapshot is followed by feed failure", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  const requestCount = await mockSequentialPublicMonitor(page, [monitorPayload({ refreshMs: 60_000 }), new Error("unavailable")]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoPublic(page, "/");

  const card = page.locator('.desktop-chain-progress [data-chain-card="978"]');
  await expect.poll(requestCount).toBe(1);
  await expect(card.locator('[data-chain-field="978-status"]')).toHaveText("Live");
  await expect(card.locator('[data-chain-field="978-block"]')).toHaveText("333,682");
  await expect(card).toHaveAttribute("data-status", "confirmed");

  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(requestCount).toBe(2);
  await expect(card.locator('[data-chain-field="978-status"]')).toHaveText("Failure");
  await expect(card.locator('[data-chain-field="978-block"]')).toHaveText(/Last accepted 333,682 · not current/);
  await expect(card.locator('[data-chain-field="978-checked"]')).toHaveText("no current observation");
  await expect(card.locator('[data-chain-field="978-confidence"]')).toHaveText("Unavailable");
  await expect(card).toHaveAttribute("data-status", "unavailable");
  await expect(page.locator('[data-chain-meta="feed-status"]').first()).toHaveText("retrying");
  assertBoundary();
});

test("Overview accepts an authenticated key rotation in an open browser session", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  const initialObservedAt = new Date(Date.now() - 9_000).toISOString();
  const rotatedObservedAt = new Date(Date.parse(initialObservedAt) + 2_000).toISOString();
  const initial = monitorPayload({ observed978: initialObservedAt, refreshMs: 60_000 });
  const rotated = monitorPayload({
    sequence978: initial.observations[0].sequence + 3,
    block978: initial.observations[0].observed_block + 3,
    observed978: rotatedObservedAt,
    signature978: "signed-978-rotated",
    keyId978: "fenchain-978-observation-v2",
    keyRotation978: rotationBinding(initial.observations[0].sequence + 2),
    refreshMs: 60_000,
  });
  const requestCount = await mockSequentialPublicMonitor(page, [initial, rotated]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoPublic(page, "/");

  const card = page.locator('.desktop-chain-progress [data-chain-card="978"]');
  await expect.poll(requestCount).toBe(1);
  await expect(card.locator('[data-chain-field="978-status"]')).toHaveText("Live");
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(requestCount).toBe(2);
  await expect(card.locator('[data-chain-field="978-status"]')).toHaveText("Live");
  await expect(card.locator('[data-chain-field="978-activity"]')).toContainText(
    "authenticated key rotation accepted"
  );
  await expect(card.locator('[data-chain-field="978-block"]')).toHaveText("333,685");
  assertBoundary();
});

test("Overview accepts a fail-closed unavailable chain without asserting a current observation", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  const payload = monitorPayload({ refreshMs: 60_000 });
  payload.observations = payload.observations.filter((observation) => observation.chain !== "978");
  payload.chains[0] = {
    expectedChainId: 978,
    chainId: null,
    status: "unavailable",
    blockNumber: null,
    blockAgeSeconds: null,
    checkedAt: payload.generatedAt,
    observationSequence: null,
    confirmation: { evidenceSource: "unavailable", confidence: "unavailable" },
  };
  await mockPublicMonitor(page, payload);
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoPublic(page, "/");

  const unavailableCard = page.locator('.desktop-chain-progress [data-chain-card="978"]');
  await expect(unavailableCard.locator('[data-chain-field="978-status"]')).toHaveText("Unavailable");
  await expect(unavailableCard.locator('[data-chain-field="978-block"]')).toHaveText("Observation unavailable");
  await expect(unavailableCard.locator('[data-chain-field="978-confidence"]')).toHaveText("Unavailable");
  await expect(unavailableCard).toHaveAttribute("data-status", "unavailable");

  const liveCard = page.locator('.desktop-chain-progress [data-chain-card="521"]');
  await expect(liveCard.locator('[data-chain-field="521-status"]')).toHaveText("Live");
  await expect(liveCard.locator('[data-chain-field="521-block"]')).toHaveText("272,007");
  assertBoundary();
});

test("Evidence keeps the Overview mobile live blocks without extra API access", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await gotoPublic(page, "/evidence");
  await expect(page.locator(".evidence-table")).toBeVisible();
  await expectMobileLiveBlocks(page);
  await noHorizontalOverflow(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await expectUnifiedMobileHeaderPlacement(page);
  assertBoundary();
});

test("Public intro and mobile header stay within the unified geometry contract", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  await mockPublicMonitor(page, monitorPayload());
  await page.setViewportSize({ width: 1440, height: 1100 });
  await gotoPublic(page, "/");
  const desktop = await page.evaluate(() => {
    const hero = document.querySelector(".route-hero");
    const heading = hero.querySelector("h1");
    const headingStyle = getComputedStyle(heading);
    return {
      heroHeight: hero.getBoundingClientRect().height,
      headingLines: heading.getBoundingClientRect().height / Number.parseFloat(headingStyle.lineHeight),
    };
  });
  expect(desktop.heroHeight).toBeLessThanOrEqual(430);
  expect(desktop.headingLines).toBeLessThanOrEqual(2.05);
  await noHorizontalOverflow(page);

  await page.setViewportSize({ width: 375, height: 812 });
  const mobile = await page.locator(".site-header-live").evaluate((header) => ({
    headerHeight: header.getBoundingClientRect().height,
    minimumNavTarget: Math.min(
      ...[...header.querySelectorAll(".site-nav a")].map((link) => link.getBoundingClientRect().height)
    ),
    navOverflow: getComputedStyle(header.querySelector(".site-nav")).overflowX,
  }));
  expect(mobile.headerHeight).toBeLessThanOrEqual(430);
  expect(mobile.minimumNavTarget).toBeGreaterThanOrEqual(44);
  expect(["auto", "scroll"]).toContain(mobile.navOverflow);
  await page.locator(".brand").focus();
  for (let index = 0; index < 12; index += 1) await page.keyboard.press("Tab");
  const legalNav = page.locator(".site-nav .nav-legal");
  await expect(legalNav).toBeFocused();
  await expect.poll(() => legalNav.evaluate((link) => {
    const linkBox = link.getBoundingClientRect();
    const navBox = link.closest(".site-nav").getBoundingClientRect();
    return linkBox.left >= navBox.left - 1 && linkBox.right <= navBox.right + 1;
  })).toBe(true);
  await noHorizontalOverflow(page);
  assertBoundary();
});

test("Global footer exposes verified profiles and the business contact without overflow", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  await mockPublicMonitor(page, monitorPayload());
  await page.setViewportSize({ width: 375, height: 812 });
  await gotoPublic(page, "/");
  const footer = page.locator(".site-footer");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer.locator('a[href="mailto:partnerships@fenrua.ai"]')).toHaveText("partnerships@fenrua.ai");
  await expect(footer.getByRole("link", { name: "X", exact: true })).toHaveAttribute("href", "https://x.com/FenruaLabs");
  await expect(footer.getByRole("link", { name: "LinkedIn", exact: true })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/fenrua-labs-80b679388",
  );
  await noHorizontalOverflow(page);
  assertBoundary();
});

test("Legal Centre publishes the verified company identity without a transaction surface", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  const payload = monitorPayload();
  await mockPublicMonitor(page, payload);
  await page.setViewportSize({ width: 320, height: 900 });
  await gotoPublic(page, "/legal");
  await expect(page.getByRole("heading", { name: "Legal and Company Centre" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI efficiency infrastructure and related services" })).toBeVisible();
  const companyFacts = page.locator(".company-facts");
  await expect(companyFacts.getByText("ABN 62 700 182 663", { exact: true })).toBeVisible();
  await expect(companyFacts.getByText("ACN 700 182 663", { exact: true })).toBeVisible();
  const operatingTable = page.locator(".legal-operating-table");
  await expect(operatingTable.locator("tbody tr")).toHaveCount(7);
  await expect(operatingTable.getByText("AVAILABLE BY OFFER", { exact: true })).toBeVisible();
  await expect(operatingTable.getByText("AVAILABLE BY AGREEMENT", { exact: true })).toBeVisible();
  await expect(page.getByText(/\b(?:XP|Fortnight League|Picker|community activity|bounded rewards)\b/i)).toHaveCount(0);
  await expect(page.locator("form, [data-wallet-connect], [data-checkout], [data-payment-receiver]")).toHaveCount(0);
  await expectMobileLiveBlocks(page);
  await noHorizontalOverflow(page);

  await page.setViewportSize({ width: 1440, height: 1000 });
  const introRail = page.locator(".route-hero-chain-rail");
  await expect(introRail).toBeVisible();
  await expect(introRail.locator('[data-chain-field="978-block"]')).toHaveText(
    new Intl.NumberFormat("en-US").format(payload.chains[0].blockNumber)
  );
  await expect(introRail.locator('[data-chain-field="521-block"]')).toHaveText(
    new Intl.NumberFormat("en-US").format(payload.chains[1].blockNumber)
  );
  await noHorizontalOverflow(page);
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
  const releaseTable = page.getByRole("region", { name: "Static public release records" });
  await expect.poll(() => releaseTable.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  const longArtifact = releaseTable.locator('.status-artifact-value[title="/docs/ACCESS_ONLY_COMMERCIAL_BOUNDARY.md"]');
  await expect(longArtifact).toHaveCSS("-webkit-line-clamp", "2");
  await expect.poll(() => longArtifact.evaluate((element) => {
    const style = getComputedStyle(element);
    return element.getBoundingClientRect().height <= Number.parseFloat(style.lineHeight) * 2 + 1;
  })).toBe(true);
  await expect.poll(() => releaseTable.locator('td[data-label="Current limitation"]').first().evaluate((cell) => {
    const cellBox = cell.getBoundingClientRect();
    const tableBox = cell.closest(".status-table").getBoundingClientRect();
    return cellBox.left >= tableBox.left - 1 && cellBox.right <= tableBox.right + 1;
  })).toBe(true);
  await expect(page.locator(".route-hero-chain-rail")).toBeVisible();
  await expect(page.locator("[data-chain-card]")).toHaveCount(4);
  assertBoundary();
});

test("Status reuses its isolated monitor for the compact desktop intro cards", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  await mockPublicMonitor(page, monitorPayload());
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoPublic(page, "/status");
  await expect(page.locator(".mobile-chain-rail")).toBeHidden();
  await expect(page.locator(".route-hero-chain-rail")).toBeVisible();
  await expect(page.locator("[data-chain-card]")).toHaveCount(4);
  await expect(page.locator('.route-hero-chain-rail [data-chain-field="978-status"]')).toHaveText("Live");
  await expect(page.locator('.route-hero-chain-rail [data-chain-field="521-status"]')).toHaveText("Live");
  await expect(page.locator('[data-status-monitor-row="978"] [data-status-monitor-state]')).toHaveText("Live");
  expect(assertBoundary.liveRequests.filter((path) => path === "/api/chain-progress")).toHaveLength(1);
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

test("Status rejects a signed rollback, preserves high-water, and recovers only on a later advance", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  const initialObservedAt = new Date(Date.now() - 9_000).toISOString();
  const recoveredObservedAt = new Date(Date.parse(initialObservedAt) + 2_000).toISOString();
  const initial = monitorPayload({ observed978: initialObservedAt, refreshMs: 60_000 });
  const rollback = structuredClone(initial);
  rollback.generatedAt = new Date().toISOString();
  rollback.observations[0].sequence -= 1;
  rollback.observations[0].observed_block -= 1;
  rollback.observations[0].signature = "signed-978-rollback";
  rollback.chains[0].observationSequence = rollback.observations[0].sequence;
  rollback.chains[0].blockNumber = rollback.observations[0].observed_block;
  const recovered = structuredClone(initial);
  recovered.generatedAt = new Date().toISOString();
  recovered.observations[0].sequence += 1;
  recovered.observations[0].observed_block += 1;
  recovered.observations[0].observed_at = recoveredObservedAt;
  recovered.observations[0].signature = "signed-978-recovered";
  recovered.chains[0].observationSequence = recovered.observations[0].sequence;
  recovered.chains[0].blockNumber = recovered.observations[0].observed_block;
  recovered.chains[0].checkedAt = recoveredObservedAt;

  const requestCount = await mockSequentialPublicMonitor(page, [initial, rollback, recovered]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoPublic(page, "/status");
  const row = page.locator('[data-status-monitor-row="978"]');
  await expect.poll(requestCount).toBe(1);
  await expect(row.locator("[data-status-monitor-state]")).toHaveText("Live");
  await expect(row.locator("[data-status-monitor-sequence]")).toContainText("2,113");

  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(requestCount).toBe(2);
  await expect(row.locator("[data-status-monitor-state]")).toHaveText("Failure");
  await expect(row.locator("[data-status-monitor-source]")).toContainText("signed sequence rollback rejected");
  await expect(row.locator("[data-status-monitor-sequence]")).toHaveText(/Rejected signed sequence 2,112.*last accepted 2,113/);
  await expect(row.locator("[data-status-monitor-block]")).toHaveText(/Last accepted 333,682.*not current/);
  await expect(row.locator("[data-status-monitor-time]")).toContainText("no current state is asserted");
  await expect(row.locator("[data-status-monitor-time] time")).toHaveCount(0);
  await expect(row).not.toContainText(/reset/i);

  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(requestCount).toBe(3);
  await expect(row.locator("[data-status-monitor-state]")).toHaveText("Live");
  await expect(row.locator("[data-status-monitor-sequence]")).toHaveText(/2,114.*advanced in this browser session/);
  await expect(row.locator("[data-status-monitor-block]")).toHaveText("333,683");
  await expect(row.locator("[data-status-monitor-time] time")).toHaveAttribute("datetime", recoveredObservedAt);
  assertBoundary();
});

test("Status rejects a stale rotation bridge and accepts an authenticated bridge without reload", async ({ page }) => {
  const assertBoundary = protectLiveBoundary(page);
  const initialObservedAt = new Date(Date.now() - 9_000).toISOString();
  const nextObservedAt = new Date(Date.parse(initialObservedAt) + 2_000).toISOString();
  const initial = monitorPayload({ observed978: initialObservedAt, refreshMs: 60_000 });
  const unannounced = monitorPayload({
    sequence978: initial.observations[0].sequence + 3,
    block978: initial.observations[0].observed_block + 3,
    observed978: nextObservedAt,
    signature978: "signed-978-unannounced-key",
    keyId978: "fenchain-978-observation-v2",
    refreshMs: 60_000,
  });
  unannounced.observations[0].key_rotation = rotationBinding(
    initial.observations[0].sequence - 1
  );
  const rotated = structuredClone(unannounced);
  rotated.generatedAt = new Date().toISOString();
  rotated.observations[0].key_rotation = rotationBinding(initial.observations[0].sequence + 2);

  const requestCount = await mockSequentialPublicMonitor(page, [initial, unannounced, rotated]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoPublic(page, "/status");
  const row = page.locator('[data-status-monitor-row="978"]');
  await expect.poll(requestCount).toBe(1);
  await expect(row.locator("[data-status-monitor-state]")).toHaveText("Live");

  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(requestCount).toBe(2);
  await expect(row.locator("[data-status-monitor-state]")).toHaveText("Failure");
  await expect(row.locator("[data-status-monitor-source]")).toContainText("verification-key change rejected");

  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(requestCount).toBe(3);
  await expect(row.locator("[data-status-monitor-state]")).toHaveText("Live");
  await expect(row.locator("[data-status-monitor-sequence]")).toContainText(
    "authenticated key rotation accepted"
  );
  await expect(row.locator("[data-status-monitor-block]")).toHaveText("333,685");
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
    await expect(page.locator("[data-chain-card]")).toHaveCount(4);
    assertBoundary();
  });
}

test("Verify table supports keyboard scrolling and forced-colors focus", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: testOrigin,
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
  await expect(page.locator("[data-chain-card]")).toHaveCount(4);
  assertBoundary();
  await context.close();
});
