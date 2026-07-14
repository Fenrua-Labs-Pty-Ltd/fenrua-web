# FENRUA-INDUSTRIAL-10 Integration Manifest

Status: Active programme control record
Integrator: A0
Baseline source: `63f803cdc4a43bba23eccbfed348a904b77b503e`
Task source SHA-256: `b19e4418c619a41c825ba3eea6e717cc9a6e40d45bc947a43cc3d97292d7e804`
Last reviewed: 2026-07-14

## Wave Order

```text
0 production truth
1 product constitution and contracts
2 local Trust Gate and schemas
3 SDK and integration fixtures
4 evidence and independent verification
5 control-plane/tenant skeleton
6 identity, policy, revocation, and keys
7 supply chain and security
8 SRE, data, and enterprise controls
9 industrial public experience
10 independent verification and production candidate
```

No train may merge across an unmet prior-wave hard gate. An implementation may
be prepared in an isolated branch, but a source branch is not evidence of
release, availability, or production maturity.

## Contract Freeze v0.1

| Contract | Canonical owner | Current source |
| --- | --- | --- |
| Product vocabulary | A2 | `PRODUCT_CONSTITUTION.md` |
| Capability maturity | A2 | `PROMOTION_GATES.md` and capability register |
| Entity identifiers | A2 | `DOMAIN_MODEL.md` |
| Schema conventions | A4 | `FENRUA_TRUST_GATE_V0_1_CONTRACT.md`; future owner-approved specs boundary |
| Error envelope | A4 | `API_ERROR_CONTRACT.md`; no hosted API released |
| Decision result codes | A3 | `DECISION_SEMANTICS.md` |
| Signature profiles | A6 | `CRYPTOGRAPHIC_PROFILES.md` |
| Evidence bundle | A7 | `FENRUA_TRUST_GATE_V0_1_CONTRACT.md`; no released evidence artifact |
| Tenant context | A10 | Workstream 11 contract; not yet released |
| API versioning | A4 | `COMPATIBILITY_POLICY.md` |
| Timestamp/freshness | A3 | `DECISION_SEMANTICS.md` |
| Revocation | A6 | Workstream 7 contract; not yet released |
| Audit event | A7 | Workstream 8 contract; not yet released |
| Repository boundaries | A0 | ADR-0001 |
| Promotion gates | A0 | `PROMOTION_GATES.md` |

Any competing contract needs an ADR and A0 approval. `not yet released` is an
explicit boundary, not permission to invent an implementation-specific variant.

## Shared-File Ownership

| Files | Owner |
| --- | --- |
| `docs/FENRUA_INDUSTRIAL_10_*`, ADRs | A0 |
| Product ontology and capability register | A2 |
| Trust Gate core and CLI | A3 in future approved product repository |
| Normative schemas and SDK | A4 in future approved specs/product boundary |
| Control-plane services | A5 in future approved platform boundary |
| Identity, policy, revocation, keys | A6 |
| Claims, evidence, independent verifier | A7 |
| CI, SBOM, supply-chain controls | A8 |
| SRE, restore, incidents | A9 |
| Tenant/data/enterprise controls | A10 |
| Public styles/components/routes | A11 |
| Independent verification/red-team | A12; must not validate its own implementation |

## Merge And Evidence Discipline

Each PR must be independently reviewable and follow the task's PR template.
No test may be removed, relaxed, allowlisted, skipped, or converted from a hard
failure to a warning to obtain green status. Source, artifact, test result, and
live deployment evidence must be linked but never replaced by one another.
