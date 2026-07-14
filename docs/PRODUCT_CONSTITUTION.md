# Fenrua Product Constitution

Status: R1 specification baseline, not a product release
Owner: Product and Domain (A2), integrated by A0
Last reviewed: 2026-07-14

## Purpose

Fenrua is being specified as evidence-first decision-control infrastructure
for autonomous AI systems. Its narrow product purpose is to evaluate whether a
proposed action is authorised and trustworthy before execution, fail closed
when required evidence is absent or invalid, and produce a record that an
independent verifier can inspect.

The proposed working category statement is **Fenrua Protocol is evidence-first
decision-control infrastructure for autonomous AI systems.** It remains a
product-positioning proposal pending owner approval. It is not a claim that a
hosted service, enterprise deployment, or general-availability product exists.

The product sentence is:

> Evaluate. Decide. Record. Verify.

## Users And Supported Uses

The initial users are application developers, AI/agent platform teams, security
engineers, and independent reviewers. The initial supported workflow is a local
pre-execution decision for a bounded AI tool call or workflow action:

1. evaluate identity, authority, integrity, policy, freshness, revocation, and
   any required approval;
2. decide `ALLOW` or fail-closed `DENY`;
3. record exact digests, policy revision, decision, reason codes, and
   limitations; and
4. verify the resulting evidence independently.

The Local Trust Gate is currently planned. This constitution does not expose an
installation command, API, SDK, hosted interface, or release artifact for it.

## Excluded Uses

Fenrua is not an AI model, agent framework, generic orchestrator, public
blockchain RPC, wallet, exchange, swap, investment product, compliance
certificate, or universal proof that an AI system is safe. It does not replace
application security, human governance, or independent cryptographic review.

The initial Trust Gate does not execute the approved action. It returns a
decision and evidence; the caller remains responsible for execution and for
enforcing a `DENY` result.

## Local-First Guarantee

The local decision data plane must run at a customer-controlled edge with no
network requirement, no public-chain requirement, no Fenrua-hosted dependency,
no hidden telemetry, no dynamic code execution, and deterministic output for
identical inputs and versioned configuration. Its default is deny when a
required dependency, schema, signature, freshness proof, revocation state, or
approval is absent or invalid.

## Hosted-Service And Evidence Boundaries

Future control-plane services may distribute signed policies, revocation sets,
compatibility metadata, and evidence-management configuration. They must not
silently change a local decision, distribute unsigned policy, or turn an
unavailable network dependency into an implicit allow condition.

Evidence is a product primitive. An evidence bundle records only its declared
scope, inputs, verification profile, decision, and limitations. It is not a
certificate, attestation of unrelated runtime state, or assurance of future
behaviour. Public evidence remains distinct from private customer evidence.

## Privacy And Security Posture

The product minimises decision inputs, classifies evidence before storage,
uses bounded retention, and never places private keys, customer payloads, or
secrets in source, logs, public artifacts, or test fixtures. Production
profiles use established, reviewed cryptographic algorithms through versioned
and domain-separated signature profiles. P/N521 remains research and is not a
production authorisation profile.

## Maturity, Change, And Emergency Process

Maturity is governed by R0-R7 in `PROMOTION_GATES.md`. A `PASS` verification
is not an authorisation decision, and an implementation is not publicly
available until its interface, release artifact, evidence, and promotion gate
are all recorded.

Contract changes require versioning, compatibility review, tests, and an
evidence record. Deprecations require notice, migration guidance, a bounded
support window, and an explicit end-of-support state. Emergency containment may
revoke keys, policies, entities, or versions only through authenticated,
audited, monotonic controls; it must never silently weaken a deny decision.

## Research-To-Production Separation

`fenrua-kernel` remains the public research-grade P/N521 and reproducibility
repository. `fenrua-web` remains a public product, evidence, and documentation
surface. The future Trust Gate implementation, its release artifacts, and its
production cryptographic profiles belong in an owner-approved product boundary
described by `adr/ADR-0001-TRUST-GATE-REPOSITORY-BOUNDARY.md`.
