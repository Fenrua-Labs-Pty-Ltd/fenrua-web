/* KERNEL_STATUS_START */
const kernelStatus = {
  "repositoryUrl": "https://github.com/fenrualabs/fenrua-kernel",
  "auditLogUrl": "https://github.com/fenrualabs/fenrua-kernel/blob/390f7aeef778ce93db12e16028bc3a788b643c2d/SECURITY_AUDIT_LOG.md",
  "genesisManifestUrl": "https://github.com/fenrualabs/fenrua-kernel/blob/390f7aeef778ce93db12e16028bc3a788b643c2d/tests/genesis/reports/manifest.json",
  "ciUrl": "https://github.com/fenrualabs/fenrua-kernel/actions",
  "regressionUrl": "https://github.com/fenrualabs/fenrua-kernel/blob/390f7aeef778ce93db12e16028bc3a788b643c2d/tests/genesis/reports/regressions/regression-order-sub-cross-limb-borrow.json",
  "versionCommitUrl": "https://github.com/fenrualabs/fenrua-kernel/commit/390f7aeef778ce93db12e16028bc3a788b643c2d",
  "evidenceRevisionUrl": "https://github.com/fenrualabs/fenrua-kernel/commit/85ecc97c026b01b576d735501795951dd293b3ca",
  "versionTag": "sync 390f7aee…",
  "evidenceRevisionTag": "evidence 85ecc97c…",
  "buildStatus": "PASS",
  "auditResolution": "7/7 Findings Resolved",
  "genesisIntegrity": "10/10 Genesis Cases Verified",
  "ciOutput": "Differential: PASS",
  "regressionCoverage": "1 Permanent Regression: PASS",
  "statusSource": "Verified kernel snapshot 390f7aee…",
  "lastSynced": "Evidence report 2026-07-12T11:18:16.000Z",
  "snapshotCommitShort": "390f7aee…",
  "differentialSummary": "500,000 field pairs · 200,000 encodings · 100,000 digests",
  "evidence": [
    {
      "artifact": "Repository Sync Snapshot",
      "hashReference": "390f7aee…",
      "sourceLabel": "Pinned Snapshot",
      "sourceUrl": "https://github.com/fenrualabs/fenrua-kernel/commit/390f7aeef778ce93db12e16028bc3a788b643c2d",
      "copyValue": "390f7aeef778ce93db12e16028bc3a788b643c2d"
    },
    {
      "artifact": "Frozen Evidence Revision",
      "hashReference": "85ecc97c…",
      "sourceLabel": "Evidence Revision",
      "sourceUrl": "https://github.com/fenrualabs/fenrua-kernel/commit/85ecc97c026b01b576d735501795951dd293b3ca",
      "copyValue": "85ecc97c026b01b576d735501795951dd293b3ca"
    },
    {
      "artifact": "Genesis Manifest Record",
      "hashReference": "bd9ec111…",
      "sourceLabel": "Manifest",
      "sourceUrl": "https://github.com/fenrualabs/fenrua-kernel/blob/390f7aeef778ce93db12e16028bc3a788b643c2d/tests/genesis/reports/manifest.json",
      "copyValue": "bd9ec111888ec32e87a5b60776f0118973848e5c096bbed8f25246e7fd3008cd"
    },
    {
      "artifact": "Differential Validation",
      "hashReference": "e74a0ad3…",
      "sourceLabel": "Validation Report",
      "sourceUrl": "https://github.com/fenrualabs/fenrua-kernel/blob/390f7aeef778ce93db12e16028bc3a788b643c2d/tests/audit/final-build-validation.json",
      "copyValue": "e74a0ad32730f5129f3f691eb3c9caab31a98596212594d218056e50a1a26c93"
    }
  ],
  "telemetry": {
    "schemaVersion": "fenrua.web.kernel-telemetry.v1",
    "snapshotCommit": "390f7aeef778ce93db12e16028bc3a788b643c2d",
    "frozenEvidenceRevision": "85ecc97c026b01b576d735501795951dd293b3ca",
    "sourceReport": {
      "path": "tests/genesis/reports/genesis-report.json",
      "fileSha256": "5a1a130f33fbf77cfa36ed9771eeba63a570d27fe347a43e2524d404e55b04b3",
      "recordSha256": "a25a9e1c53b5554fb0b518d0ea54810dcdc7252b8742fe5ca76060f41c4f7960",
      "reportGeneratedAtUtc": "2026-07-12T11:18:16.000Z",
      "url": "https://github.com/fenrualabs/fenrua-kernel/blob/390f7aeef778ce93db12e16028bc3a788b643c2d/tests/genesis/reports/genesis-report.json"
    },
    "suite": {
      "id": "fenrua-pn521-genesis-v1",
      "status": "pass",
      "caseCount": 10,
      "passedCount": 10,
      "failedCount": 0
    },
    "differential": {
      "status": "pass",
      "native": {
        "randomizedFieldPairs": 500000,
        "byteEncodings": 200000,
        "digestRoundtrips": 100000,
        "seedHex": "0x46454e525541"
      },
      "sanitizer": {
        "randomizedFieldPairs": 500000,
        "byteEncodings": 200000,
        "digestRoundtrips": 100000,
        "seedHex": "0x46454e525541",
        "addressSanitizer": true,
        "undefinedBehaviorSanitizer": true,
        "leakDetection": true
      },
      "source": {
        "path": "tests/audit/final-build-validation.json",
        "fileSha256": "e74a0ad32730f5129f3f691eb3c9caab31a98596212594d218056e50a1a26c93",
        "url": "https://github.com/fenrualabs/fenrua-kernel/blob/390f7aeef778ce93db12e16028bc3a788b643c2d/tests/audit/final-build-validation.json"
      }
    },
    "regressions": [
      {
        "id": "regression-order-sub-cross-limb-borrow",
        "classification": "permanent-borrow-chain-regression",
        "domain": "N521_ORDER",
        "operation": "subtract-mod-n",
        "status": "pass",
        "fixture": {
          "name": "regression_001_p521_sub_overflow.bin",
          "bytes": 132,
          "sha256": "7d11e62691085056fde7193c23cc7b3ffbfde2171807f820fc94cecf6f19ee5e",
          "encoding": "A[66] || B[66], fixed-width unsigned big-endian",
          "url": "https://github.com/fenrualabs/fenrua-kernel/blob/390f7aeef778ce93db12e16028bc3a788b643c2d/regressions/regression_001_p521_sub_overflow.bin"
        },
        "report": {
          "recordSha256": "a5c49db6dd40bee3185399b622ff5eb7845501d0a725e7aa561204766a19abfa",
          "fileSha256": "c7a2de386f54f74de0ff9e8b3147882035d08bf69f1cfbef78467d5099267cc0",
          "bytes": 2643,
          "url": "https://github.com/fenrualabs/fenrua-kernel/blob/390f7aeef778ce93db12e16028bc3a788b643c2d/tests/genesis/reports/regressions/regression-order-sub-cross-limb-borrow.json"
        }
      }
    ]
  }
};
/* KERNEL_STATUS_END */

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = value;
  });
}

