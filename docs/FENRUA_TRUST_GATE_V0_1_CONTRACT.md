# Fenrua Local Trust Gate v0.1 Bootstrap Contract

Status: Frozen bootstrap contract; not a schema release or product availability claim
Owner: A3 with A4, A6, A7, and A12 review
Last reviewed: 2026-07-14

## Contract Boundary

This document is the migration contract for an owner-approved future
`fenrua-trust-gate` and `fenrua-specs` boundary. It is not a released
normative schema set. Existing public foundation documents remain historical
and explanatory; their permissive unknown-field language is not inherited by
the Trust Gate. v0.1 is strict: unknown fields in strict schema objects,
unsupported schema/profile versions, duplicate JSON keys, and parse ambiguity
are rejected before policy evaluation.

The existing public verification corpus is not a Trust Gate output contract: it
uses scenario metadata and `continueExecution` expectations. Its records must
migrate to `fenrua.verification-vector.v1`. The reserved
`fenrua.verification-result.v1` identifier is for an independently produced
verification result only. A verification `PASS` never contains or implies an
authorisation decision; vectors may declare an `expectedDecision` as test
metadata, but an evaluator alone produces `fenrua.decision.v1` with `ALLOW` or
`DENY`.

## Exact CLI Surface

```text
fenrua version [--json]
fenrua schema list [--json]
fenrua manifest validate <file> [--json]
fenrua policy validate <file> [--json]
fenrua request validate <file> [--json]
fenrua revocations validate <file> [--json]
fenrua gate evaluate --manifest <file> --policy <file> --request <file> --revocations <file> --at <RFC3339-UTC> --output <receipt> --evidence-output <bundle>
fenrua evidence verify <bundle> [--at <RFC3339-UTC>] [--json]
fenrua receipt inspect <receipt> [--json]
fenrua doctor [--json]
```

All file arguments name local, regular files. URL loading, `file://` input,
directory traversal, shell evaluation, environment interpolation, remote schema
fetches, and dynamically loaded policy code are prohibited in v0.1.

`--at` makes the core reproducible. Production wrappers may obtain time only
through an approved profile; wall-clock time, locale, random UUIDs, filesystem
paths, and unordered-map iteration cannot influence a core decision or evidence
artifact. `--output` names the receipt and `--evidence-output` is mandatory.
Outputs are written atomically only after independent evidence verification. An
authorisation denial emits a deterministic `DENY` artifact and exit code `2`;
invalid input and operational faults emit a problem envelope and leave no
partial output.

## Input And Identifier Rules

The v0.1 input family is:

```text
fenrua.entity-manifest.v1
fenrua.authority-policy.v1
fenrua.tool-call-request.v1
fenrua.approval.v1
fenrua.revocation-set.v1
fenrua.decision.v1
fenrua.evidence-bundle.v1
fenrua.receipt.v1
fenrua.verification-result.v1
fenrua.key-metadata.v1
fenrua.key-rotation.v1
fenrua.audit-event.v1
fenrua.compatibility-profile.v1
fenrua.verification-vector.v1
```

Every released schema has an exact `$id`, schema version, bounded string and
array fields, strict object fields where applicable, UTC timestamps with
declared precision, explicit hash algorithm, and explicit signature profile.
Identifiers use a canonical `urn:fenrua:<kind>:<lowercase-token>` form within
the future schema release. A caller cannot supply a tenant scope that overrides
the trusted profile/environment scope.

The future schemas share strict definitions for `Scope`, `Revision`,
`ArtifactRef`, `PolicyRef`, `Digest`, `Signature`, `VerifierRef`, `Lifecycle`,
`Revocation`, timestamps, findings, and limitations. Each reference binds tenant
and environment scope, exact revision, effective time where relevant, and
evidence. Cross-document artifact, scope, revision, profile, expiry, digest, or
signature mismatch fails closed.

## Evaluation Contract

For exact input bytes, profile, and permitted time source, the evaluator must
perform this sequence without network access:

1. enforce file and structural size/depth limits;
2. strict-parse and reject duplicate keys;
3. validate declared schema and compatibility profile;
4. canonicalise using the declared profile;
5. verify exact payload digests and signatures;
6. resolve subject, issuer, audience, context, and environment;
7. validate time/freshness and replay requirements;
8. validate current revocation state before policy allow rules;
9. select one unambiguous applicable policy revision;
10. resolve bound approvals;
11. apply deny rules, then allow rules, then deny-overrides;
12. emit deterministic `ALLOW` or `DENY`, ordered reason codes, limitations,
    evidence bundle, and receipt; and
13. independently verify the produced bundle before success is reported.

No match, ambiguity, unknown requirement, unavailable required replay state,
invalid signature, stale revocation set, incompatible environment, expired
input, or failed verification is `DENY`.

## Policy v1

Policy is constrained declarative data, never a scripting language. A rule may
select subject and actor, action, resource, environment, scope, time window,
expiry, integrity digests, required evidence, required approval, allow/deny
effect, obligations, reason code, revision, issuer, signature, and
supersession. Deny overrides allow; duplicate rule IDs, cycles,
non-deterministic functions, external lookups, and unknown fields are invalid.

## Request, Replay, And Revocation

A replay-sensitive request binds a request ID, nonce, audience, context,
issued-at, expiry, and sequence/challenge. The caller supplies a bounded replay
checkpoint or cache policy. If replay prevention is mandatory and the state is
unavailable, the result is `DENY_REPLAY` or `DENY_FAIL_CLOSED`.

Revocation sets are signed, monotonically sequenced, scoped, issued/expiry
bounded, and include policy, subject, artifact, and key revocation. A rollback
to an older revocation sequence is rejected.

## Decision And Evidence Output

Every decision uses `fenrua.decision.v1` and includes at least:

```text
decisionId, decision, verificationState, reasonCodes, subjectId, actorId,
action, resource, policyId, policyRevision, requestDigest, evidenceBundleId,
issuedAt, expiresAt, limitations
```

The evidence bundle follows the task's v1 top-level fields: schemaVersion,
bundleId, tenantScope, environment, subject, actor, request, policy, decision,
approvals, integrity, revocation, runtime, inputs, outputs, events,
limitations, createdAt, expiresAt, producer, producerVersion, signatureProfile,
keyId, signature, and supersedes. It never contains a private key, raw secret,
or another tenant's data.

The result-code set is defined in `DECISION_SEMANTICS.md`; additions require a
new compatible contract revision and vectors. The stable service/API error
envelope is defined in `API_ERROR_CONTRACT.md`.

`EvaluationRequest` is the evaluator input and contains the request, trusted
scope/profile, explicit evaluation time, manifest, policy, approval references,
and revocation snapshot. `Decision` and `EvidenceBundle` are evaluator outputs.
`VerificationResult` is an independently generated verifier output. The three
roles cannot be substituted for one another.

Replay storage is an injected atomic interface keyed by tenant, audience,
context, nonce/request ID, and request digest. It returns only an
existing-idempotent result, replay, or unavailable state. The evaluator does
not include a database/network client; a mandatory replay requirement with an
unavailable checkpoint is denied.

## Signing Profiles

`local-unsigned-development`, `ed25519-v1`, `p256-v1`, and
`enterprise-provider-v1` are the only initial profile names. Unknown profiles
are rejected. Profile selection binds algorithm, canonicalisation, audience,
context, payload digest, key ID, and expiry, and cannot silently downgrade a
signature-required policy.
