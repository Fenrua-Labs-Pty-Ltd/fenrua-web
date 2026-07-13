# fenrua-web

Canonical public website and evidence interface for `fenrua.ai`.

## Current Public Evidence

- [Current public audit](/audit)
- [Release manifest](/.well-known/fenrua-release.json)
- [Site-evidence input](data/site-evidence.json)
- [Public document register](data/public-document-register.json)

This repo is a standalone website for Fenrua Labs and the `fenrua-kernel`
evidence surface. It uses plain HTML, one CSS file, a local SVG asset, and one
local JavaScript manifest for status hydration.

## Commercial Boundary

Fenrua Labs Pty Ltd provides access to AI security infrastructure software,
related technology services, and evidence-aware intelligence workflows through
tiered service subscriptions and client-specific business agreements only.

Fenrua Labs Pty Ltd does not offer investments, token crowdfunding, securities,
bonds, equity, debt, managed investment interests, profit-sharing arrangements,
revenue-sharing arrangements, yield products, exchange products, trading
products, or any financial-return scheme. Neither a subscription nor a
client-specific business agreement gives, promises, expects, entitles, or
represents profit, return, token appreciation, token allocation, liquidity,
resale value, dividends, buyback rights, or ownership in Fenrua Labs Pty Ltd.

Fenrua Labs Pty Ltd does not operate a market, exchange, order book, trading
venue, or public swap product. It does not provide financial, investment, legal,
tax, professional, or other advice, or any recommendation to buy, sell, hold,
trade, or rely on an asset for financial gain. See the full
[access-only commercial boundary](docs/ACCESS_ONLY_COMMERCIAL_BOUNDARY.md).

The public site now exposes Fenrua's Layer 0 AI security architecture,
security-kernel model, standalone route system, toolchain registry, claim
register, maturity register, verifier foundation, and evidence registry. Its
current non-live commercial and document boundaries are recorded separately from
the live block-card surfaces.

Collaboration contact: `partnerships@fenrua.ai`.

Each chain is published only through a **Public Observation Gateway over
Encrypted Private-Mesh Transport**. `/api/chain-progress` reads fixed,
per-chain signed schema-validated observations through server-only Vercel
credentials, verifies their Ed25519 signatures, and never probes or forwards
JSON-RPC. `/api/chain-observation-key` and
`/api/chain-n521-observation-key` expose the matching public verification
metadata. Until Chain N521 has its own independently signed gateway and key,
the UI truthfully shows that evidence is awaiting rather than simulating a live
head.

See [Public Observation Gateway](docs/PUBLIC_OBSERVATION_GATEWAY.md) and copy
the server-only variable names from `.env.example`; never commit their values.

## Canonical Website

`fenrua-web` is the canonical public website for Fenrua Labs. Production
publishes through the existing Vercel project `fenrua-web`, which owns
`fenrua.ai`.

## Utility Standard

- `fenrua-kernel` is the bedrock research artifact.
- `fenrua-web` is the reproducible public website and evidence interface.
- Public release evidence is limited to the static artifacts listed in its
  release manifest and audit scope.
- `bedrock-source` and release provenance stay separated from marketing claims.
- Do not claim "Certified" or "Formally Verified" until the math is complete
  and external audits are signed.

## Local Validation

Use Node 24 and the committed lockfile:

```bash
npm ci
npm run generate:static
npm run validate
```

`npm run validate` rejects stale generated routes and validates only the
permitted public/static scope. `npm run release:check` additionally generates
and verifies the release manifest, then runs browser checks only for Evidence,
Status, Toolchain, and Verify. It never loads the homepage live-card surface.

## Owner-only Release

An owner approves the validated `main` commit, confirms that Vercel exposes
`VERCEL_GIT_COMMIT_SHA`, and runs the pinned production command from a clean
checkout. The production command refuses any branch other than `main`, and the
manifest generator refuses a dirty checkout except for explicit local,
non-deployment validation.

After deployment, run the read-only public observation:

```bash
npm run audit:live-release -- --url https://fenrua.ai --expected-commit <40-character-commit>
```

The receipt proves only the observed public static artifact set at that time;
it is not evidence for live cards, APIs, private systems, or a perpetual
production assertion.

## Files

- `index.html` - protocol explorer
- `styles.css` - terminal-grade dark-mode reset and interface styling
- `kernel-status.js` - local telemetry and registry manifest
- `data/site-evidence.json` - deterministic non-live commercial and evidence input
- `data/public-document-register.json` - public active/archive document register
- `data/toolchain-registry.json` - public machine-readable toolchain registry
- `scripts/generate-release-manifest.mjs` - release-only public static artifact manifest
- `scripts/audit-live-release.mjs` - read-only post-deploy public artifact audit
- `tests/browser/non-live-public-surface.spec.mjs` - non-live browser regression coverage
- `toolchain/index.html` - searchable public toolchain route
- `architecture/index.html` - standalone architecture route
- `kernel/index.html` - standalone security-kernel route
- `utilities/index.html` - utility catalogue
- `research/index.html` - research registry
- `verify/index.html` - verifier foundation and downloadable examples
- `developers/index.html` - developer quick-start
- `evidence/index.html` - evidence registry
- `status/index.html` - status-state system
- `examples/*.json` - verifier example artifacts
- `api/chain-progress.js` - bounded signed Chain 978 and Chain N521 observation adapter
- `api/chain-observation-key.js` - Chain 978 public Ed25519 verification metadata endpoint
- `api/chain-n521-observation-key.js` - Chain N521 public Ed25519 verification metadata endpoint
- `assets/sigil.svg` - local Fenrua mark
- `docs/ACCESS_ONLY_COMMERCIAL_BOUNDARY.md` - access-only service statement
- `docs/archive/2026-07-13/` - superseded, noindex public-document records
- `docs/VERCEL.md` - Vercel publishing notes for `fenrua.ai`
- `docs/UTILITY_STANDARD.md` - repository operating standard
- `docs/FENRUA_TOOLCHAIN_LOCK.md` - public toolchain lock

## Tracking Policy

Do not add Google Analytics, Hotjar, pixels, remote embeds, or any other
tracking scripts. If traffic data is needed, use raw server logs from the host.

## Production Domain

Publish only after the owner-only release checks pass and the source checkout is
clean. The pinned command targets the canonical `fenrua-web` Vercel project:

```bash
npm run deploy:production:node24
```

The typo-safe alias remains available for compatibility:

```bash
npm run deploy:prodction:node24
```

See [Vercel Publishing](docs/VERCEL.md) and the
[access-only commercial boundary](docs/ACCESS_ONLY_COMMERCIAL_BOUNDARY.md).