function setHref(selector, value) {
  document.querySelectorAll(selector).forEach((node) => {
    node.setAttribute("href", value);
  });
}

function makeCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function copyHash(value, button) {
  const setCopied = () => {
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = "Copy";
    }, 1400);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(value).then(setCopied).catch(() => fallbackCopy(value, button));
    return;
  }

  fallbackCopy(value, button);
}

function fallbackCopy(value, button) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "readonly");
  textarea.className = "copy-buffer";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  button.textContent = "Copied";
  window.setTimeout(() => {
    button.textContent = "Copy";
  }, 1400);
}

function hydrateRegistry() {
  const registry = document.querySelector("#evidence-registry");
  if (!registry) return;

  registry.replaceChildren(
    ...kernelStatus.evidence.map((record) => {
      const row = document.createElement("tr");
      const hashCell = makeCell("");
      const hash = document.createElement("code");
      const sourceCell = makeCell("");
      const source = document.createElement("a");
      const copyCell = makeCell("");
      const button = document.createElement("button");

      row.dataset.search = `${record.artifact} ${record.hashReference} ${record.sourceLabel}`.toLowerCase();
      hash.textContent = record.hashReference;
      hashCell.append(hash);
      source.href = record.sourceUrl;
      source.textContent = record.sourceLabel;
      sourceCell.append(source);
      button.type = "button";
      button.textContent = "Copy";
      button.addEventListener("click", () => copyHash(record.copyValue, button));
      copyCell.append(button);

      row.append(makeCell(record.artifact), hashCell, sourceCell, copyCell);
      return row;
    })
  );
}

function makeExternalLink(label, href) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  return link;
}

function makeCopyButton(value) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Copy";
  button.addEventListener("click", () => copyHash(value, button));
  return button;
}

