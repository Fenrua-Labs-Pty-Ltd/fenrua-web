const major = Number.parseInt(process.versions.node.split(".")[0] ?? "", 10);

if (major !== 24) {
  console.error(`Node 24 required. Current runtime: ${process.version}`);
  process.exit(1);
}

console.log(`Node runtime OK: ${process.version}`);
