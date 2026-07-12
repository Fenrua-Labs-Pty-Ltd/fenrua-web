# fenrua-web

Static Protocol Explorer for `fenrua.ai`.

## First Evidence Link

- [Security Audit Log](docs/SECURITY_AUDIT_LOG.md)

This repo is a standalone website for Fenrua Labs and the `fenrua-kernel`
evidence surface. It uses plain HTML, one CSS file, a local SVG asset, and one
local JavaScript manifest for status hydration.

## Utility Standard

- `fenrua-kernel` is the bedrock research artifact.
- `fenrua-web` is the reproducible protocol interface.
- Releases are identified by evidence commit, not marketing name.
- `bedrock-source` and `evidence-commit` stay separated for future releases.
- Do not claim "Certified" or "Formally Verified" until the math is complete
  and external audits are signed.

## Local Build

No build step is required.

Open `index.html` directly in a browser, or serve the folder with any static
file server.

## Files

- `index.html` - protocol explorer
- `styles.css` - terminal-grade dark-mode reset and interface styling
- `kernel-status.js` - local telemetry and registry manifest
- `assets/sigil.svg` - local Fenrua mark
- `docs/SECURITY_AUDIT_LOG.md` - audit log
- `docs/GENESIS_MANIFEST.md` - Genesis Manifest Record
- `docs/REGRESSION_HISTORY.md` - regression coverage record
- `docs/audit-report.json` - machine-readable audit summary
- `docs/DEPLOYMENT.md` - hosting notes
- `docs/UTILITY_STANDARD.md` - repository operating standard

## Tracking Policy

Do not add Google Analytics, Hotjar, pixels, remote embeds, or any other
tracking scripts. If traffic data is needed, use raw server logs from the host.
