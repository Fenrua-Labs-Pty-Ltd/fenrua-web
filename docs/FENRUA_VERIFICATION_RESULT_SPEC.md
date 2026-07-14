# Fenrua Verification Result Spec

Status: historical schema foundation; not a strict Trust Gate v0.1 release
Last reviewed: 2026-07-12

## Boundary

This document describes a historical explanatory verifier-result shape. It does
not release a strict Trust Gate schema, CLI, SDK, API, or hosted verifier. The
reserved `fenrua.verification-result.v1` identifier is for a future
independently produced verifier output only.

That output must not contain scenario fields such as `inputFixture`, `trigger`,
`evidenceSupplied`, `evidenceAbsent`, `safetyConsequence`,
`continueExecution`, or `humanReviewRequired`. Those historical fields are
quarantined in `LEGACY_VERIFIER_CORPUS_DISPOSITION.md` and are not part of an
authorisation contract. A `PASS` result never implies `ALLOW` or execution.

## Deterministic Result Codes

- `PASS`
- `PASS_WITH_LIMITATIONS`
- `INCOMPLETE`
- `STALE`
- `POLICY_VIOLATION`
- `INTEGRITY_MISMATCH`
- `SIGNATURE_INVALID`
- `RUNTIME_UNVERIFIED`
- `REVOKED`
- `FAIL_CLOSED`
- `UNSUPPORTED_SCHEMA`
- `ERROR`

## Required Shape

```json
{
  "schema": "fenrua.verification-result.v1",
  "result": "PASS_WITH_LIMITATIONS",
  "manifestSchema": "valid",
  "identity": "verified",
  "signatures": "verified",
  "artifactIntegrity": "verified",
  "policyIntegrity": "verified",
  "evidenceCompleteness": "partial",
  "runtimeConformity": "unverified",
  "revocationStatus": "active",
  "findings": {
    "critical": 0,
    "high": 0,
    "medium": 1,
    "low": 0
  },
  "limitations": [
    "Production runtime attestation was not supplied"
  ]
}
```

## Verification Rule

No verifier result may claim more than the supplied artifacts prove.
