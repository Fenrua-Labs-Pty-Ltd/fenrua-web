# Fenrua Domain Model

Status: Contract baseline v0.1
Owner: Product and Domain (A2)
Last reviewed: 2026-07-14

## Common Entity Envelope

Every domain entity uses a stable, canonical identifier and carries these
fields, either directly or through an immutable revision record:

```text
id, ownerId, tenantId or global scope, environmentId where applicable,
lifecycle, revision, createdAt, updatedAt, supersedes, revocationState,
dataClassification, evidenceRefs
```

Identifiers are scoped and never reused after retirement. Timestamps are UTC
with explicit precision. `supersedes` identifies a prior immutable revision;
it never mutates historical evidence. A revocable entity declares an explicit
state, reason, effective time, and evidence reference.

## Core Entities

| Entity | Scope | Purpose |
| --- | --- | --- |
| Tenant | control plane | Administrative and data-isolation boundary. |
| Environment | tenant | Bounded deployment context such as development, test, or production. |
| Entity | tenant or global | Stable organisational, service, or workload subject. |
| Operator | tenant or global | Human or service principal acting under defined authority. |
| Workload | environment | Executable service identity and deployment binding. |
| Agent | workload | AI agent identity, declared capabilities, and owner. |
| Model | workload | Model version and integrity/reference metadata. |
| Tool | environment | Declared action surface an agent may request. |
| Artifact | environment | Immutable build, model, policy, or payload subject to integrity checks. |
| Build | environment | Reproducible build record and provenance references. |
| Deployment | environment | Artifact-to-environment deployment record. |
| Policy | tenant or global | Stable policy family identifier. |
| PolicyRevision | policy | Immutable signed policy revision and applicability rules. |
| Approval | request or decision | Bound human or service approval record. |
| Request | local decision | Exact proposed action and input digests. |
| Decision | local decision | Deterministic `ALLOW` or `DENY` outcome. |
| EvidenceBundle | evidence plane | Ordered decision evidence and verification material. |
| Receipt | evidence plane | Human-readable projection of an evidence bundle. |
| Verification | evidence plane | Independent verification result and verifier profile. |
| Revocation | tenant or global | Monotonic revocation assertion with scope and effective time. |
| Key | tenant or global | Logical signing or verification key identity. |
| KeyVersion | key | Algorithm/profile-bound key material metadata and lifecycle. |
| TrustProfile | local decision | Versioned assurance and crypto requirements for evaluation. |
| CompatibilityProfile | local decision | Declared schema, policy, CLI, SDK, and API compatibility set. |
| Incident | management plane | Security or reliability event with scoped records and corrective action. |
| Release | management plane | Immutable source, artifact, SBOM, provenance, and approval record. |
| Observation | optional publication | Read-only, separately bounded observation; never an authorisation input by default. |

## Identity And Scope Rules

- A tenant ID is not an operator, workload, environment, policy, or key ID.
- A workload identity is scoped to one environment and never inferred from a
  caller-provided payload field.
- Policy, key, evidence, and revocation IDs include or resolve through their
  tenant and environment scope before evaluation.
- Public observations and research records use separate namespaces and cannot
  be promoted into production evidence without explicit classification,
  provenance, and promotion evidence.

## Lifecycle

The allowed lifecycle progression is `draft -> active -> superseded -> retired`
with a separate `revoked` state where the entity may no longer be trusted.
Historical revisions remain readable for verification. A revocation may deny a
current or historical artifact for a declared trust profile, but it does not
erase the original record.
