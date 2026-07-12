const searchInput = document.querySelector("#tool-search");
const rows = Array.from(document.querySelectorAll("[data-tool-row]"));
const emptyState = document.querySelector("#toolchain-empty");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
const categoryButtons = Array.from(document.querySelectorAll("[data-category-filter]"));
const pageStatus = document.querySelector("[data-page-status]");
const pageSize = 25;
let activeFilter = "all";
let activeCategory = "";
let currentPage = 1;

function rowMatchesFilter(row) {
  if (activeCategory && row.dataset.category !== activeCategory) return false;
  if (activeFilter === "all") return true;
  if (activeFilter === "native") return row.dataset.mode.includes("native");
  if (activeFilter === "container") return row.dataset.mode.includes("container");
  if (activeFilter === "project-local") return row.dataset.mode.includes("project-local");
  if (activeFilter === "installed") return row.dataset.installed === "true";
  if (activeFilter === "executed") return row.dataset.executed === "true";
  if (activeFilter === "evidence") return row.dataset.evidence === "true";
  if (activeFilter === "exploratory") return row.dataset.status.includes("EXPLORATORY");
  if (activeFilter === "current") return !row.dataset.status.includes("SUPERSEDED") && !row.dataset.status.includes("DEPRECATED");
  if (activeFilter === "version-review") return row.dataset.status.includes("VERSION_REVIEW_REQUIRED");
  return true;
}

function visibleRows() {
  const query = searchInput?.value.trim().toLowerCase() ?? "";
  return rows.filter((row) => rowMatchesFilter(row) && (!query || row.dataset.search.includes(query)));
}

function renderRows() {
  const matches = visibleRows();
  const maxPage = Math.max(1, Math.ceil(matches.length / pageSize));
  currentPage = Math.min(currentPage, maxPage);
  const start = (currentPage - 1) * pageSize;
  const pageRows = new Set(matches.slice(start, start + pageSize));

  rows.forEach((row) => {
    row.hidden = !pageRows.has(row);
  });

  if (emptyState) emptyState.hidden = matches.length > 0;
  if (pageStatus) pageStatus.textContent = `Page ${currentPage} of ${maxPage} · ${matches.length} matching`;
}

function setActiveFilter(button) {
  activeFilter = button.dataset.filter;
  activeCategory = "";
  currentPage = 1;
  filterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  categoryButtons.forEach((item) => item.setAttribute("aria-pressed", "false"));
  renderRows();
}

function setActiveCategory(button) {
  activeCategory = button.dataset.categoryFilter;
  activeFilter = "all";
  currentPage = 1;
  filterButtons.forEach((item) => item.setAttribute("aria-pressed", item.dataset.filter === "all" ? "true" : "false"));
  categoryButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  renderRows();
}

function copyValue(value, button) {
  const done = () => {
    const previous = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = previous;
    }, 1400);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(value).then(done).catch(() => {});
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveFilter(button));
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveCategory(button));
});

searchInput?.addEventListener("input", () => {
  currentPage = 1;
  renderRows();
});

document.querySelector('[data-page-action="prev"]')?.addEventListener("click", () => {
  currentPage = Math.max(1, currentPage - 1);
  renderRows();
});

document.querySelector('[data-page-action="next"]')?.addEventListener("click", () => {
  currentPage += 1;
  renderRows();
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", () => copyValue(button.dataset.copy, button));
});

if (rows.length) renderRows();
