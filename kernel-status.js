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
  "statusSource": "Validated public-artifact snapshot 390f7aee…",
  "lastSynced": "Source report generated 2026-07-12T11:18:16.000Z",
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
}

const chainFieldMap = {
  978: {
    chainKey: 978,
    status: '[data-chain-field="978-status"]',
    chainId: '[data-chain-field="978-chain-id"]',
    block: '[data-chain-field="978-block"]',
    checked: '[data-chain-field="978-checked"]',
    sourceHeader: '.header-chain-card [data-chain-field="978-source"]',
    sourceResult: '.desktop-chain-progress [data-chain-field="978-source"]',
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
    sourceHeader: '.header-chain-card [data-chain-field="521-source"]',
    sourceResult: '.desktop-chain-progress [data-chain-field="521-source"]',
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
const defaultFreshnessSeconds = 90;
const partialPresentationGraceSeconds = 60;
const chainProbe = {
  nextAt: 0,
  tickId: null,
  readId: null,
  controller: null,
  refreshMs: chainRefreshMs,
  retryMs: chainRefreshMs,
  freshnessSeconds: defaultFreshnessSeconds,
  hasSnapshot: false,
  snapshot: null,
  highWater: new Map(),
};
const allowedChainStates = new Set(["live", "delayed", "partial", "waiting", "unavailable"]);
const monitoredChainIds = new Set(Object.values(chainFieldMap).map((fields) => fields.chainKey));
const confirmationByState = {
  live: ["signed-observation", "confirmed"],
  delayed: ["stale-observation", "stale"],
  partial: ["partial-observation", "partial"],
  waiting: ["awaiting-signed-observation", "unavailable"],
  unavailable: ["unavailable", "unavailable"],
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isIsoTimestamp(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isSafeNonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

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

function retainedConfirmedObservation(highWater) {
  if (
    !isSafeNonNegativeInteger(highWater?.confirmedBlock) ||
    !isIsoTimestamp(highWater?.confirmedObservedAt)
  ) {
    return null;
  }

  const ageSeconds = secondsSince(highWater.confirmedObservedAt);
  if (ageSeconds === null) return null;
  return {
    blockNumber: highWater.confirmedBlock,
    observedAt: highWater.confirmedObservedAt,
    ageSeconds,
  };
}

function isWithinRevalidationWindow(highWater) {
  if (!Number.isFinite(highWater?.partialSinceMs)) return false;
  return Math.max(0, Date.now() - highWater.partialSinceMs) <= partialPresentationGraceSeconds * 1_000;
}

function effectiveHeadAge(chain) {
  // `checkedAt` is bound to the signed `observed_at` for a confirmed record.
  // Cache age and server generation time are not evidence of the chain head, so
  // the client derives freshness only from this signed observation timestamp.
  return secondsSince(chain.checkedAt);
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

  if (chain.status === "live") {
    return { label: "Live", state: "confirmed" };
  }

  return { label: "Failure", state: "unavailable" };
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

function formatSourceValue(value) {
  if (value === "awaiting-signed-observation") return "awaiting signed observation";
  if (value === "signed-observation") return "signed bounded observation";
  if (value === "stale-observation") return "signed observation (stale)";
  if (value === "partial-observation") return "partial observation";
  if (value === "last-verified-observation") return "last verified signed observation; awaiting next update";
  if (value === "awaiting-next-observation") return "no current signed observation; awaiting next update";
  if (value === "confirmed") return "live observation confirmed";
  if (value === "stale") return "stale observation";
  if (value === "mismatch") return "chain mismatch";
  if (value === "rejected-observation") return "signed observation rejected";
  return "unavailable";
}

function formatSource(value) {
  return `Evidence source: ${formatSourceValue(value)}`;
}

function signedObservationForChain(chain, payload) {
  if (!Array.isArray(payload.observations)) return null;
  const matches = payload.observations.filter(
    (candidate) => isObject(candidate) && String(candidate.chain) === String(chain.expectedChainId)
  );
  if (matches.length !== 1) return null;

  const observation = matches[0];
  if (typeof observation.key_id !== "string" || observation.key_id.length === 0) return null;
  if (typeof observation.signature !== "string" || observation.signature.length === 0) return null;
  if (!isIsoTimestamp(observation.observed_at) || observation.observed_at !== chain.checkedAt) return null;
  if (!Number.isSafeInteger(observation.sequence) || observation.sequence < 1) return null;
  if (chain.observationSequence !== observation.sequence) return null;

  if (chain.status === "live" || chain.status === "delayed") {
    if (
      observation.status !== "confirmed" ||
      observation.source_quorum !== 2 ||
      !isSafeNonNegativeInteger(observation.observed_block) ||
      chain.blockNumber !== observation.observed_block ||
      chain.chainId !== chain.expectedChainId
    ) {
      return null;
    }
  }

  if (
    chain.status === "partial" &&
    (observation.status !== "partial" ||
      !Number.isSafeInteger(observation.source_quorum) ||
      observation.source_quorum < 1 ||
      observation.source_quorum >= 2 ||
      observation.observed_block !== null ||
      chain.blockNumber !== null ||
      chain.chainId !== null)
  ) {
    return null;
  }

  return observation;
}

function isAcceptedKeyRotation(observation, previous, candidate) {
  const rotation = observation.key_rotation;
  if (!isObject(rotation)) return false;
  const fields = Object.keys(rotation).sort();
  const expectedFields = [
    "certificate_sha256",
    "from_key_id",
    "from_payload_sha256",
    "from_sequence",
    "to_key_id",
    "version",
  ];
  return (
    fields.length === expectedFields.length &&
    fields.every((field, index) => field === expectedFields[index]) &&
    rotation.version === 1 &&
    /^[a-f0-9]{64}$/.test(rotation.certificate_sha256) &&
    /^[a-f0-9]{64}$/.test(rotation.from_payload_sha256) &&
    rotation.from_key_id === previous.keyId &&
    Number.isSafeInteger(rotation.from_sequence) &&
    rotation.from_sequence >= previous.sequence &&
    rotation.to_key_id === candidate.keyId &&
    candidate.sequence > rotation.from_sequence
  );
}

function isValidChainRecord(chain, payload) {
  if (!isObject(chain) || !monitoredChainIds.has(chain.expectedChainId) || !allowedChainStates.has(chain.status)) {
    return false;
  }
  if (!isIsoTimestamp(chain.checkedAt) || !isObject(chain.confirmation)) return false;

  const expectedConfirmation = confirmationByState[chain.status];
  if (
    chain.confirmation.evidenceSource !== expectedConfirmation[0] ||
    chain.confirmation.confidence !== expectedConfirmation[1]
  ) {
    return false;
  }

  if (chain.status === "live" || chain.status === "delayed" || chain.status === "partial") {
    if (!Number.isSafeInteger(chain.observationSequence) || chain.observationSequence < 1) return false;
    if (chain.status === "partial") {
      if (chain.blockAgeSeconds !== null) return false;
    } else if (!isSafeNonNegativeInteger(chain.blockAgeSeconds)) {
      return false;
    }
    return signedObservationForChain(chain, payload) !== null;
  }

  if (
    chain.chainId !== null ||
    chain.blockNumber !== null ||
    chain.blockAgeSeconds !== null ||
    chain.observationSequence !== null
  ) {
    return false;
  }
  return !payload.observations.some(
    (observation) => isObject(observation) && String(observation.chain) === String(chain.expectedChainId)
  );
}

function assessSignedActivity(chain, payload) {
  const sequence = chain.observationSequence;
  if (!Number.isSafeInteger(sequence)) {
    return chain.status === "waiting"
      ? { accepted: true, label: "Awaiting signed observation", state: "waiting" }
      : { accepted: true, label: "No verified sequence", state: "unavailable" };
  }

  const observation = signedObservationForChain(chain, payload);
  const previous = chainProbe.highWater.get(chain.expectedChainId);
  if (!observation) {
    return {
      accepted: false,
      reason: "signed observation binding rejected",
      highWater: previous,
    };
  }

  const candidate = {
    keyId: observation.key_id,
    sequence: observation.sequence,
    confirmedBlock: isSafeNonNegativeInteger(observation.observed_block)
      ? observation.observed_block
      : previous?.confirmedBlock ?? null,
    confirmedObservedAt: isSafeNonNegativeInteger(observation.observed_block)
      ? observation.observed_at
      : previous?.confirmedObservedAt ?? null,
    partialSinceMs: isSafeNonNegativeInteger(observation.observed_block)
      ? null
      : previous?.partialSinceMs ?? Date.now(),
    observedAt: observation.observed_at,
    signature: observation.signature,
  };

  if (!previous) {
    chainProbe.highWater.set(chain.expectedChainId, candidate);
    return {
      accepted: true,
      label: `Signed sequence ${formatNumber(sequence)} · current`,
      state: "steady",
      highWater: candidate,
    };
  }
  const acceptedKeyRotation =
    candidate.keyId !== previous.keyId && isAcceptedKeyRotation(observation, previous, candidate);
  if (candidate.keyId !== previous.keyId && !acceptedKeyRotation) {
    return { accepted: false, reason: "verification-key change rejected", highWater: previous };
  }
  if (candidate.sequence < previous.sequence) {
    return { accepted: false, reason: "signed sequence rollback rejected", highWater: previous };
  }
  if (candidate.sequence === previous.sequence) {
    const isIdentical =
      candidate.signature === previous.signature &&
      candidate.observedAt === previous.observedAt &&
      candidate.confirmedBlock === previous.confirmedBlock &&
      candidate.confirmedObservedAt === previous.confirmedObservedAt &&
      candidate.partialSinceMs === previous.partialSinceMs;
    return isIdentical
      ? {
          accepted: true,
          label: `Signed sequence ${formatNumber(sequence)} · current`,
          state: "steady",
          highWater: previous,
        }
      : { accepted: false, reason: "same-sequence equivocation rejected", highWater: previous };
  }
  if (Date.parse(candidate.observedAt) < Date.parse(previous.observedAt)) {
    return { accepted: false, reason: "observation-time rollback rejected", highWater: previous };
  }
  if (
    isSafeNonNegativeInteger(observation.observed_block) &&
    isSafeNonNegativeInteger(previous.confirmedBlock) &&
    observation.observed_block < previous.confirmedBlock
  ) {
    return { accepted: false, reason: "confirmed-block rollback rejected", highWater: previous };
  }

  chainProbe.highWater.set(chain.expectedChainId, candidate);
  return {
    accepted: true,
    label: acceptedKeyRotation
      ? `Signed sequence ${formatNumber(sequence)} · authenticated key rotation accepted`
      : `Signed sequence ${formatNumber(sequence)} · advanced`,
    state: acceptedKeyRotation ? "rotated" : "advanced",
    highWater: candidate,
  };
}

function formatConfidence(value) {
  if (value === "confirmed") return "Confirmed";
  if (value === "partial") return "Scoped";
  if (value === "stale") return "Stale";
  if (value === "failure") return "Failure";
  if (value === "success") return "Confirmed";
  if (value === "last-verified") return "Last verified";
  if (value === "awaiting") return "Awaiting";
  return "Unavailable";
}

function formatCountdown() {
  if (!chainProbe.nextAt) return "starting";
  const seconds = Math.max(0, Math.ceil((chainProbe.nextAt - Date.now()) / 1000));
  return seconds === 0 ? "refreshing" : `next update in ${seconds}s`;
}

function updateChainFeedStatus(cardStates) {
  const healthy = cardStates.filter(
    (state) =>
      state === "confirmed" ||
      state === "partial" ||
      state === "waiting" ||
      state === "revalidating" ||
      state === "awaiting"
  );
  const feedStatus = cardStates.includes("rollback")
    ? "failure"
    : cardStates.includes("revalidating") || cardStates.includes("awaiting")
      ? "awaiting next observation"
      : healthy.length
        ? cardStates.every((state) => state === "confirmed")
          ? "success"
          : cardStates.includes("waiting")
            ? "awaiting signed observation"
            : "partial"
        : cardStates.every((state) => state === "wrong-chain")
          ? "failure"
          : cardStates.every((state) => state === "unavailable")
            ? "unavailable"
            : "stale";
  setText('[data-chain-meta="feed-status"]', feedStatus);
  setText('[data-chain-meta="announcer"]', `Chain feed is ${feedStatus}.`);
}

function renderSnapshotCards(payload) {
  const cardStates = payload.chains.map((chain) => updateChainCard(chain, payload));
  updateChainFeedStatus(cardStates);
  return cardStates;
}

function updateChainCountdown({ renderSnapshot = true } = {}) {
  setText('[data-chain-meta="countdown"]', formatCountdown());
  updateVerificationRails();
  if (renderSnapshot && chainProbe.snapshot && !document.hidden) {
    renderSnapshotCards(chainProbe.snapshot);
  }
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

  updateChainFeedStatus(cardStates);
  setText('[data-chain-meta="generated"]', formatCheckedAt(payload.generatedAt));
  updateChainCountdown({ renderSnapshot: false });
}

function updateChainCard(chain, payload) {
  const fields = chainFieldMap[chain.expectedChainId];
  if (!fields) return "unavailable";

  const agedHead = effectiveHeadAge(chain);
  const displayChain = {
    ...chain,
    blockAgeSeconds: agedHead,
    status:
      chain.status === "live" &&
      (agedHead === null || agedHead > chainProbe.freshnessSeconds)
        ? "delayed"
        : chain.status,
  };
  const hasCurrentBlock = Number.isSafeInteger(chain.blockNumber);
  const activity = assessSignedActivity(displayChain, payload);

  if (!activity.accepted) {
    const previous = activity.highWater;
    setText(fields.status, "Failure");
    setText(fields.progress, "failure");
    setText(fields.chainId, formatChainIdentity(chain));
    setText(
      fields.block,
      isSafeNonNegativeInteger(previous?.confirmedBlock)
        ? `Last accepted ${formatNumber(previous.confirmedBlock)} · not current`
        : "Observation unavailable"
    );
    setText(fields.checked, "no current observation");
    setText(fields.sourceHeader, formatSource("rejected-observation"));
    setText(fields.sourceResult, formatSourceValue("rejected-observation"));
    setText(fields.confidence, formatConfidence("failure"));
    setText(fields.activity, `Failure · ${activity.reason}; browser-session high-water preserved`);
    document.querySelectorAll(fields.card).forEach((card) => {
      card.dataset.status = "wrong-chain";
      card.dataset.activity = "rollback";
    });
    return "rollback";
  }

  const retainedHighWater = activity.highWater ?? chainProbe.highWater.get(chain.expectedChainId);
  const retained = retainedConfirmedObservation(retainedHighWater);
  if (displayChain.status === "unavailable") {
    setText(fields.status, "Awaiting next observation");
    setText(fields.progress, "awaiting next observation");
    setText(fields.chainId, formatChainIdentity(chain));
    setText(
      fields.block,
      retained
        ? `Last verified ${formatNumber(retained.blockNumber)} · awaiting next observation`
        : "No current observation"
    );
    setText(fields.checked, retained ? `Last verified ${formatCheckedAt(retained.observedAt)}` : "not observed");
    setText(
      fields.sourceHeader,
      formatSource(retained ? "last-verified-observation" : "awaiting-next-observation")
    );
    setText(
      fields.sourceResult,
      formatSourceValue(retained ? "last-verified-observation" : "awaiting-next-observation")
    );
    setText(fields.confidence, formatConfidence(retained ? "last-verified" : "awaiting"));
    setText(
      fields.activity,
      retained && Number.isSafeInteger(retainedHighWater?.sequence)
        ? `Last verified signed sequence ${formatNumber(retainedHighWater.sequence)} · awaiting next observation`
        : "No current signed observation asserted"
    );
    document.querySelectorAll(fields.card).forEach((card) => {
      card.dataset.status = "waiting";
      card.dataset.activity = "awaiting";
    });
    return "awaiting";
  }

  if (displayChain.status === "partial") {
    const withinGraceWindow = retained && isWithinRevalidationWindow(activity.highWater);
    setText(fields.status, "Awaiting next observation");
    setText(fields.progress, "awaiting next observation");
    setText(fields.chainId, formatChainIdentity(chain));
    setText(
      fields.block,
      retained
        ? `Last verified ${formatNumber(retained.blockNumber)} · awaiting next observation`
        : "Awaiting next confirmed observation"
    );
    setText(fields.checked, formatCheckedAt(chain.checkedAt));
    setText(fields.sourceHeader, formatSource(retained ? "last-verified-observation" : "awaiting-next-observation"));
    setText(fields.sourceResult, formatSourceValue(retained ? "last-verified-observation" : "awaiting-next-observation"));
    setText(fields.confidence, formatConfidence(retained ? "last-verified" : "awaiting"));
    setText(
      fields.activity,
      withinGraceWindow
        ? `Signed sequence ${formatNumber(displayChain.observationSequence)} · awaiting next update`
        : `Signed sequence ${formatNumber(displayChain.observationSequence)} · awaiting next confirmed observation`
    );
    document.querySelectorAll(fields.card).forEach((card) => {
      card.dataset.status = "waiting";
      card.dataset.activity = withinGraceWindow ? "revalidating" : "awaiting";
    });
    return withinGraceWindow ? "revalidating" : "awaiting";
  }

  const status = cardStatus(displayChain);
  const confirmation =
    displayChain.status === "delayed" && chain.status === "live"
      ? { evidenceSource: "stale-observation", confidence: "stale" }
      : displayChain.confirmation ?? {};

  setText(fields.status, status.label);
  setText(fields.progress, progressLabel(status.state));
  setText(fields.chainId, formatChainIdentity(chain));
  setText(fields.block, formatNumber(chain.blockNumber));
  setText(fields.checked, hasCurrentBlock ? formatCheckedAt(chain.checkedAt) : "not observed");
  setText(fields.sourceHeader, formatSource(confirmation.evidenceSource));
  setText(fields.sourceResult, formatSourceValue(confirmation.evidenceSource));
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
  setText('[data-chain-meta="feed-status"]', "awaiting next observation");
  setText('[data-chain-meta="announcer"]', "Chain feed is awaiting the next observation. No current observation is asserted.");
  updateChainCountdown({ renderSnapshot: false });

  Object.values(chainFieldMap).forEach((fields) => {
    const previous = chainProbe.highWater.get(fields.chainKey);
    const retained = retainedConfirmedObservation(previous);
    if (chainProbe.hasSnapshot) {
      setText(fields.status, "Awaiting next observation");
      setText(
        fields.block,
        retained
          ? `Last verified ${formatNumber(retained.blockNumber)} · awaiting next observation`
          : "No current observation"
      );
      setText(fields.checked, retained ? `Last verified ${formatCheckedAt(retained.observedAt)}` : "not observed");
      setText(fields.sourceHeader, formatSource(retained ? "last-verified-observation" : "awaiting-next-observation"));
      setText(fields.sourceResult, formatSourceValue(retained ? "last-verified-observation" : "awaiting-next-observation"));
      setText(fields.confidence, formatConfidence(retained ? "last-verified" : "awaiting"));
      setText(
        fields.activity,
        retained && Number.isSafeInteger(previous?.sequence)
          ? `Last verified signed sequence ${formatNumber(previous.sequence)} · awaiting next observation`
          : "No current observation asserted; awaiting next observation"
      );
      setText(fields.progress, "awaiting next observation");
      document.querySelectorAll(fields.card).forEach((card) => {
        card.dataset.status = "waiting";
        card.dataset.activity = "awaiting";
      });
      return;
    }

    setText(fields.status, "Awaiting next observation");
    setText(fields.block, "No current observation");
    setText(fields.checked, "not observed");
    const evidenceSource = "awaiting-next-observation";
    setText(fields.sourceHeader, formatSource(evidenceSource));
    setText(fields.sourceResult, formatSourceValue(evidenceSource));
    setText(fields.confidence, "Awaiting");
    setText(fields.activity, "No current signed observation asserted");
    setText(fields.progress, "awaiting next observation");
    document.querySelectorAll(fields.card).forEach((card) => {
      card.dataset.status = "waiting";
      card.dataset.activity = "awaiting";
    });
  });
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
    if (!isObject(payload) || payload.version !== 1 || !isIsoTimestamp(payload.generatedAt)) {
      throw new Error("Invalid chain progress");
    }
    if (!Array.isArray(payload.chains) || !Array.isArray(payload.observations)) throw new Error("Missing chain progress");
    if (payload.chains.length !== monitoredChainIds.size || payload.observations.length > monitoredChainIds.size) {
      throw new Error("Unexpected chain progress cardinality");
    }
    if (!Number.isSafeInteger(payload.refreshMs) || !Number.isSafeInteger(payload.freshnessSeconds)) {
      throw new Error("Invalid chain progress policy");
    }

    const observationChains = new Set();
    for (const observation of payload.observations) {
      if (!isObject(observation) || typeof observation.chain !== "string") throw new Error("Invalid signed observation");
      const chainId = Number(observation.chain);
      if (!monitoredChainIds.has(chainId) || String(chainId) !== observation.chain || observationChains.has(chainId)) {
        throw new Error("Unexpected signed observation");
      }
      observationChains.add(chainId);
    }

    const supported = payload.chains.filter((chain) => isValidChainRecord(chain, payload));
    if (supported.length !== monitoredChainIds.size) throw new Error("Invalid monitored chain");
    if (new Set(supported.map((chain) => chain.expectedChainId)).size !== supported.length) {
      throw new Error("Duplicate monitored chain");
    }
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
    chainProbe.snapshot = payload;
    const cardStates = renderSnapshotCards(payload);
    updateChainMeta(payload, cardStates);
    chainProbe.hasSnapshot = true;
    chainProbe.retryMs = chainProbe.refreshMs;
    scheduleChainRead(chainProbe.refreshMs);
  } catch {
    chainProbe.snapshot = null;
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
