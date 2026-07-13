const searchInput = document.querySelector("#tool-search");
const rows = Array.from(document.querySelectorAll("[data-tool-row]"));
const cards = Array.from(document.querySelectorAll("[data-tool-card]"));
const records = rows.map((row, index) => ({ row, card: cards[index] })).filter((record) => record.row);
const emptyState = document.querySelector("#toolchain-empty");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
const categoryButtons = Array.from(document.querySelectorAll("[data-category-filter]"));
const pageStatus = document.querySelector("[data-page-status]");
const activeFilterLabels = Array.from(document.querySelectorAll("[data-active-filter-count]"));
const sortSelect = document.querySelector("#tool-sort");
const clearFiltersButton = document.querySelector("[data-clear-filters]");
const pageSize = 25;
let activeFilter = "all";
let activeCategory = "";
let currentPage = 1;

function rowMatchesFilter(row) {
  const tags = row.dataset.tags || "";
  if (activeCategory && row.dataset.category !== activeCategory) return false;
  if (activeFilter === "all") return true;
  if (activeFilter === "detected") return tags.includes("DETECTED");
  if (activeFilter === "version-verified") return tags.includes("VERSION_VERIFIED");
  if (activeFilter === "smoke-tested") return tags.includes("SMOKE_TESTED");
  if (activeFilter === "campaign-executed") return tags.includes("EVIDENCE_PRODUCING");
  if (activeFilter === "evidence") return tags.includes("EVIDENCE_PRODUCING");
  if (activeFilter === "canonical-pipeline") return tags.includes("CANONICAL_PIPELINE");
  if (activeFilter === "container") return tags.includes("CONTAINER_ONLY");
  if (activeFilter === "project-local") return tags.includes("PROJECT_LOCAL");
  if (activeFilter === "exploratory") return tags.includes("EXPLORATORY");
  if (activeFilter === "superseded") return tags.includes("SUPERSEDED");
  if (activeFilter === "version-review") return tags.includes("VERSION_REVIEW_REQUIRED");
  if (activeFilter === "unavailable") return tags.includes("UNAVAILABLE");
  return true;
}

function activeFilterCount() {
  let count = 0;
  if (activeFilter !== "all") count += 1;
  if (activeCategory) count += 1;
  if (searchInput?.value.trim()) count += 1;
  return count;
}

function updateActiveFilterLabels() {
  const count = activeFilterCount();
  const label = `${count} active filter${count === 1 ? "" : "s"}`;
  activeFilterLabels.forEach((node) => {
    node.textContent = label;
  });
}

function compareRecords(a, b) {
  const mode = sortSelect?.value || "source";
  if (mode === "tool") return (a.row.dataset.toolName || "").localeCompare(b.row.dataset.toolName || "");
  if (mode === "category") return (a.row.dataset.category || "").localeCompare(b.row.dataset.category || "");
  if (mode === "status") return (a.row.dataset.status || "").localeCompare(b.row.dataset.status || "");
  return Number(a.row.dataset.sourceIndex || 0) - Number(b.row.dataset.sourceIndex || 0);
}

function visibleRecords() {
  const query = searchInput?.value.trim().toLowerCase() ?? "";
  return records
    .filter((record) => rowMatchesFilter(record.row) && (!query || record.row.dataset.search.includes(query)))
    .sort(compareRecords);
}

function reorderVisibleRecords(matches) {
  const tableBody = rows[0]?.parentElement;
  const cardList = cards[0]?.parentElement;
  if (!tableBody || !cardList) return;
  matches.forEach((record) => {
    tableBody.append(record.row);
    if (record.card) cardList.append(record.card);
  });
}

function renderRecords() {
  const matches = visibleRecords();
  const maxPage = Math.max(1, Math.ceil(matches.length / pageSize));
  currentPage = Math.min(currentPage, maxPage);
  const start = (currentPage - 1) * pageSize;
  const pageRecords = new Set(matches.slice(start, start + pageSize));

  reorderVisibleRecords(matches);

  records.forEach((record) => {
    const hidden = !pageRecords.has(record);
    record.row.hidden = hidden;
    if (record.card) record.card.hidden = hidden;
  });

  if (emptyState) emptyState.hidden = matches.length > 0;
  if (pageStatus) pageStatus.textContent = `Page ${currentPage} of ${maxPage} · ${matches.length} matching`;
  updateActiveFilterLabels();
}

function setActiveFilter(button) {
  activeFilter = button.dataset.filter;
  activeCategory = "";
  currentPage = 1;
  filterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  categoryButtons.forEach((item) => item.setAttribute("aria-pressed", "false"));
  renderRecords();
}

function setActiveCategory(button) {
  activeCategory = button.dataset.categoryFilter;
  activeFilter = "all";
  currentPage = 1;
  filterButtons.forEach((item) => item.setAttribute("aria-pressed", item.dataset.filter === "all" ? "true" : "false"));
  categoryButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  renderRecords();
}

function clearFilters() {
  activeFilter = "all";
  activeCategory = "";
  currentPage = 1;
  if (searchInput) searchInput.value = "";
  if (sortSelect) sortSelect.value = "source";
  filterButtons.forEach((item) => item.setAttribute("aria-pressed", item.dataset.filter === "all" ? "true" : "false"));
  categoryButtons.forEach((item) => item.setAttribute("aria-pressed", "false"));
  renderRecords();
}

records.forEach((record, index) => {
  record.row.dataset.sourceIndex = String(index);
  if (record.card) record.card.dataset.sourceIndex = String(index);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveFilter(button));
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveCategory(button));
});

searchInput?.addEventListener("input", () => {
  currentPage = 1;
  renderRecords();
});

sortSelect?.addEventListener("change", () => {
  currentPage = 1;
  renderRecords();
});

clearFiltersButton?.addEventListener("click", clearFilters);

document.querySelector('[data-page-action="prev"]')?.addEventListener("click", () => {
  currentPage = Math.max(1, currentPage - 1);
  renderRecords();
});

document.querySelector('[data-page-action="next"]')?.addEventListener("click", () => {
  currentPage += 1;
  renderRecords();
});

if (records.length) renderRecords();
