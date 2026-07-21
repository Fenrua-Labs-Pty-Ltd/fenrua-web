import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkMode = process.argv.includes("--check");

const noticeStart = "<!-- fenrua-official-source-notice:start -->";
const noticeEnd = "<!-- fenrua-official-source-notice:end -->";
const noticePattern = new RegExp(`${noticeStart}[\\s\\S]*?${noticeEnd}\\n?`, "g");

const noticeParagraphs = [
  "fenrua.ai is the sole and only official website for Fenrua Protocol and Fenrua Labs Pty Ltd.",
  "Any website, social account, media channel, token page, contract listing, claim page, airdrop page, staking page, swap, bridge, NFT mint, Telegram group, Discord server, or public communication claiming to represent Fenrua Protocol must be treated as unofficial unless it is explicitly listed or linked from fenrua.ai.",
  "Fenrua Protocol has no live token, contract, presale, airdrop, staking pool, swap, bridge, NFT mint, or claim page on Ethereum, Solana, BSC, or any other public mainnet chain.",
  "Fenrua activity is currently limited to Fenrua’s two private chains and bounded public evidence surfaces. Fenrua Labs Pty Ltd is not offering, selling, promoting, or authorising any commercial token offering.",
  "Any public token, contract, listing, website, media profile, message, group, or account claiming to represent a live Fenrua token or an official Fenrua commercial offering should be treated as unauthorised, impersonated, or potentially fraudulent unless explicitly confirmed on fenrua.ai.",
  "Always verify Fenrua information from fenrua.ai before trusting any external link, message, contract address, social post, or media account.",
];

const targets = [
  {
    path: "index.html",
    anchor: "      <section id=\"chain-progress\" class=\"section-shell chain-progress desktop-chain-progress\" aria-labelledby=\"chain-progress-title\">",
  },
  {
    path: "trust/index.html",
    anchor: "      <section class=\"section-shell\" aria-labelledby=\"trust-records\"><div class=\"section-heading\"><p class=\"eyebrow\">MACHINE-READABLE RECORDS</p>",
  },
  {
    path: "legal/index.html",
    anchor: "      <section class=\"section-shell\" aria-labelledby=\"company-identity-title\">",
  },
];

function stripNotice(content) {
  return content.replace(noticePattern, "");
}

function noticeSection() {
  return `${noticeStart}
      <section class="section-shell split-section official-source-notice" aria-labelledby="official-source-notice-title">
        <div>
          <p class="eyebrow">OFFICIAL SOURCE</p>
          <h2 id="official-source-notice-title">Official Source and Anti-Impersonation Notice</h2>
          <p>${noticeParagraphs[0]}</p>
        </div>
        <div class="constraint-list">
          ${noticeParagraphs.slice(1).map((paragraph) => `<p>${paragraph}</p>`).join("\n          ")}
        </div>
      </section>
${noticeEnd}
`;
}

function applyNotice(content, target) {
  const stripped = stripNotice(content);
  assert.ok(stripped.includes(target.anchor), `Official-source insertion anchor missing in ${target.path}.`);
  return stripped.replace(target.anchor, `${noticeSection()}${target.anchor}`);
}

function readTarget(target) {
  const file = path.join(root, target.path);
  assert.ok(existsSync(file), `Official-source target missing: ${target.path}`);
  return readFileSync(file, "utf8");
}

function writeTarget(target, content) {
  writeFileSync(path.join(root, target.path), content);
}

function verifyNoticeContent(content, target) {
  assert.equal((content.match(/id="official-source-notice-title"/g) ?? []).length, 1, `${target.path} must contain exactly one official-source notice heading.`);
  assert.equal((content.match(/fenrua-official-source-notice:start/g) ?? []).length, 1, `${target.path} must contain exactly one official-source notice start marker.`);
  assert.equal((content.match(/fenrua-official-source-notice:end/g) ?? []).length, 1, `${target.path} must contain exactly one official-source notice end marker.`);
  for (const paragraph of noticeParagraphs) {
    assert.ok(content.includes(paragraph), `${target.path} is missing required official-source notice text: ${paragraph}`);
  }
  assert.doesNotMatch(content, /0x[a-fA-F0-9]{40}/, `${target.path} must not publish a contract address in the official-source package.`);
}

function verifyGeneratorBaseline(backups) {
  try {
    for (const [targetPath, content] of backups) {
      writeFileSync(path.join(root, targetPath), stripNotice(content));
    }
    const result = spawnSync(process.execPath, ["scripts/generate-static-routes.mjs", "--check"], {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
    });
    if (result.status !== 0) {
      const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      throw new Error(`Static route generator baseline check failed before official-source postprocessing.\n${output}`);
    }
  } finally {
    for (const [targetPath, content] of backups) {
      writeFileSync(path.join(root, targetPath), content);
    }
  }
}

if (checkMode) {
  const backups = new Map(targets.map((target) => [target.path, readTarget(target)]));
  verifyGeneratorBaseline(backups);

  const stale = [];
  for (const target of targets) {
    const current = backups.get(target.path);
    const expected = applyNotice(current, target);
    if (current !== expected) stale.push(target.path);
    verifyNoticeContent(current, target);
  }

  if (stale.length) {
    throw new Error(`Official-source notice output is stale: ${stale.join(", ")}. Run npm run generate:static.`);
  }
} else {
  const changed = [];
  for (const target of targets) {
    const current = readTarget(target);
    const next = applyNotice(current, target);
    verifyNoticeContent(next, target);
    if (next !== current) {
      writeTarget(target, next);
      changed.push(target.path);
    }
  }
  console.log(JSON.stringify({ status: "ok", scope: "official-source-notice", changed }));
}
