import { execFileSync } from "node:child_process";

const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
if (branch !== "main") {
  console.error(`Production deployment requires the approved main branch. Current branch: ${branch || "detached HEAD"}`);
  process.exit(1);
}

console.log("Production branch OK: main");
