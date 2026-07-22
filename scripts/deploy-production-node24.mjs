const handoff = [
  "Public-repository direct deployment command is retired and fail-closed.",
  "Use the Owner-approved Git-integrated release sequence in AGENTS.md.",
  "After the exact reviewed pull request is green, the Owner's ship-it command authorises its protected main merge.",
  "Vercel's existing Git integration then deploys Production; verify the live manifest before claiming publication.",
].join("\n");

if (process.argv.includes("--help")) {
  console.log(handoff);
  process.exit(0);
}

console.error(handoff);
process.exit(1);
