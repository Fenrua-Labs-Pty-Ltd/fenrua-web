# ADR-0001: Local Trust Gate Repository Boundary

Status: Accepted - owner authorization recorded; repository creation authorized
Date: 2026-07-14
Decision owner: A0 / Fenrua owner

## Context

`fenrua-web` is a public product, evidence, documentation, and status surface.
It must not become a production control plane, secret store, customer-data
store, or main product implementation repository. `fenrua-kernel` is a public
research-grade P/N521 and reproducibility repository and must remain separate
from production profiles.

The Local Trust Gate needs a local evaluator, CLI, library, deterministic test
corpus, evidence generator, independent verifier, release artifacts, and a
future SDK boundary. Those responsibilities do not fit either existing
repository without violating its stated boundary.

## Approval Record

Owner approval was required before repository creation. On 2026-07-14, the
Fenrua owner authorized the implementation needed for
`FENRUA-INDUSTRIAL-10`, including the staged creation of the public
`fenrua-specs` and `fenrua-trust-gate` repositories described here.

That authorization permits repository initialization and source implementation.
It does not promote a Trust Gate capability, approve a production profile,
replace release evidence, or waive the R3-to-R4 promotion requirements.

## Implementation Record

The approved repository boundary is now implemented:

- `fenrua-trust-gate` main is at
  `b1c45116d0d35605afaad5a59c814bf789935dce` and contains only the R1 source
  foundation; and
- `fenrua-specs` main is at
  `268788e18bb39d69ffed706294d2605878f04c34` and contains the separate R1
  strict schema and vector registry.

Both repositories are public source with branch protection, named required CI,
linear history, admin enforcement, conversation resolution, no force pushes or
deletion, secret scanning/push protection, and Dependabot security updates.
Those controls establish a source-governance baseline; they are not evidence of
a released Trust Gate capability, production key custody, signed artifacts, or
independent assurance.

## Decision

Create a public `fenrua-trust-gate` repository only after owner approval. It
owns the Rust R1 core/library boundary, discovery CLI, deterministic tests, and
future release-artifact boundary. Evidence generation, a full verifier,
adapters, benchmark harness, signed artifacts, SBOM, and provenance remain
separate future trains. A TypeScript package may begin as a carefully isolated
package in that repository while contracts stabilize; a separate
`fenrua-sdk-js` repository remains an option after API stability is demonstrated.

## Ownership And Classification

| Area | Boundary |
| --- | --- |
| Repository owner | Product Engineering, with A0 integration ownership |
| Classification | Public source; no customer data, provider credentials, or protected topology |
| Source/artifact | Source and reproducible test vectors are public; signed release artifacts and SBOM/provenance are published through a release process |
| Dependencies | Depends on frozen public schemas/specifications; `fenrua-web` may link to releases but never hosts core private state |
| Secrets | No plaintext secrets, signing private keys, provider credentials, or local linkage metadata |
| Data | Fixtures are synthetic/minimised; no production customer payloads or tenant records |
| Release | Signed tags/artifacts, SBOM, provenance, clean reproduction, rollback record, and promotion evidence |
| Archival | Read-only archive only after explicit successor and verification guidance |
| Maintenance | Named maintainer, supported-platform policy, vulnerability process, and compatibility policy required before R4 |

## Alternatives Considered

1. Put the evaluator in `fenrua-web`: rejected because it conflates a public
   static interface with core product implementation and releases.
2. Extend `fenrua-kernel`: rejected because research P/N521 and production
   authorisation profiles must remain separately governed.
3. Start a large multi-repository platform now: rejected as premature; it
   increases coordination and secret/data-boundary risk before the local
   contract is proven.
4. Use a monorepo package inside the future Trust Gate repository: acceptable
   only while it reduces complexity and preserves explicit package boundaries.

## Consequences

No Trust Gate release, CLI availability claim, SDK availability claim, or
product-centred public promotion may occur before this ADR is owner-approved,
the repository exists, and the R3-to-R4 evidence gate is satisfied.