function hydrateRegressionRegistry() {
  const registry = document.querySelector("#regression-registry");
  const regressions = kernelStatus.telemetry?.regressions;
  if (!registry || !Array.isArray(regressions)) return;

  registry.replaceChildren(
    ...regressions.map((regression) => {
      const row = document.createElement("tr");
      const identity = makeCell(regression.id);
      const classification = document.createElement("small");
      const result = makeCell(regression.status.toUpperCase());
      const fixture = makeCell("");
      const fixtureHash = document.createElement("code");
      const fixtureCopy = makeCopyButton(regression.fixture.sha256);
      const evidence = makeCell("");

      classification.textContent = regression.classification;
      identity.append(document.createElement("br"), classification);
      result.classList.add(regression.status === "pass" ? "result-pass" : "result-fail");
      fixture.append(`${regression.fixture.name} · ${regression.fixture.bytes} bytes`, document.createElement("br"));
      fixtureHash.textContent = regression.fixture.sha256;
      fixture.append(fixtureHash, document.createTextNode(" "), fixtureCopy);
      evidence.append(
        makeExternalLink("Fixture", regression.fixture.url),
        document.createTextNode(" · "),
        makeExternalLink("Regression report", regression.report.url)
      );

      row.append(
        identity,
        makeCell(`${regression.domain} · ${regression.operation}`),
        result,
        fixture,
        evidence
      );
      return row;
    })
  );
}

function bindRegistrySearch() {
  const input = document.querySelector("#registry-search");
  const registry = document.querySelector("#evidence-registry");
  if (!input || !registry) return;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    registry.querySelectorAll("tr").forEach((row) => {
      row.hidden = query.length > 0 && !row.dataset.search.includes(query);
    });
  });
}

function hydrateKernelStatus() {
  Object.entries(kernelStatus).forEach(([key, value]) => {
    if (typeof value === "string") {
      setText(`[data-kernel-field="${key}"]`, value);
    }
  });

  setHref('[data-link="repository"]', kernelStatus.repositoryUrl);
  setHref('[data-link="audit"]', kernelStatus.auditLogUrl);
  setHref('[data-link="genesis"]', kernelStatus.genesisManifestUrl);
  setHref('[data-link="ci"]', kernelStatus.ciUrl);
  setHref('[data-link="regression"]', kernelStatus.regressionUrl);
  setHref('[data-link="version"]', kernelStatus.versionCommitUrl);
  setHref('[data-link="evidence-revision"]', kernelStatus.evidenceRevisionUrl);

  hydrateRegistry();
  hydrateRegressionRegistry();
  bindRegistrySearch();
}

const chainFieldMap = {
  978: {
    chainKey: 978,
    status: '[data-chain-field="978-status"]',
    chainId: '[data-chain-field="978-chain-id"]',
    block: '[data-chain-field="978-block"]',
    delta: '[data-chain-field="978-delta"]',
    headAge: '[data-chain-field="978-head-age"]',
    checked: '[data-chain-field="978-checked"]',
    progress: '[data-chain-field="978-progress"]',
    progressRail: '[data-chain-card="978"] .chain-progress-rail i',
    card: '[data-chain-card="978"]',
  },
  521: {
    chainKey: 521,
    status: '[data-chain-field="521-status"]',
    chainId: '[data-chain-field="521-chain-id"]',
    block: '[data-chain-field="521-block"]',
    delta: '[data-chain-field="521-delta"]',
    headAge: '[data-chain-field="521-head-age"]',
    checked: '[data-chain-field="521-checked"]',
    progress: '[data-chain-field="521-progress"]',
    progressRail: '[data-chain-card="521"] .chain-progress-rail i',
    card: '[data-chain-card="521"]',
  },
};

const chainRefreshMs = 10_000;
const chainFetchTimeoutMs = 8_000;
const chainMaxBackoffMs = 60_000;
const maxCachedSnapshotAgeSeconds = 30;
const maxFreshHeadAgeSeconds = 60;
const lastChainBlocks = {};
const lastChainHeadAges = {};
const lastChainCheckedAt = {};
const chainProbe = {
  nextAt: 0,
  tickId: null,
  readId: null,
  controller: null,
  refreshMs: chainRefreshMs,
  retryMs: chainRefreshMs,
};

function formatNumber(value) {
  return Number.isSafeInteger(value) ? new Intl.NumberFormat("en-US").format(value) : "Reading";
}

function formatCheckedAt(value) {
  if (!value) return "pending";

  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return "pending";
  }
}

function formatHeadAge(value) {
  if (!Number.isSafeInteger(value) || value < 0) return "pending";
  if (value < 60) return `${value}s ago`;
  return `${Math.floor(value / 60)}m ago`;
}

function secondsSince(value) {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 1_000));
}

function effectiveHeadAge(chain) {
  const elapsed = secondsSince(chain.checkedAt);
  if (!Number.isSafeInteger(chain.blockAgeSeconds) || elapsed === null) return null;
  return chain.blockAgeSeconds + elapsed;
}

