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
    checked: '[data-chain-field="978-checked"]',
    source: '[data-chain-field="978-source"]',
    confidence: '[data-chain-field="978-confidence"]',
    activity: '[data-chain-field="978-activity"]',
    progress: '[data-chain-field="978-progress"]',
    progressRail: '[data-chain-card="978"] .chain-progress-rail i',
    card: '[data-chain-card="978"]',
  },
  521: {
    chainKey: 521,
    status: '[data-chain-field="521-status"]',
    chainId: '[data-chain-field="521-chain-id"]',
    block: '[data-chain-field="521-block"]',
    checked: '[data-chain-field="521-checked"]',
    source: '[data-chain-field="521-source"]',
    confidence: '[data-chain-field="521-confidence"]',
    activity: '[data-chain-field="521-activity"]',
    progress: '[data-chain-field="521-progress"]',
    progressRail: '[data-chain-card="521"] .chain-progress-rail i',
    card: '[data-chain-card="521"]',
  },
};

const chainRefreshMs = 20_000;
const chainFetchTimeoutMs = 8_000;
const chainMaxBackoffMs = 60_000;
const maxSnapshotAgeSeconds = 30;
const defaultFreshnessSeconds = 90;
const chainProbe = {
  nextAt: 0,
  tickId: null,
  readId: null,
  controller: null,
  refreshMs: chainRefreshMs,
  retryMs: chainRefreshMs,
  freshnessSeconds: defaultFreshnessSeconds,
  hasSnapshot: false,
  sequences: new Map(),
};

function formatNumber(value) {
  return Number.isSafeInteger(value) ? new Intl.NumberFormat("en-US").format(value) : "Observation unavailable";
}

function formatCheckedAt(value) {
  if (!value) return "not observed";

  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return "not observed";
  }
}

function secondsSince(value) {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 1_000));
}

function effectiveHeadAge(chain, payload) {
  // `blockAgeSeconds` is already calculated from `observed_at` by the server.
  // Add only time since this browser received the snapshot; adding checkedAt
  // again would double-count the same age and cause false stale states.
  const elapsed = secondsSince(payload.generatedAt);
  if (!Number.isSafeInteger(chain.blockAgeSeconds) || elapsed === null) return null;
  return chain.blockAgeSeconds + elapsed;
}

function normalizeRefreshMs(value) {
  if (!Number.isSafeInteger(value)) return chainRefreshMs;
  return Math.min(Math.max(value, 5_000), 60_000);
}

function normalizeFreshnessSeconds(value) {
  if (!Number.isSafeInteger(value)) return defaultFreshnessSeconds;
  return Math.min(Math.max(value, 30), 300);
}

function cardStatus(chain) {
  if (chain.status === "waiting") {
    return { label: "Awaiting signed observation", state: "waiting" };
  }

  if (chain.status === "wrong-chain") {
    return { label: "Failure", state: "wrong-chain" };
  }

  if (chain.status === "unavailable") {
    return {
      label: "Unavailable",
      state: "unavailable",
    };
  }

  if (chain.status === "delayed") {
    return { label: "Stale", state: "delayed" };
  }

  if (chain.status === "partial") {
    return { label: "Partial", state: "partial" };
  }

  return { label: "Live", state: "confirmed" };
}

