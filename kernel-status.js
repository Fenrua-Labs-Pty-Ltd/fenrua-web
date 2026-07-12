const kernelStatus = {
  repositoryUrl: "https://github.com/fenrualabs/fenrua-kernel",
  auditLogUrl: "docs/SECURITY_AUDIT_LOG.md",
  genesisManifestUrl: "docs/GENESIS_MANIFEST.md",
  ciUrl: "https://github.com/fenrualabs/fenrua-kernel/actions",
  regressionUrl: "docs/REGRESSION_HISTORY.md",
  versionCommitUrl: "https://github.com/fenrualabs/fenrua-kernel/commit/390f7ae",
  versionTag: "v.390f7ae",
  buildStatus: "PASS",
  auditResolution: "7/7 Findings Resolved",
  genesisIntegrity: "14/14 Genesis Files Verified",
  ciOutput: "Hardening: PASS",
  regressionCoverage: "Active",
  statusSource: "kernel-status.js",
  lastSynced: "DayZero static manifest",
  evidence: [
    {
      artifact: "Bedrock Source",
      hashReference: "85ecc97c...",
      sourceLabel: "Link to Source",
      sourceUrl: "https://github.com/fenrualabs/fenrua-kernel/commit/85ecc97c",
      copyValue: "85ecc97c",
    },
    {
      artifact: "Evidence Commit",
      hashReference: "dc36d1f2...",
      sourceLabel: "Link to Evidence",
      sourceUrl: "https://github.com/fenrualabs/fenrua-kernel/commit/dc36d1f2",
      copyValue: "dc36d1f2",
    },
    {
      artifact: "Genesis Manifest",
      hashReference: "bd9ec111...",
      sourceLabel: "Link to Log",
      sourceUrl: "docs/GENESIS_MANIFEST.md",
      copyValue: "bd9ec111",
    },
    {
      artifact: "Audit Report",
      hashReference: "9d9eeffc...",
      sourceLabel: "Link to JSON",
      sourceUrl: "docs/audit-report.json",
      copyValue: "9d9eeffc",
    },
  ],
};

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

  hydrateRegistry();
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
    return { label: "Chain mismatch", state: "wrong-chain" };
  }

  if (chain.status === "unavailable") {
    return {
      label: Number.isSafeInteger(previousBlock) ? "Feed delayed" : "Feed unavailable",
      state: "unavailable",
    };
  }

  if (chain.status === "delayed") {
    return { label: "Head delayed", state: "delayed" };
  }

  if (outOfOrder) {
    return { label: "Awaiting a newer sample", state: "delayed" };
  }

  if (delta !== null && delta > 0) {
    return { label: "New block confirmed", state: "advanced" };
  }

  if (Number.isSafeInteger(previousBlock)) {
    return { label: "Awaiting next block", state: "waiting" };
  }

  return { label: "Head confirmed", state: "confirmed" };
}

function progressLabel(state) {
  if (state === "advanced" || state === "confirmed" || state === "waiting") return "live";
  if (state === "delayed") return "delayed";
  if (state === "wrong-chain") return "mismatch";
  return "offline";
}

function updateProgressRail(selector, value) {
  document.querySelectorAll(selector).forEach((rail) => {
    rail.style.setProperty("--chain-progress", `${value}%`);
  });
}

function blockProgressWidth(chain, hasCurrentBlock, delta) {
  if (hasCurrentBlock && chain.status !== "wrong-chain") {
    return Math.min(100, 42 + (delta ?? 0) * 18);
  }

  return chainProbe.controller ? 22 : 18;
}

function formatCountdown() {
  if (!chainProbe.nextAt) return "starting";
  const seconds = Math.max(0, Math.ceil((chainProbe.nextAt - Date.now()) / 1000));
  return seconds === 0 ? "refreshing" : `next update in ${seconds}s`;
}

function updateChainCountdown() {
  setText('[data-chain-meta="countdown"]', formatCountdown());
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
    ? "observations confirmed"
    : cardStates.every((state) => state === "wrong-chain")
      ? "chain mismatch"
      : cardStates.every((state) => state === "unavailable")
        ? "feed unavailable"
        : "feed delayed";
  setText('[data-chain-meta="feed-status"]', feedStatus);
  setText('[data-chain-meta="announcer"]', `Chain feed ${feedStatus}.`);
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
  updateProgressRail(fields.progressRail, blockProgressWidth(displayChain, hasCurrentBlock, delta));
  setText(fields.chainId, `${chain.chainId ?? "unavailable"} / expected 0x${chain.expectedChainId.toString(16)}`);
  if (hasCurrentBlock) {
    setText(fields.block, formatNumber(chain.blockNumber));
    setText(
      fields.delta,
      delta === null ? "Head confirmed" : delta > 0 ? `+${delta} blocks` : "No new block this read"
    );
    setText(fields.headAge, formatHeadAge(displayChain.blockAgeSeconds));
    setText(fields.checked, formatCheckedAt(chain.checkedAt));
  } else if (Number.isSafeInteger(previousBlock)) {
    setText(fields.delta, "Last confirmed value retained");
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
  setText('[data-chain-meta="feed-status"]', "retrying safely");
  updateChainCountdown();

  Object.values(chainFieldMap).forEach((fields) => {
    const hasLastBlock = Number.isSafeInteger(lastChainBlocks[fields.chainKey]);
    setText(fields.status, hasLastBlock ? "Feed delayed" : "Feed unavailable");
    if (hasLastBlock) setText(fields.delta, "Last confirmed value retained");
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
