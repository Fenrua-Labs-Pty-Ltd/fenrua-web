# ADR-0002: Local Trust Gate Implementation Profile

Status: Accepted for implementation after ADR-0001 repository approval
Date: 2026-07-14
Decision owner: A3, integrated by A0; cryptographic profile review by A6/A12

## Context

The first Fenrua product workflow needs an offline, deterministic, fail-closed
evaluator with a portable CLI, bounded resource use, structured evidence, and
an independently verifiable result. It must not depend on an external chain,
Fenrua-hosted connectivity, a browser runtime, or the P/N521 research kernel.

## Decision

Use a Rust core library and CLI in the future owner-approved
`fenrua-trust-gate` repository. The library owns strict input parsing,
schema/profile validation, canonical byte handling, policy evaluation,
revocation/replay checks, evidence construction, and deterministic result
generation. The CLI is a thin adapter over that library. A separately packaged
verifier must consume the generated evidence through a public contract and must
not trust producer-only in-memory state.

The v0.1 core has no network client, dynamic policy execution, remote schema
loading, or implicit telemetry. It accepts local exact-byte inputs only.

## Alternatives Considered

| Option | Assessment | Decision |
| --- | --- | --- |
| Rust core and CLI | Memory safety, explicit error handling, strong types, deterministic binary distribution, cross-platform support, mature fuzzing ecosystem. | Chosen. |
| Go core | Good distribution and standard library, but less direct reuse of existing Rust-oriented fuzzing and strict type patterns proposed for the product. | Not selected for v0.1. |
| Node/TypeScript core | Convenient for website-adjacent tooling, but requires a runtime installation and increases risk of dynamic execution/default network paths in the hot path. | Not selected for core; suitable later for an SDK. |
| C++ extension to `fenrua-kernel` | Would blur the public research/kernel boundary and bring native-memory-safety burden into an authorisation path. | Rejected. |

## Dependency And Supply-Chain Rules

The future repository must approve every dependency before use, pin exact
versions in its lockfile, record purpose/license/update/removal policy, and
produce SBOM and provenance. Cryptographic libraries must be established,
reviewed, profile-specific, and selected through A6/A12 review; this ADR does
not pre-approve a crate or make any production cryptographic claim.

A strict parser must reject duplicate JSON keys, unbounded recursion/arrays,
unknown fields in strict schemas, type coercion, and path/URL indirection.
Using a general JSON deserializer that silently overwrites duplicate keys is not
an acceptable v0.1 parser.

## Consequences

The core, CLI, schemas, and verifier are separate from `fenrua-web` and
`fenrua-kernel`. The initial TypeScript SDK is generated or built only after the
v0.1 input/output contracts are stable. No local Trust Gate may be presented as
available until the R3-to-R4 promotion gate has its required release, SBOM,
provenance, benchmark, test corpus, reproduction, and owner evidence.