function normalizeRefreshMs(value) {
  if (!Number.isSafeInteger(value)) return chainRefreshMs;
  return Math.min(Math.max(value, 5_000), 60_000);
}

function cardStatus(chain, previousBlock, delta, outOfOrder) {
  if (chain.status === "wrong-chain") {
    return { label: "Chain ID mismatch", state: "wrong-chain" };
  }

  if (chain.status === "unavailable") {
    return {
      label: Number.isSafeInteger(previousBlock) ? "Updates delayed" : "Updates unavailable",
      state: "unavailable",
    };
  }

  if (chain.status === "delayed") {
    return { label: "Block feed delayed", state: "delayed" };
  }

  if (outOfOrder) {
    return { label: "Waiting for fresh data", state: "delayed" };
  }

  if (delta !== null && delta > 0) {
    return { label: "New block observed", state: "advanced" };
  }

  return { label: "Chain live", state: "confirmed" };
}

function progressLabel(state) {
  if (state === "advanced") return "updated";
  if (state === "confirmed" || state === "waiting") return "active";
  if (state === "delayed") return "delayed";
  if (state === "wrong-chain") return "mismatch";
  return "offline";
}

function updateProgressRail(selector, value) {
  document.querySelectorAll(selector).forEach((rail) => {
    rail.style.setProperty("--chain-progress", `${value}%`);
  });
}

function verificationProgressWidth() {
  if (!chainProbe.nextAt || !chainProbe.refreshMs) return 4;
  const startedAt = chainProbe.nextAt - chainProbe.refreshMs;
  const elapsed = Date.now() - startedAt;
  return Math.min(100, Math.max(4, Math.round((elapsed / chainProbe.refreshMs) * 100)));
}

function updateVerificationRails() {
  const width = verificationProgressWidth();
  Object.values(chainFieldMap).forEach((fields) => updateProgressRail(fields.progressRail, width));
}

function formatChainIdentity(chain) {
  if (chain.chainId === chain.expectedChainId) return `${chain.chainId} · verified`;
  if (Number.isSafeInteger(chain.chainId)) return `${chain.chainId} · expected ${chain.expectedChainId}`;
  return `Expected ${chain.expectedChainId}`;
}

function formatCountdown() {
  if (!chainProbe.nextAt) return "starting";
  const seconds = Math.max(0, Math.ceil((chainProbe.nextAt - Date.now()) / 1000));
  return seconds === 0 ? "refreshing" : `next update in ${seconds}s`;
}

function updateChainCountdown() {
  setText('[data-chain-meta="countdown"]', formatCountdown());
  updateVerificationRails();
  Object.entries(lastChainHeadAges).forEach(([chainId, reportedAge]) => {
    const fields = chainFieldMap[chainId];
    const elapsed = secondsSince(lastChainCheckedAt[chainId]);
    if (fields && elapsed !== null) setText(fields.headAge, formatHeadAge(reportedAge + elapsed));
  });
}

function startChainCountdown() {
  if (chainProbe.tickId) return;
  chainProbe.tickId = window.setInterval(updateChainCountdown, 1_000);
}

function updateChainMeta(payload, cardStates) {
  const refreshMs = normalizeRefreshMs(payload.refreshMs);
  chainProbe.refreshMs = refreshMs;
  chainProbe.nextAt = Date.now() + refreshMs;

  const healthy = cardStates.filter((state) => state === "confirmed" || state === "waiting" || state === "advanced");
  const feedStatus = healthy.length
    ? "live"
    : cardStates.every((state) => state === "wrong-chain")
      ? "chain mismatch"
      : cardStates.every((state) => state === "unavailable")
        ? "unavailable"
        : "delayed";
  setText('[data-chain-meta="feed-status"]', feedStatus);
  setText('[data-chain-meta="announcer"]', `Chain feed is ${feedStatus}.`);
  setText('[data-chain-meta="generated"]', formatCheckedAt(payload.generatedAt));
  updateChainCountdown();
}

