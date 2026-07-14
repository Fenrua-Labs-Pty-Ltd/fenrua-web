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

Audit, review, scan-output, test-output, visual-capture, and builder reports are
stored outside this source repository. The enforced boundary is defined in
[External audit-artifact policy](docs/EXTERNAL_ARTIFACT_POLICY.md).
Credentials and encrypted recovery bundles are also prohibited from this
repository; see the [public repository secret boundary](docs/PUBLIC_SECRET_BOUNDARY.md).

## Commercial Boundary

The registered operator is **FENRUA LABS PTY LTD** (ABN 62 700 182 663;
ACN 700 182 663). The canonical service, agreement, payment, community, and
evidence boundaries are generated from `data/site-evidence.json`; read the
[access-only commercial boundary](docs/ACCESS_ONLY_COMMERCIAL_BOUNDARY.md) and
the [Legal and Company Centre](https://fenrua.ai/legal). This repository does
not publish an investment, token-crowdfunding, exchange, trading, or
financial-return product.

The public site now exposes Fenrua's AI efficiency infrastructure research and
related technology services, including its Layer 0 AI security architecture,
security-kernel model, standalone route system, toolchain registry, claim
register, maturity register, verifier foundation, and evidence registry. Its
current non-live commercial and document boundaries are recorded separately from
the live block-card surfaces.

Collaboration contact: `partnerships@fenrua.ai`.

Each chain is published only through a **Public Observation Gateway over
Encrypted Private-Mesh Transport**. `/api/chain-progress` reads fixed,
per-chain signed schema-validated observations through server-only Vercel
credentials, verifies their Ed25519 signatures, and never probes or forwards
JSON-RPC. Before publication, a durable atomic per-chain checkpoint rejects
rollback, equivocation, unannounced key changes, and retired-key reuse across
requests and serverless instances. `/api/chain-observation-key` and
`/api/chain-n521-observation-key` expose the matching public verification
metadata plus an authenticated rotation certificate when a key transition is
active; the progress adapter emits a rotation binding only after the durable
checkpoint accepts its exact anchor. Production fails closed unless its
explicitly namespaced checkpoint store is configured. Until Chain N521 has an
independent gateway and public verification key, the UI truthfully shows that
evidence is awaiting rather than simulating a live head.

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

`npm run validate` rejects stale generated routes and validates the permitted
public/static scope, canonical model, route lifecycle, evidence boundaries, and
release-toolchain contract. `npm run release:check` additionally generates and
verifies the release manifest, stages the complete public output, runs the
bounded Overview and Status browser checks, route-wide accessibility analysis,
the Chromium/Firefox/WebKit information-architecture matrix, JavaScript-disabled
coverage, and a clean-checkout reproduction. It does not verify live production
state or protected systems.

## Canonical Public Model

The public estate renders its material claims and capability boundaries from
versioned inputs rather than page-only copy:

- `data/product-ontology.json`
- `data/capability-register.json`
- `data/claim-register.json`
- `data/evidence-taxonomy.json`
- `data/assurance-language.json`
- `data/public-service-catalogue.json`
- `data/route-lifecycle.json`

Useful local commands:

```bash
npm run check:ontology
npm run check:capabilities
npm run check:claims
npm run check:evidence-taxonomy
npm run test:ia
npm run test:accessibility
```

The Local Trust Gate remains a planned research capability. This repository
does not publish its CLI, SDK, hosted verifier, upload interface, or release
artifact.

## Industrial Programme Contracts

The 10.0 programme keeps its product and release boundaries explicit before a
Local Trust Gate implementation is promoted:

- [Product constitution](docs/PRODUCT_CONSTITUTION.md)
- [Domain model](docs/DOMAIN_MODEL.md)
- [Decision semantics](docs/DECISION_SEMANTICS.md)
- [Trust boundary](docs/TRUST_BOUNDARY.md)
- [Promotion gates](docs/PROMOTION_GATES.md)
- [Compatibility policy](docs/COMPATIBILITY_POLICY.md)
- [Cryptographic profiles](docs/CRYPTOGRAPHIC_PROFILES.md)
- [Trust Gate v0.1 bootstrap contract](docs/FENRUA_TRUST_GATE_V0_1_CONTRACT.md)
- [Trust Gate bootstrap plan](docs/FENRUA_TRUST_GATE_BOOTSTRAP.md)
- [API error contract](docs/API_ERROR_CONTRACT.md)
- [Threat model index](docs/THREAT_MODEL_INDEX.md)
- [Integration manifest](docs/FENRUA_INDUSTRIAL_10_INTEGRATION_MANIFEST.md)
- [Readiness ledger](docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md)
- [Trust Gate repository ADR](docs/adr/ADR-0001-TRUST-GATE-REPOSITORY-BOUNDARY.md)
- [Trust Gate implementation ADR](docs/adr/ADR-0002-LOCAL-TRUST-GATE-IMPLEMENTATION.md)

These documents freeze the proposed contracts and record unresolved promotion
dependencies. They do not change the Local Trust Gate's public availability.

## Owner-approved Git Release

An owner approves and merges a validated `main` commit. The existing Vercel Git
integration builds that exact commit and exposes `VERCEL_GIT_COMMIT_SHA`; the
manifest generator refuses an unbound production build. The repository does not
install the Vercel CLI, keeping its unrelated deployment dependency tree out of
the audited development environment.

Before deployment, retain the record digest from the independently built,
trusted release checkout. After deployment, bind the read-only observation to
both that digest and the exact commit:

```bash
RECORD_SHA256=$(node -p "require('./.well-known/fenrua-release.json').integrity.recordSha256")
npm run audit:live-release -- --url https://fenrua.ai --expected-commit <40-character-commit> --expected-record-sha256 "$RECORD_SHA256"
```

The expected record digest is the independent trust anchor; a live manifest's
self-hash alone cannot detect origin compromise. The receipt proves only the
observed public static artifact set at that time; it is not evidence for live
cards, APIs, private systems, or a perpetual production assertion.

## Files

- `index.html` - canonical public website and evidence interface
- `styles.css` - terminal-grade dark-mode reset and interface styling
- `kernel-status.js` - local telemetry and registry manifest
- `data/company-identity.json` - canonical registered operator record
- `data/site-evidence.json` - deterministic commercial and point-in-time evidence input
- `data/public-document-register.json` - public active/archive document register
- `data/toolchain-registry.json` - public machine-readable toolchain registry
- `data/capability-register.json` - canonical capability maturity and availability records
- `data/claim-register.json` - canonical public claim records
- `data/evidence-taxonomy.json` - evidence classes and source records
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
- `server/observation-continuity.js` - atomic durable replay, equivocation, and key-rotation checkpoint
- `scripts/test-observation-continuity.mjs` - deterministic continuity and rotation regression suite
- `scripts/check-secret-boundary.mjs` - fail-closed public source credential and vault gate
- `assets/fenrua-header-logo.jpg` - shared Fenrua header and favicon mark
- `docs/ACCESS_ONLY_COMMERCIAL_BOUNDARY.md` - access-only service statement
- `docs/EXTERNAL_ARTIFACT_POLICY.md` - enforced outside-repository report boundary
- `docs/PUBLIC_SECRET_BOUNDARY.md` - public source and external-vault separation policy
- `docs/PUBLIC_DATA_FLOW.md` - source-bound public data-flow inventory
- `docs/FENRUA_AI_EFFICIENCY_EVIDENCE_STANDARD.md` - evidence contract for future AI-efficiency claims
- `docs/DEPENDENCY_LICENSES.md` - exact development dependency license inventory
- `docs/archive/2026-07-13/` - superseded, noindex public-document records
- `docs/VERCEL.md` - Vercel publishing notes for `fenrua.ai`
- `docs/UTILITY_STANDARD.md` - repository operating standard
- `docs/FENRUA_TOOLCHAIN_LOCK.md` - public toolchain lock

## Tracking Policy

Do not add Google Analytics, Hotjar, pixels, remote embeds, or any other
tracking scripts. If traffic data is needed, use raw server logs from the host.

## Production Domain

Before merging to `main`, run the owner production gate from a clean checkout:

```bash
npm run release:production-check
```

Production publishing is performed by the existing Vercel Git integration, not
by a repository-local deployment CLI.

See [Vercel Publishing](docs/VERCEL.md) and the
[access-only commercial boundary](docs/ACCESS_ONLY_COMMERCIAL_BOUNDARY.md).
