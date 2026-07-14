(() => {
  const input = document.querySelector("[data-claim-filter]");
  const status = document.querySelector("[data-claim-filter-status]");
  const records = [...document.querySelectorAll("[data-claim-record]")];
  if (!input || !status || records.length === 0) return;

  const render = () => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    for (const record of records) {
      const matches = query.length === 0 || record.dataset.claimSearch?.includes(query);
      record.hidden = !matches;
      if (matches) visible += 1;
    }
    status.textContent = `${visible} ${visible === 1 ? "claim" : "claims"} shown`;
  };

  input.addEventListener("input", render);
})();
