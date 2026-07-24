const sourceRepository = "Fenrua-Labs-Pty-Ltd/fenrua-521-public-evidence";
const sourceBranch = "main";
const sourceApi = `https://api.github.com/repos/${sourceRepository}/contents/releases?ref=${sourceBranch}`;
const sourceRawRoot = `https://raw.githubusercontent.com/${sourceRepository}/${sourceBranch}/releases`;
const sourceWebRoot = `https://github.com/${sourceRepository}/tree/${sourceBranch}/releases`;
const refreshMs = 10 * 60 * 1000;
const manifestSchema = "fenrua-521-public-evidence/v1";
const releaseDirectoryPattern = /^f521-public-[a-z0-9-]+$/;
const releaseIdPattern = /^[A-Z0-9][A-Z0-9-]{2,80}$/;
const sha256Pattern = /^sha256:[a-f0-9]{64}$/;

const releaseContainer = document.querySelector("[data-fenrua-521-releases]");
const statusElement = document.querySelector("[data-fenrua-521-status]");

function setStatus(message) {
  if (statusElement) statusElement.textContent = message;
}

function asPublicText(value, maxLength = 240) {
  if (typeof value !== "string") return null;
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 0 && compact.length <= maxLength ? compact : null;
}

function formatDate(isoValue) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(isoValue));
}

function createFact(label, value) {
  const wrapper = document.createElement("div");
  const term = document.createElement("dt");
  const detail = document.createElement("dd");
  term.textContent = label;
  detail.textContent = value;
  wrapper.append(term, detail);
  return wrapper;
}

function parsePublicManifest(manifest, directory) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return null;
  if (manifest.schema_version !== manifestSchema || manifest.build_state !== "VERIFIED") return null;
  if (!releaseIdPattern.test(manifest.release_id ?? "")) return null;
  if (!sha256Pattern.test(manifest.manifest_digest ?? "")) return null;

  const publishedAt = asPublicText(manifest.published_at, 64);
  const publishedTime = publishedAt ? Date.parse(publishedAt) : Number.NaN;
  const releaseScope = asPublicText(manifest.release_scope);
  if (!Number.isFinite(publishedTime) || !releaseScope || !Array.isArray(manifest.results) || manifest.results.length === 0) return null;

  const resultsArePublic = manifest.results.every((result) => (
    result
    && typeof result === "object"
    && releaseIdPattern.test(result.result_id ?? "")
    && sha256Pattern.test(result.result_digest ?? "")
    && sha256Pattern.test(result.file_sha256 ?? "")
  ));
  if (!resultsArePublic) return null;

  return {
    releaseId: manifest.release_id,
    publishedAt,
    publishedTime,
    releaseScope,
    resultCount: manifest.results.length,
    sourceUrl: `${sourceWebRoot}/${directory}`,
  };
}

function renderRelease(release) {
  const card = document.createElement("article");
  card.className = "fenrua-521-release-card";

  const kicker = document.createElement("span");
  kicker.textContent = "PUBLIC RELEASE · SOURCE-DECLARED STATE";
  const title = document.createElement("h3");
  const identifier = document.createElement("code");
  identifier.textContent = release.releaseId;
  title.append(identifier);
  const scope = document.createElement("p");
  scope.textContent = release.releaseScope;
  const facts = document.createElement("dl");
  facts.className = "record-facts";
  facts.append(
    createFact("Published", formatDate(release.publishedAt)),
    createFact("Public results", `${release.resultCount} declared result${release.resultCount === 1 ? "" : "s"}`),
  );
  const link = document.createElement("a");
  link.href = release.sourceUrl;
  link.textContent = "Open source release";

  card.append(kicker, title, scope, facts, link);
  return card;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Public source is unavailable.");
  return response.json();
}

async function refreshReleases() {
  if (!releaseContainer) return;
  try {
    const directoryEntries = await fetchJson(sourceApi);
    if (!Array.isArray(directoryEntries)) throw new Error("Public source listing is invalid.");
    const directories = directoryEntries
      .filter((entry) => entry?.type === "dir" && releaseDirectoryPattern.test(entry.name ?? ""))
      .map((entry) => entry.name)
      .sort();
    const manifests = await Promise.all(
      directories.map(async (directory) => ({
        directory,
        manifest: await fetchJson(`${sourceRawRoot}/${directory}/release-manifest.json`),
      })),
    );
    const releases = manifests
      .map(({ directory, manifest }) => parsePublicManifest(manifest, directory))
      .filter(Boolean)
      .sort((left, right) => right.publishedTime - left.publishedTime || left.releaseId.localeCompare(right.releaseId));

    if (releases.length === 0) throw new Error("No eligible public releases are available.");
    releaseContainer.replaceChildren(...releases.map(renderRelease));
    setStatus(`Public source refreshed. ${releases.length} source-declared release record${releases.length === 1 ? "" : "s"} shown.`);
  } catch {
    setStatus("Public source refresh is unavailable. Static public release records remain visible.");
  }
}

if (releaseContainer && statusElement) {
  void refreshReleases();
  window.setInterval(() => void refreshReleases(), refreshMs);
}
