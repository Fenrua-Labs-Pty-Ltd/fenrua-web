(() => {
  const monitoredChains = [978, 521];
  const initialRefreshMs = 20_000;
  const maximumRefreshMs = 60_000;
  const requestTimeoutMs = 8_000;
  const partialPresentationGraceSeconds = 60;
  const validStates = new Set(["live", "delayed", "partial", "waiting", "unavailable"]);
  const rows = new Map(
    [...document.querySelectorAll("[data-status-monitor-row]")]
      .map((row) => [Number(row.dataset.statusMonitorRow), row])
      .filter(([chain]) => monitoredChains.includes(chain))
  );

  if (rows.size !== monitoredChains.length) return;

  const meta = document.querySelector("[data-status-monitor-meta]");
  const announcer = document.querySelector("[data-status-monitor-announcer]");
  const monitor = {
    controller: null,
    nextRead: null,
    refreshMs: initialRefreshMs,
    retryMs: initialRefreshMs,
    snapshot: null,
    highWater: new Map(),
    announcementKey: "",
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

  function boundedMilliseconds(value, fallback) {
    if (!Number.isSafeInteger(value)) return fallback;
    return Math.min(Math.max(value, 5_000), maximumRefreshMs);
  }

  function boundedFreshness(value) {
    if (!Number.isSafeInteger(value)) return 90;
    return Math.min(Math.max(value, 30), 300);
  }

  function setText(row, selector, value) {
    const element = row.querySelector(selector);
    if (element) element.textContent = value;
  }

  function setCompactText(chain, field, value) {
    document.querySelectorAll(`[data-chain-field="${chain}-${field}"]`).forEach((element) => {
      element.textContent = value;
    });
  }

  function hydrateCompactCard(chain, state) {
    const row = rows.get(chain);
    if (!row) return;
    const compactState = {
      live: "confirmed",
      delayed: "delayed",
      revalidating: "waiting",
      awaitingConfirmation: "waiting",
      awaiting: "waiting",
      partial: "waiting",
      waiting: "waiting",
      failure: "wrong-chain",
      unavailable: "unavailable",
    }[state] ?? "unavailable";
    const rowText = (selector, fallback) => row.querySelector(selector)?.textContent?.trim() || fallback;
    const relativeTime = row.querySelector("[data-status-monitor-relative]")?.textContent?.trim();

    setCompactText(chain, "status", stateDisplay(state).label);
    setCompactText(chain, "block", rowText("[data-status-monitor-block]", "Observation unavailable"));
    setCompactText(
      chain,
      "checked",
      relativeTime || rowText("[data-status-monitor-time]", "not observed")
    );
    setCompactText(
      chain,
      "source",
      `Evidence source: ${rowText("[data-status-monitor-source]", "unavailable")}`
    );
    setCompactText(chain, "activity", rowText("[data-status-monitor-sequence]", "No verified sequence"));
    document.querySelectorAll(`[data-chain-card="${chain}"]`).forEach((card) => {
      card.dataset.status = compactState;
      card.dataset.activity = state;
    });
  }

  function stateDisplay(state) {
    if (state === "live") return { label: "Live", className: "status-success" };
    if (state === "delayed") return { label: "Stale", className: "status-stale" };
    if (state === "revalidating") return { label: "Awaiting next observation", className: "status-awaiting" };
    if (state === "awaitingConfirmation") return { label: "Awaiting next observation", className: "status-awaiting" };
    if (state === "awaiting") return { label: "Awaiting next observation", className: "status-awaiting" };
    if (state === "partial") return { label: "Awaiting next observation", className: "status-awaiting" };
    if (state === "waiting") return { label: "Awaiting signed observation", className: "status-stale" };
    if (state === "failure") return { label: "Failure", className: "status-failure" };
    return { label: "Unavailable", className: "status-failure" };
  }

  function setState(row, state) {
    const badge = row.querySelector("[data-status-monitor-state]");
    if (!badge) return;
    const display = stateDisplay(state);
    badge.className = `status-badge ${display.className}`;
    badge.textContent = display.label;
  }

  function formatUtc(value) {
    return new Date(value).toISOString().slice(0, 19).replace("T", " ") + " UTC";
  }

  function observationAgeSeconds(value) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.floor((Date.now() - parsed) / 1_000));
  }

  function relativeObservationTime(value) {
    const seconds = observationAgeSeconds(value);
    if (seconds === null) return "Observation time unavailable";
    if (seconds < 5) return "Observed just now";
    if (seconds < 60) return `Observed ${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Observed ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 48) return `Observed ${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `Observed ${days} day${days === 1 ? "" : "s"} ago`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(value);
  }

  function retainedConfirmedObservation(highWater) {
    if (
      !isSafeNonNegativeInteger(highWater?.confirmedBlock) ||
      !isIsoTimestamp(highWater?.confirmedObservedAt)
    ) {
      return null;
    }

    const ageSeconds = observationAgeSeconds(highWater.confirmedObservedAt);
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

  function signedObservation(snapshot, chain) {
    if (!isObject(chain) || !monitoredChains.includes(chain.expectedChainId) || !validStates.has(chain.status)) return null;
    const matches = snapshot.observations.filter((candidate) => String(candidate?.chain) === String(chain.expectedChainId));
    if (matches.length !== 1) return null;
    const [observation] = matches;
    if (!isObject(observation) || typeof observation.key_id !== "string" || observation.key_id.length === 0) return null;
    if (typeof observation.signature !== "string" || observation.signature.length === 0) return null;
    if (!isIsoTimestamp(observation.observed_at) || observation.observed_at !== chain.checkedAt) return null;
    if (!Number.isSafeInteger(observation.sequence) || observation.sequence < 1 || chain.observationSequence !== observation.sequence) return null;

    if (chain.status === "live" || chain.status === "delayed") {
      if (
        observation.status !== "confirmed" ||
        observation.source_quorum !== 2 ||
        !isSafeNonNegativeInteger(observation.observed_block) ||
        chain.blockNumber !== observation.observed_block
      ) {
        return null;
      }
    }

    if (
      chain.status === "partial" &&
      (observation.status !== "partial" || observation.source_quorum < 1 || observation.source_quorum >= 2 || observation.observed_block !== null)
    ) {
      return null;
    }

    return observation;
  }

  function effectiveState(chain, observation, freshnessSeconds) {
    if (!observation) return chain?.status === "waiting" ? "waiting" : "unavailable";
    if (chain.status !== "live") return chain.status;
    const age = observationAgeSeconds(observation.observed_at);
    return age === null || age > freshnessSeconds ? "delayed" : "live";
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

  function assessMonotonicity(chain, observation) {
    const previous = monitor.highWater.get(chain);
    const candidate = {
      keyId: observation.key_id,
      sequence: observation.sequence,
      confirmedBlock: isSafeNonNegativeInteger(observation.observed_block) ? observation.observed_block : previous?.confirmedBlock ?? null,
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
      monitor.highWater.set(chain, candidate);
      return { accepted: true, label: "current", highWater: candidate };
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
      if (
        candidate.signature !== previous.signature ||
        candidate.observedAt !== previous.observedAt ||
        candidate.confirmedBlock !== previous.confirmedBlock ||
        candidate.confirmedObservedAt !== previous.confirmedObservedAt ||
        candidate.partialSinceMs !== previous.partialSinceMs
      ) {
        return { accepted: false, reason: "same-sequence equivocation rejected", highWater: previous };
      }
      return { accepted: true, label: "current", highWater: previous };
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

    monitor.highWater.set(chain, candidate);
    return {
      accepted: true,
      label: acceptedKeyRotation
        ? "authenticated key rotation accepted"
        : "advanced in this browser session",
      highWater: candidate,
    };
  }

  function setObservationTime(row, observedAt) {
    const target = row.querySelector("[data-status-monitor-time]");
    if (!target) return;
    target.classList.add("timestamp-stack", "status-monitor-timestamp");
    const time = document.createElement("time");
    const relative = document.createElement("small");
    time.dateTime = observedAt;
    time.textContent = formatUtc(observedAt);
    relative.dataset.statusMonitorRelative = observedAt;
    relative.textContent = relativeObservationTime(observedAt);
    target.replaceChildren(time, relative);
  }

  function clearObservation(row, message) {
    const target = row.querySelector("[data-status-monitor-time]");
    if (!target) return;
    target.classList.remove("timestamp-stack", "status-monitor-timestamp");
    target.textContent = message;
  }

  function renderUnavailable(row, state, message, highWater) {
    const retained = retainedConfirmedObservation(highWater);
    setState(row, state);

    // A transport gap is not evidence that the last signed block vanished.
    // Keep an already accepted high-water record visible, but label it as
    // historical so it is never presented as a current head.
    if (state === "awaiting" && retained) {
      setObservationTime(row, retained.observedAt);
      setText(
        row,
        "[data-status-monitor-sequence]",
        Number.isSafeInteger(highWater?.sequence)
          ? `Last verified signed sequence ${formatNumber(highWater.sequence)} · awaiting next observation`
          : "Last verified signed observation · awaiting next observation"
      );
      setText(
        row,
        "[data-status-monitor-block]",
        `Last verified ${formatNumber(retained.blockNumber)} · awaiting next observation`
      );
      setText(row, "[data-status-monitor-source]", "Last verified signed observation; awaiting next update");
      setText(
        row,
        "[data-status-monitor-freshness]",
        `Last verified ${relativeObservationTime(retained.observedAt)} · awaiting next observation`
      );
      return;
    }

    clearObservation(row, message);
    setText(row, "[data-status-monitor-sequence]", "No verified signed sequence");
    setText(row, "[data-status-monitor-block]", "No confirmed block");
    setText(
      row,
      "[data-status-monitor-source]",
      state === "waiting"
        ? "Awaiting a signed public observation"
        : state === "awaiting"
          ? "No current signed observation; awaiting next update"
          : "No current signed observation returned"
    );
    setText(row, "[data-status-monitor-freshness]", "No current freshness claim");
  }

  function renderRejected(row, observation, assessment) {
    setState(row, "failure");
    clearObservation(row, "Signed observation rejected; no current state is asserted.");
    setText(
      row,
      "[data-status-monitor-sequence]",
      `Rejected signed sequence ${formatNumber(observation.sequence)} · last accepted ${formatNumber(assessment.highWater.sequence)}`
    );
    setText(
      row,
      "[data-status-monitor-block]",
      isSafeNonNegativeInteger(assessment.highWater.confirmedBlock)
        ? `Last accepted ${formatNumber(assessment.highWater.confirmedBlock)} in this browser session; not current`
        : "No current confirmed block"
    );
    setText(row, "[data-status-monitor-source]", `Failure — ${assessment.reason}`);
    setText(row, "[data-status-monitor-freshness]", "No current freshness claim; browser-session high-water preserved");
  }

  function renderRevalidating(row, observation, monotonicity, retained) {
    setState(row, "revalidating");
    setObservationTime(row, observation.observed_at);
    setText(
      row,
      "[data-status-monitor-sequence]",
      `Signed sequence ${formatNumber(observation.sequence)} · last verified ${formatNumber(retained.blockNumber)}`
    );
    setText(
      row,
      "[data-status-monitor-block]",
      `Last verified ${formatNumber(retained.blockNumber)} · awaiting next observation`
    );
    setText(row, "[data-status-monitor-source]", "Last verified signed observation; awaiting next update");
    setText(
      row,
      "[data-status-monitor-freshness]",
      `Last verified ${relativeObservationTime(retained.observedAt)} · ${partialPresentationGraceSeconds}-second update window`
    );
    return { chain: row.dataset.statusMonitorRow, state: "revalidating", sequence: observation.sequence, monotonicity };
  }

  function renderAwaitingConfirmation(row, observation, retained) {
    setState(row, "awaitingConfirmation");
    if (retained) {
      setObservationTime(row, observation.observed_at);
      setText(
        row,
        "[data-status-monitor-block]",
        `Last verified ${formatNumber(retained.blockNumber)} · awaiting next observation`
      );
      setText(
        row,
        "[data-status-monitor-freshness]",
        `Last verified ${relativeObservationTime(retained.observedAt)} · awaiting next signed observation`
      );
    } else {
      setObservationTime(row, observation.observed_at);
      setText(row, "[data-status-monitor-block]", "No verified block");
      setText(row, "[data-status-monitor-freshness]", "No current confirmed head is asserted");
    }
    setText(
      row,
      "[data-status-monitor-sequence]",
      `Signed sequence ${formatNumber(observation.sequence)} · awaiting next confirmed observation`
    );
    setText(row, "[data-status-monitor-source]", "Signed observation received; awaiting next update");
    return { chain: row.dataset.statusMonitorRow, state: "awaitingConfirmation", sequence: observation.sequence };
  }

  function renderChain(snapshot, chain) {
    const chainId = chain?.expectedChainId;
    const row = rows.get(chainId);
    if (!row) return { chain: chainId, state: "unavailable", sequence: null };

    const observation = signedObservation(snapshot, chain);
    const state = effectiveState(chain, observation, snapshot.freshnessSeconds);
    if (!observation) {
      const assertedSignedState = chain?.status === "live" || chain?.status === "delayed" || chain?.status === "partial";
      const renderedState = assertedSignedState ? "failure" : state === "unavailable" ? "awaiting" : state;
      renderUnavailable(
        row,
        renderedState,
        state === "waiting"
          ? "Awaiting a signed public observation."
          : assertedSignedState
            ? "Signed observation binding failed; no current state is asserted."
            : "No current signed observation is asserted; awaiting next observation.",
        monitor.highWater.get(chainId)
      );
      return { chain: chainId, state: renderedState, sequence: null };
    }

    const monotonicity = assessMonotonicity(chainId, observation);
    if (!monotonicity.accepted) {
      renderRejected(row, observation, monotonicity);
      return { chain: chainId, state: "failure", sequence: null };
    }

    if (state === "partial") {
      const retained = retainedConfirmedObservation(monotonicity.highWater);
      if (retained && isWithinRevalidationWindow(monotonicity.highWater)) {
        const rendered = renderRevalidating(row, observation, monotonicity, retained);
        return { chain: chainId, state: rendered.state, sequence: rendered.sequence };
      }
      const rendered = renderAwaitingConfirmation(row, observation, retained);
      return { chain: chainId, state: rendered.state, sequence: rendered.sequence };
    }

    setState(row, state);
    setObservationTime(row, observation.observed_at);
    setText(row, "[data-status-monitor-sequence]", `Signed sequence ${formatNumber(observation.sequence)} · ${monotonicity.label}`);
    setText(
      row,
      "[data-status-monitor-block]",
      isSafeNonNegativeInteger(observation.observed_block) ? formatNumber(observation.observed_block) : "No confirmed block"
    );
    setText(row, "[data-status-monitor-source]", "Server-validated signed bounded observation");
    setText(
      row,
      "[data-status-monitor-freshness]",
      `${snapshot.freshnessSeconds}-second maximum · ${relativeObservationTime(observation.observed_at)}`
    );
    return { chain: chainId, state, sequence: observation.sequence };
  }

  function announce(states) {
    const key = states.map(({ chain, state, sequence }) => `${chain}:${state}:${sequence ?? "none"}`).join("|");
    if (!announcer || key === monitor.announcementKey) return;
    monitor.announcementKey = key;
    announcer.textContent = `Public monitor updated: ${states
      .map(({ chain, state }) => `Chain ${chain} ${stateDisplay(state).label}`)
      .join("; ")}.`;
  }

  function renderSnapshot(snapshot) {
    const states = monitoredChains.map((chain) => renderChain(snapshot, snapshot.chains.get(chain)));
    states.forEach(({ chain, state }) => hydrateCompactCard(chain, state));
    if (meta) {
      meta.textContent = `Public monitor snapshot generated ${formatUtc(snapshot.generatedAt)}. Each row uses its own signed observation time; the snapshot time is not an activation event. Refresh target: ${Math.round(snapshot.refreshMs / 1_000)} seconds.`;
    }
    announce(states);
  }

  function renderFailure() {
    const hasRetainedObservation = monitoredChains.some((chain) =>
      retainedConfirmedObservation(monitor.highWater.get(chain))
    );
    monitoredChains.forEach((chain) => {
      const row = rows.get(chain);
      if (row) {
        renderUnavailable(
          row,
          "awaiting",
          "No current signed observation is asserted; awaiting next observation.",
          monitor.highWater.get(chain)
        );
        hydrateCompactCard(chain, "awaiting");
      }
    });
    if (meta) {
      meta.textContent = hasRetainedObservation
        ? `No current signed observation is asserted. Last verified observations remain visible while awaiting the next update in ${Math.round(monitor.retryMs / 1_000)} seconds.`
        : `No current signed observation is asserted; awaiting the next update in ${Math.round(monitor.retryMs / 1_000)} seconds.`;
    }
    announce(monitoredChains.map((chain) => ({ chain, state: "awaiting", sequence: null })));
  }

  function normalizeSnapshot(payload) {
    if (!isObject(payload) || payload.version !== 1 || !isIsoTimestamp(payload.generatedAt)) throw new Error("Invalid public monitor response");
    if (!Array.isArray(payload.chains) || !Array.isArray(payload.observations)) throw new Error("Incomplete public monitor response");
    const chains = new Map();
    for (const chain of payload.chains) {
      if (!isObject(chain) || !monitoredChains.includes(chain.expectedChainId)) continue;
      if (chains.has(chain.expectedChainId)) throw new Error("Duplicate monitored chain");
      chains.set(chain.expectedChainId, chain);
    }
    if (chains.size !== monitoredChains.length) throw new Error("Missing monitored chain");
    return {
      generatedAt: payload.generatedAt,
      refreshMs: boundedMilliseconds(payload.refreshMs, initialRefreshMs),
      freshnessSeconds: boundedFreshness(payload.freshnessSeconds),
      chains,
      observations: payload.observations,
    };
  }

  async function fetchSnapshot() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
    monitor.controller = controller;
    try {
      const response = await fetch("/api/chain-progress", {
        signal: controller.signal,
        cache: "no-store",
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error("Public monitor unavailable");
      return normalizeSnapshot(await response.json());
    } finally {
      window.clearTimeout(timeout);
      if (monitor.controller === controller) monitor.controller = null;
    }
  }

  function scheduleRead(delay) {
    if (monitor.nextRead) window.clearTimeout(monitor.nextRead);
    if (document.hidden) return;
    monitor.nextRead = window.setTimeout(() => {
      monitor.nextRead = null;
      void readMonitor();
    }, Math.max(0, delay));
  }

  async function readMonitor() {
    if (document.hidden || monitor.controller) return;
    try {
      const snapshot = await fetchSnapshot();
      monitor.snapshot = snapshot;
      monitor.refreshMs = snapshot.refreshMs;
      monitor.retryMs = snapshot.refreshMs;
      renderSnapshot(snapshot);
      scheduleRead(snapshot.refreshMs);
    } catch {
      monitor.snapshot = null;
      monitor.retryMs = Math.min(maximumRefreshMs, Math.max(monitor.refreshMs, monitor.retryMs * 2));
      renderFailure();
      scheduleRead(monitor.retryMs);
    }
  }

  window.setInterval(() => {
    if (!document.hidden && monitor.snapshot) renderSnapshot(monitor.snapshot);
  }, 1_000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (monitor.nextRead) window.clearTimeout(monitor.nextRead);
      monitor.nextRead = null;
      return;
    }
    scheduleRead(0);
  });
  window.addEventListener("online", () => scheduleRead(0));
  void readMonitor();
})();
