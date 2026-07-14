# Fenrua Trust Gate Bootstrap Plan

Status: R1 source foundation implemented; no product availability claim
Owner: A3, under ADR-0001
Last reviewed: 2026-07-14

The Fenrua owner authorized implementation on 2026-07-14. The separate public
source repositories now exist: [`fenrua-trust-gate`](https://github.com/fenrualabs/fenrua-trust-gate)
at `b1c45116d0d35605afaad5a59c814bf789935dce` and
[`fenrua-specs`](https://github.com/fenrualabs/fenrua-specs) at
`268788e18bb39d69ffed706294d2605878f04c34`. This does not make a Trust Gate interface available
or satisfy a release, preview, production, or assurance gate.

## Implemented R1 Boundary

The Trust Gate repository currently implements only the R1 source foundation:

- strict bounded JSON syntax parsing, including duplicate-key and unpaired
  surrogate rejection;
- deterministic draft canonical JSON and domain-separated SHA-256 digests;
- reserved-unreleased schema/profile discovery, a generic canonical-digest
  verifier boundary, deterministic test-kit primitives, and a discovery-only
  `fenrua` CLI;
- an explicit unavailable evaluator boundary with no file I/O, network,
  policy evaluation, decision, evidence, signing, key, or durable replay
  operation; and
- locked CI, public-admission, dependency, verifier-boundary, branch-protection,
  secret-scanning, push-protection, and Dependabot controls.

The specifications repository provides the separate R1 strict registry: 13
protocol schemas plus one test-only vector schema, valid/negative fixtures, and
cross-role rejection tests. Neither repository releases a CLI product, SDK,
hosted service, production cryptographic profile, or Trust Gate workflow.

## Proposed Repository Shape

```text
fenrua-trust-gate/
  crates/
    fenrua-protocol/      strict bounded parser, wire types, schema dispatch
    fenrua-c14n/          versioned canonicalisation and domain-separated digests
    fenrua-crypto/        profile dispatch, verification, rotation, revocation
    fenrua-gate/          policy evaluator, replay trait, decision/evidence/receipt
    fenrua-verify/        separate public verifier; never depends on fenrua-gate
    fenrua-cli/           bounded local-file I/O and atomic output adapter
    fenrua-testkit/       deterministic clock/store and test-only reference tools
  schemas/v1/             frozen local v1 schemas; no remote resolution
  fixtures/v1/
    valid/
    invalid/
    golden/
  benches/                reproducible local benchmark harness
  fuzz/                   parser/canonicalisation/policy fuzz targets
  examples/               synthetic, non-secret integration examples
  docs/                   quick start, profiles, limits, support boundaries
  ci/                     pinned CI, release, provenance, platform matrix
  Cargo.lock              committed exact dependency graph
  rust-toolchain.toml     pinned release toolchain
```

This shape is a bootstrap plan, not permission to use a monorepo workspace as a
control plane or to store tenant data, provider credentials, or production keys.

## First Independently Reviewable Trains

1. implemented R1: strict parser, size limits, reserved schema/profile
   discovery, negative fixtures, and the separate specifications registry;
2. partially implemented R1: draft canonicalisation, domain-separated digest
   primitives, generic digest comparison, and immutable bootstrap vectors;
3. constrained policy parser/evaluator with deny-overrides and deterministic
   decision output;
4. revocation and replay controls;
5. evidence bundle, receipt, and independent verifier;
6. CLI ergonomics, doctor, integration fixture, and local benchmark;
7. release artifacts, SBOM, provenance, signing, and reproduction.

Each train retains its negative tests; no passing result may be obtained by
relaxing strict parsing, disabling a platform, or changing a fixture to match a
bug.

The core uses ordered collections and explicit sort order. It derives decision
and evidence IDs from domain-separated inputs. `fenrua-verify` validates
independently and must not call or link `fenrua-gate`; any future differential
test uses a separately implemented/pinned reference rather than a wrapper
around production code.

## Public Repository Admission Controls

The first repository train must include a public-evidence admission policy,
`SECURITY.md`, `CODEOWNERS`, claim/exception/finding record templates, and a CI
guard that rejects raw audit reports, scan dumps, screenshots, credentials,
private logs, customer evidence, and working review artifacts. It may retain
approved safe artifacts such as signed manifests, SBOMs, provenance, digests,
public-safe threat summaries, and approved advisories.

The repository also needs a dependency inventory and CI policy recording each
dependency's purpose, owner, exact version, licence, source, security state,
update policy, and removal plan. It rejects unpinned Git dependencies,
unchecked binary downloads, unreviewed install scripts, and dependencies that
collect telemetry by default.

Candidate direct dependencies are deliberately few: a strict JSON/schema layer,
SHA-256 implementation, profile-gated signature implementations, base64 codec,
time handling, typed errors, and CLI parsing. Every choice still needs
license/security/purpose review, exact lockfile pinning, and a strict parser
wrapper that rejects duplicate keys. Async runtimes, HTTP clients, URL
resolvers, database clients, scripting engines, random identifiers, and
unbounded `anyhow`-style error propagation are excluded from the decision core.

## External Gates That A Public Scaffold Cannot Satisfy

| Gate | Required owner action | Evidence needed before promotion |
| --- | --- | --- |
| Private evidence | Provision a private evidence vault and reviewer access policy. | Access-control record and private audit trail. |
| Repository governance | Configure branch protection, required reviews/checks, push protection, protected environments, and release approval. | Read-only organisation configuration verification. |
| Key and CI custody | Configure workload identity, KMS/provider custody, signing, package/container registry, and secret management. | Signed release independently verified from a clean environment. |
| SRE operations | Operate telemetry, probes, alerts, status integration, backups, restore, and incident response. | Private drill and alert evidence with approved exclusions. |
| Data and legal | Decide regions, processors, retention/deletion, terms, privacy, DPA, and disclosures with legal review. | Approved legal/data records and exercised deletion/backup expiry. |
| Promotion | Run real environments, bounded canary, observation period, and safe rollback. | Deployment/change records and forced rollback evidence. |
| Independent assurance | Obtain separate reproduction, security/crypto review, and pen test where required. | Confidential signed reports and finding lifecycle. |

These gates are intentionally not represented as passing merely because a
repository template exists. The public readiness package must report them as
unavailable or pending until their evidence exists.

## Test And Release Baseline

The repository must cover schema, unit, property, fuzz, contract, integration,
differential, end-to-end, security, performance, and independent-reproduction
layers. Initial release targets are Linux x86_64, macOS ARM64, and Windows
x86_64; unsupported platforms must be explicit. Golden vectors must produce
identical decision, reason codes, canonical digest, evidence content excluding
declared environment metadata, and verifier result across supported platforms.

Before R4, retain an exact source commit, tagged artifact digest, SBOM digest,
provenance digest, supported-platform matrix, corpus result, benchmark record,
known limitations, and clean reproduction record. Before R5, add independent
review, fuzzing, recovery plan, real integration, vulnerability process, and
owner approval.