function updateChainCard(chain, payload) {
  const fields = chainFieldMap[chain.expectedChainId];
  if (!fields) return "unavailable";

  const previousBlock = lastChainBlocks[chain.expectedChainId];
  const snapshotAge = secondsSince(payload.generatedAt);
  const agedHead = effectiveHeadAge(chain);
  const displayChain = {
    ...chain,
    blockAgeSeconds: agedHead,
    status:
      chain.status === "live" &&
      (snapshotAge === null || snapshotAge > maxCachedSnapshotAgeSeconds || agedHead === null || agedHead > maxFreshHeadAgeSeconds)
        ? "delayed"
        : chain.status,
  };
  const hasCurrentBlock = Number.isSafeInteger(chain.blockNumber);
  const checkedAt = Date.parse(chain.checkedAt);
  const outOfOrder =
    hasCurrentBlock &&
    ((Number.isSafeInteger(previousBlock) && chain.blockNumber < previousBlock) ||
      (Number.isFinite(checkedAt) &&
        Number.isFinite(Date.parse(lastChainCheckedAt[chain.expectedChainId])) &&
        checkedAt < Date.parse(lastChainCheckedAt[chain.expectedChainId])));
  const delta =
    hasCurrentBlock && Number.isSafeInteger(previousBlock) && !outOfOrder
      ? Math.max(0, chain.blockNumber - previousBlock)
      : null;
  const status = cardStatus(displayChain, previousBlock, delta, outOfOrder);

  setText(fields.status, status.label);
  setText(fields.progress, progressLabel(status.state));
  setText(fields.chainId, formatChainIdentity(chain));
  if (hasCurrentBlock) {
    setText(fields.block, formatNumber(chain.blockNumber));
    setText(
      fields.delta,
      delta === null ? "Initial read confirmed" : delta > 0 ? `+${delta} blocks since last check` : "No new block since last check"
    );
    setText(fields.headAge, formatHeadAge(displayChain.blockAgeSeconds));
    setText(fields.checked, formatCheckedAt(chain.checkedAt));
  } else if (Number.isSafeInteger(previousBlock)) {
    setText(fields.delta, "Last verified value retained");
  }

  if (hasCurrentBlock && displayChain.status === "live" && !outOfOrder) {
    lastChainBlocks[chain.expectedChainId] = chain.blockNumber;
    lastChainHeadAges[chain.expectedChainId] = chain.blockAgeSeconds;
    lastChainCheckedAt[chain.expectedChainId] = chain.checkedAt;
  }

  document.querySelectorAll(fields.card).forEach((card) => {
    card.dataset.status = status.state;
  });

  return status.state;
}

function scheduleChainRead(delay) {
  if (chainProbe.readId) window.clearTimeout(chainProbe.readId);
  if (document.hidden) return;

  chainProbe.readId = window.setTimeout(() => {
    chainProbe.readId = null;
    void readChainProgress();
  }, Math.max(0, delay));
}

function showFeedFailure() {
  chainProbe.nextAt = Date.now() + chainProbe.retryMs;
  setText('[data-chain-meta="feed-status"]', "retrying");
  updateChainCountdown();

  Object.values(chainFieldMap).forEach((fields) => {
    const hasLastBlock = Number.isSafeInteger(lastChainBlocks[fields.chainKey]);
    setText(fields.status, hasLastBlock ? "Updates delayed" : "Updates unavailable");
    if (hasLastBlock) setText(fields.delta, "Last verified value retained");
    document.querySelectorAll(fields.card).forEach((card) => {
      card.dataset.status = "unavailable";
    });
  });
}

async function fetchChainProgress() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), chainFetchTimeoutMs);
  chainProbe.controller = controller;

  try {
    const response = await fetch("/api/chain-progress", { signal: controller.signal });
    if (!response.ok) throw new Error("Chain feed unavailable");

    const payload = await response.json();
    if (!Array.isArray(payload.chains)) throw new Error("Missing chain progress");
    return payload;
  } finally {
    window.clearTimeout(timeout);
    if (chainProbe.controller === controller) chainProbe.controller = null;
  }
}

async function readChainProgress() {
  if (document.hidden || chainProbe.controller) return;

  try {
    const payload = await fetchChainProgress();
    const cardStates = payload.chains.map((chain) => updateChainCard(chain, payload));
    updateChainMeta(payload, cardStates);
    chainProbe.retryMs = chainProbe.refreshMs;
    scheduleChainRead(chainProbe.refreshMs);
  } catch {
    chainProbe.retryMs = Math.min(
      chainMaxBackoffMs,
      Math.max(chainProbe.refreshMs, chainProbe.retryMs * 2)
    );
    showFeedFailure();
    scheduleChainRead(chainProbe.retryMs);
  }
}

function hydrateChainProgress() {
  if (!document.querySelector("[data-chain-card]")) return;

  startChainCountdown();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (chainProbe.readId) window.clearTimeout(chainProbe.readId);
      chainProbe.readId = null;
      return;
    }
    chainProbe.nextAt = 0;
    updateChainCountdown();
    scheduleChainRead(0);
  });
  window.addEventListener("online", () => scheduleChainRead(0));
  void readChainProgress();
}

hydrateKernelStatus();
hydrateChainProgress();
