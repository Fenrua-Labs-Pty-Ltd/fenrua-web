# Fenrua Decision Semantics

Status: Contract baseline v0.1
Owner: Core Trust Gate (A3), reviewed by A7 and A12
Last reviewed: 2026-07-14

## Terms

| Term | Meaning | Does not imply |
| --- | --- | --- |
| Validation | Structural conformance to a declared schema and input limits. | Signature validity, currentness, or authorisation. |
| Verification | Recomputing and checking declared evidence, signatures, digests, context, freshness, and revocation. | An `ALLOW` decision. |
| Evaluation | Deterministic application of a versioned policy to verified inputs. | Execution of the proposed action. |
| Authorisation | The resulting decision that a defined subject may perform a defined action in scope. | That a caller will execute it safely. |
| Execution | The caller performing an action after it has received an `ALLOW`. | That Fenrua executed or observed it. |
| Observation | Read-only recording of a declared external state. | Authorisation or attestation. |
| Attestation | A scoped signed statement by an identified issuer. | Universal truth or policy applicability. |
| Evidence | Inputs, digests, decisions, signatures, and limitations retained for verification. | Certification. |
| Approval | Bound acknowledgement required by policy before an allow result. | A general delegation of authority. |
| Trust | The explicitly bounded conclusion supported by a declared profile and evidence. | Safety outside that scope. |

## Decision Invariants

1. A `PASS` verification result is not an `ALLOW` decision.
2. A signed request is not automatically authorised.
3. A syntactically valid policy is not automatically current or applicable.
4. A current policy is not automatically applicable to every subject, action,
   resource, audience, environment, or context.
5. A deny rule overrides an allow rule; no applicable allow rule is `DENY`.
6. Any ambiguity, unknown required field, failed bound, missing required
   evidence, unavailable mandatory state, or unsupported profile is `DENY`.

Verification vectors may state an expected outcome for a test harness, but they
do not carry an execution instruction. In particular, `continueExecution` is
not a Trust Gate output field. Only the evaluator's `fenrua.decision.v1`
`decision` field can be `ALLOW` or `DENY`, and the caller independently chooses
whether to enforce that result.

## Evaluation Order

The v0.1 evaluator processes exact bytes in this order: bounded parse; schema
validation; versioned canonicalisation; digest check; signature and issuer
verification; audience and context verification; time and freshness check;
revocation check; applicable-policy selection; approval resolution; deny rules;
allow rules; deny-overrides; deterministic decision; evidence construction;
independent evidence verification; receipt emission.

There is no network lookup or nondeterministic function in the v0.1 local path.

## Result Contract

The decision contract is `fenrua.decision.v1`. It contains a stable decision
identifier, `ALLOW` or `DENY`, verification state, ordered reason codes,
subject/actor/action/resource identity, policy and revision, request digest,
evidence bundle ID, issued and expiry time, and explicit limitations. Unknown
schema versions are rejected rather than partially interpreted.

The initial frozen reason-code set is:

```text
ALLOW_POLICY_MATCH
DENY_EXPLICIT
DENY_NO_MATCH
DENY_MISSING_IDENTITY
DENY_INVALID_IDENTITY
DENY_SIGNATURE_INVALID
DENY_POLICY_EXPIRED
DENY_POLICY_REVOKED
DENY_SUBJECT_REVOKED
DENY_ARTIFACT_REVOKED
DENY_KEY_REVOKED
DENY_STALE_REVOCATION_STATE
DENY_AUDIENCE_MISMATCH
DENY_CONTEXT_MISMATCH
DENY_INTEGRITY_MISMATCH
DENY_MISSING_APPROVAL
DENY_UNSUPPORTED_SCHEMA
DENY_AMBIGUOUS_POLICY
DENY_REPLAY
DENY_UNSUPPORTED_ENVIRONMENT
DENY_FAIL_CLOSED
```

New reason codes require a new contract revision, compatibility review, golden
vectors, and an ADR when they change a previously observable result.
