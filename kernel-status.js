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

hydrateKernelStatus();
