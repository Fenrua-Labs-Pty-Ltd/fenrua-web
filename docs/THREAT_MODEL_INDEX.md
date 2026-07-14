# Fenrua Threat Model Index

Status: Threat-model programme index v0.1
Owner: Security and Supply Chain (A8)
Last reviewed: 2026-07-14

## Method

Each detailed threat model must identify assets, trust boundaries, attackers,
entry points, abuse cases, mitigations, residual risk, owners, tests, evidence,
and review cadence. This index is a work tracker, not evidence that a detailed
model or independent review has completed.

## Required Detailed Models

| ID | Surface | Minimum concerns | Required evidence before promotion |
| --- | --- | --- | --- |
| TM-01 | Local Trust Gate parser | malformed/oversized input, duplicate keys, Unicode, path/control characters, CPU/memory exhaustion | negative corpus, parser fuzzing, resource-limit tests |
| TM-02 | Policy evaluator | ambiguity, deny override, no-match, cyclic references, unsafe extensions | property tests, golden vectors, fail-closed tests |
| TM-03 | Signatures and keys | substitution, context/audience confusion, rotation, compromise, downgrade | profile vectors, mutation tests, key-lifecycle tests |
| TM-04 | Revocation and replay | stale sets, rollback, nonce reuse, offline limitations, time skew | monotonic-revocation and replay-cache tests |
| TM-05 | Evidence and verifier | altered receipts, forged provenance, redaction confusion, same-path verification | independent verifier and tamper corpus |
| TM-06 | SDK and adapters | unsafe defaults, unbounded input, hidden network use, dependency confusion | integration, cancellation, package/provenance tests |
| TM-07 | Control plane | tenant confusion, unsigned distribution, mutation audit, abuse, availability | authz/isolation/distribution/audit tests |
| TM-08 | Identity and approval | workload impersonation, RBAC overreach, approval replay, emergency misuse | identity, approval, and containment tests |
| TM-09 | Evidence/management services | cross-tenant reads, retention, deletion, export, sensitive logging | data-flow, tenant-negative, retention tests |
| TM-10 | Build and release | compromised dependency, action, build input, artifact, provenance | pinned dependency/action checks, SBOM, provenance verification |
| TM-11 | Public web and observation | misleading status, script injection, cache/route confusion, chain overclaim | public-boundary, route, a11y, live-edge tests |
| TM-12 | Operations and recovery | backup corruption, restore failure, unsafe rollback, incident communications | restore, rollback, canary, and incident-drill evidence |

## Security Negative Rules

The implementation must reject unsupported schemas, unsigned inputs in a
signature-required profile, ambiguous policy, missing mandatory revocation
state, expired or future time material, revoked identities/artifacts/policies/
keys, nonces that require replay state when that state is unavailable, unknown
cryptographic profiles, cross-tenant identifiers, and any attempt to use
research cryptography as a production profile.

## Review And Finding Lifecycle

Threat models and code reviews are versioned to source commits. Findings have a
stable ID, severity, scope, proof, owner, remediation, target date, evidence,
and verified closure. A severity exception must be time-bounded, owner-approved,
and visible to the relevant promotion gate; it never changes a hard blocker
into a warning.