function progressLabel(state) {
  if (state === "confirmed") return "success";
  if (state === "partial") return "partial";
  if (state === "waiting") return "loading";
  if (state === "delayed") return "stale";
  if (state === "wrong-chain") return "failure";
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

function formatSource(value) {
  if (value === "awaiting-signed-observation") return "Evidence source: awaiting signed observation";
  if (value === "signed-observation") return "Evidence source: signed bounded observation";
  if (value === "stale-observation") return "Evidence source: signed observation (stale)";
  if (value === "partial-observation") return "Evidence source: partial observation";
  if (value === "confirmed") return "Evidence source: live observation confirmed";
  if (value === "stale") return "Evidence source: stale observation";
  if (value === "mismatch") return "Evidence source: chain mismatch";
  return "Evidence source: unavailable";
}

function describeSignedActivity(chain) {
  const sequence = chain.observationSequence;
  if (!Number.isSafeInteger(sequence)) {
    return chain.status === "waiting"
      ? { label: "Awaiting signed observation", state: "waiting" }
      : { label: "No verified sequence", state: "unavailable" };
  }

  const previous = chainProbe.sequences.get(chain.expectedChainId);
  chainProbe.sequences.set(chain.expectedChainId, sequence);

  if (!Number.isSafeInteger(previous)) {
    return { label: `Signed sequence ${formatNumber(sequence)} · current`, state: "steady" };
  }
  if (sequence > previous) {
    return { label: `Signed sequence ${formatNumber(sequence)} · advanced`, state: "advanced" };
  }
  if (sequence < previous) {
    return { label: `Signed sequence ${formatNumber(sequence)} · reset`, state: "reset" };
  }
  return { label: `Signed sequence ${formatNumber(sequence)} · current`, state: "steady" };
}

function formatConfidence(value) {
  if (value === "confirmed") return "Confidence: confirmed";
  if (value === "partial") return "Confidence: scoped";
  if (value === "stale") return "Confidence: stale";
  if (value === "failure") return "Confidence: failure";
  if (value === "success") return "Confidence: confirmed";
  return "Confidence: unavailable";
}

function formatCountdown() {
  if (!chainProbe.nextAt) return "starting";
  const seconds = Math.max(0, Math.ceil((chainProbe.nextAt - Date.now()) / 1000));
  return seconds === 0 ? "refreshing" : `next update in ${seconds}s`;
}

function updateChainCountdown() {
  setText('[data-chain-meta="countdown"]', formatCountdown());
  updateVerificationRails();
}

function startChainCountdown() {
  if (chainProbe.tickId) return;
  chainProbe.tickId = window.setInterval(updateChainCountdown, 1_000);
}

function updateChainMeta(payload, cardStates) {
  const refreshMs = normalizeRefreshMs(payload.refreshMs);
  chainProbe.refreshMs = refreshMs;
  chainProbe.freshnessSeconds = normalizeFreshnessSeconds(payload.freshnessSeconds);
  chainProbe.nextAt = Date.now() + refreshMs;

  const healthy = cardStates.filter((state) => state === "confirmed" || state === "partial" || state === "waiting");
  const feedStatus = healthy.length
    ? cardStates.every((state) => state === "confirmed")
      ? "success"
      : "partial"
    : cardStates.every((state) => state === "wrong-chain")
      ? "failure"
      : cardStates.every((state) => state === "unavailable")
        ? "unavailable"
        : "stale";
  setText('[data-chain-meta="feed-status"]', feedStatus);
  setText('[data-chain-meta="announcer"]', `Chain feed is ${feedStatus}.`);
  setText('[data-chain-meta="generated"]', formatCheckedAt(payload.generatedAt));
  updateChainCountdown();
}

function updateChainCard(chain, payload) {
  const fields = chainFieldMap[chain.expectedChainId];
  if (!fields) return "unavailable";

  const snapshotAge = secondsSince(payload.generatedAt);
  const agedHead = effectiveHeadAge(chain, payload);
  const displayChain = {
    ...chain,
    blockAgeSeconds: agedHead,
    status:
      chain.status === "live" &&
      (snapshotAge === null ||
        snapshotAge > maxSnapshotAgeSeconds ||
        agedHead === null ||
        agedHead > chainProbe.freshnessSeconds)
        ? "delayed"
        : chain.status,
  };
  const hasCurrentBlock = Number.isSafeInteger(chain.blockNumber);
  const status = cardStatus(displayChain);
  const confirmation = displayChain.confirmation ?? {};
  const activity = describeSignedActivity(displayChain);

  setText(fields.status, status.label);
  setText(fields.progress, progressLabel(status.state));
  setText(fields.chainId, formatChainIdentity(chain));
  setText(fields.block, formatNumber(chain.blockNumber));
  setText(fields.checked, hasCurrentBlock ? formatCheckedAt(chain.checkedAt) : "not observed");
  setText(fields.source, formatSource(confirmation.evidenceSource));
  setText(fields.confidence, formatConfidence(confirmation.confidence));
  setText(fields.activity, activity.label);

  document.querySelectorAll(fields.card).forEach((card) => {
    card.dataset.status = status.state;
    card.dataset.activity = activity.state;
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

  if (!chainProbe.hasSnapshot) {
    Object.values(chainFieldMap).forEach((fields) => {
      const awaiting = fields.chainKey === 521;
      setText(fields.status, awaiting ? "Awaiting signed observation" : "Failure");
      setText(fields.block, "Observation unavailable");
      setText(fields.checked, "not observed");
      setText(
        fields.source,
        awaiting ? "Evidence source: awaiting signed observation" : "Evidence source: unavailable"
      );
      setText(fields.confidence, "Confidence: unavailable");
      setText(fields.activity, awaiting ? "Awaiting signed observation" : "No verified sequence");
      setText(fields.progress, awaiting ? "loading" : "retrying");
      document.querySelectorAll(fields.card).forEach((card) => {
        card.dataset.status = awaiting ? "waiting" : "unavailable";
        card.dataset.activity = awaiting ? "waiting" : "unavailable";
      });
    });
  }
}

async function fetchChainProgress() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), chainFetchTimeoutMs);
  chainProbe.controller = controller;

  try {
    const response = await fetch("/api/chain-progress", {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    });
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
    chainProbe.hasSnapshot = true;
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
