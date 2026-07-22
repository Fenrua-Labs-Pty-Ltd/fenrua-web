const handoff = [
  "Public-repository production deployment is retired and fail-closed.",
  "Use the Owner-approved, non-secret release request in fenrualabs/fenrua-public-operations-system.",
  "An explicitly assigned Codex Release Agent may prepare that request after the exact public commit is approved on protected main.",
  "Only the Owner's protected merge of the exact, expiring request may trigger the private deployment controller.",
].join("\n");

if (process.argv.includes("--help")) {
  console.log(handoff);
  process.exit(0);
}

console.error(handoff);
process.exit(1);
