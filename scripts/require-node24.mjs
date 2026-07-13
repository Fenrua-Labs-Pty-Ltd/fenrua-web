const requiredNode = "v24.18.0";
const requiredNpm = "11.18.0";
const npmVersion = process.env.npm_config_user_agent?.match(/^npm\/([^ ]+)/)?.[1] ?? null;
const nodeMajor = Number(process.versions.node.split(".")[0]);
const npmMajor = npmVersion ? Number(npmVersion.split(".")[0]) : null;
const vercelCommit = (process.env.VERCEL_GIT_COMMIT_SHA || "").trim().toLowerCase();
const isBoundVercelBuild = process.env.VERCEL === "1" && /^[0-9a-f]{40}$/.test(vercelCommit);

if (isBoundVercelBuild) {
  // Vercel exposes only a managed Node major selector. Keep its build bounded
  // to the audited major lines and bind the output to the supplied Git commit;
  // owner and GitHub validation below remain exact patch-level environments.
  if (nodeMajor !== 24) {
    console.error(`Vercel Node 24.x required. Current runtime: ${process.version}`);
    process.exit(1);
  }

  if (npmMajor !== null && npmMajor !== 11) {
    console.error(`Vercel npm 11.x required. Current runtime: ${npmVersion}`);
    process.exit(1);
  }

  console.log(`Bound Vercel runtime OK: Node ${process.version}${npmVersion ? ` · npm ${npmVersion}` : ""}`);
} else {
  if (process.version !== requiredNode) {
    console.error(`Node ${requiredNode.slice(1)} required. Current runtime: ${process.version}`);
    process.exit(1);
  }

  if (npmVersion && npmVersion !== requiredNpm) {
    console.error(`npm ${requiredNpm} required. Current runtime: ${npmVersion}`);
    process.exit(1);
  }

  console.log(`Release runtime OK: Node ${process.version}${npmVersion ? ` · npm ${npmVersion}` : ""}`);
}
