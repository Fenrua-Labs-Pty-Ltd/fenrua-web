# Fenrua Toolchain Lock

Status: generated public lock summary  
Generated at: 2026-07-12T19:49:17Z  
Source: `data/toolchain-registry.json`
Registry SHA-256: `98ff822190553ef631df43b00fa8ec5003ab757124b522b51c7d5ae8ad7d21e9`

## Method

Codex ran bounded, read-only version, help, package-list, cargo-list, and Docker
image-list commands. Public output was normalized to avoid private paths,
usernames, hostnames, endpoints, credentials, and private topology.

## Status Vocabulary

- `INSTALLED_AND_EXECUTED`
- `INSTALLED_EXECUTED_EVIDENCE_PRODUCING`
- `INSTALLED_EXPLORATORY`
- `PROJECT_LOCAL`
- `CONTAINER_ONLY`
- `SUPERSEDED`
- `VERSION_REVIEW_REQUIRED`
- `NOT_IN_CANONICAL_PIPELINE`
- `DEPRECATED`
- `UNAVAILABLE`

## Evidence Hierarchy

The public registry orders evidence states as: evidence-producing, campaign
executed, smoke-tested, version-verified, detected or inventory-only,
exploratory, unavailable, and superseded. These states are deliberately not
interchangeable. A campaign-executed label requires a declared validation
command in the frozen record; an evidence-producing record can instead bind a
source or inventory artifact without claiming that a validation campaign ran.

## Key Detected Versions

| Tool | Detected Version | Status |
| --- | --- | --- |
| Node.js | `v24.18.0` | `INSTALLED_EXECUTED_EVIDENCE_PRODUCING` |
| npm | `11.18.0` | `INSTALLED_EXECUTED_EVIDENCE_PRODUCING` |
| Semgrep | `1.169.0` | `INSTALLED_AND_EXECUTED` |
| SnarkJS | `0.7.6` | `PROJECT_LOCAL` |
| Solidity solc | `0.8.35+commit.47b9dedd` | `INSTALLED_AND_EXECUTED` |
| Forge/Cast/Anvil/Chisel | `1.7.1` | `INSTALLED_AND_EXECUTED` |
| Slither | `0.11.5` | `INSTALLED_AND_EXECUTED` |
| Echidna | `2.3.2` | `INSTALLED_AND_EXECUTED` |
| Medusa | `1.5.1` | `INSTALLED_AND_EXECUTED` |
| Circom | `2.2.3` | `INSTALLED_AND_EXECUTED` |
| Circomspect | `0.9.0` | `INSTALLED_AND_EXECUTED` |
| SageMath | `10.9` | `INSTALLED_AND_EXECUTED` |
| Docker | `29.6.1` | `INSTALLED_AND_EXECUTED` |
| Supabase CLI | `2.106.0` | `INSTALLED_AND_EXECUTED` |
| Geth | `1.17.4-stable` | `INSTALLED_AND_EXECUTED` |
| Besu | `26.6.1` | `INSTALLED_AND_EXECUTED` |
| Erigon | `3.5.1-bed215a4` | `INSTALLED_AND_EXECUTED` |
| Reth | `2.3.0` | `INSTALLED_AND_EXECUTED` |

## Semgrep Reconciliation

Detected Semgrep version: `1.169.0`.

The user clarified on 2026-07-12 that the earlier marker ending in `18` was a
typo between `1` and `19`. The detected local version is retained as source of
truth and is not marked `VERSION_REVIEW_REQUIRED`.

## SnarkJS Reconciliation

Detected SnarkJS version: `0.7.6`.

The nearby `1.13.8` value in the inspected kernel package is the `underscore`
dependency, not SnarkJS.

## Limits

This lock proves local inspection, not production security. It does not finalize
contract bytecode, deployment, invariant, reserve, or runtime claims.

## Evidence-Lock Integrity Policy

The website does not relabel toolchains after evidence capture. The public lock
preserves the inspected evidence environment so public claims do not drift away
from the audit and evidence state.

During this task:

- No audited toolchain-version, kernel-dependency, OS, or container update was
  performed. New website validation gates are not a revision of this frozen
  version capture.
- `fenrua-web` dependency review found no package dependency drift; the website
  has no package dependencies.
- Inspected `fenrua-kernel` direct dependency review found no direct pnpm
  dependency drift.
- Version records are kept as detected so they continue to match the inspected
  evidence environment.

If a future operator intentionally updates a dependency or tool, the update must
produce a new version capture and a new frozen evidence bundle before any public
claim is moved.
