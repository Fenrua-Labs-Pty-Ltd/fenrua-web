# Fenrua Verify Result Corpus

Status: quarantined legacy explanatory corpus; not a Trust Gate output contract

The verify corpus lives in `examples/verification-results/` and is linked from
`/verify/` as a historical scenario reference. It uses the local
`fenrua.legacy-verification-scenario.v1` corpus label, not the reserved
`fenrua.verification-result.v1` identifier.

It does not define a strict schema, CLI input, verifier output, authorisation
decision, or execution instruction. A `PASS` scenario records verification
evidence only. `continueExecution` is prohibited. The full quarantine and
migration boundary is in `LEGACY_VERIFIER_CORPUS_DISPOSITION.md`.

Required results:

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

Each fixture identifies input fixture, trigger, supplied evidence, absent
evidence, safety context, and human-review expectation. The review expectation
is scenario metadata, not a Trust Gate output. `scripts/test-verify-examples.mjs`
enforces corpus completeness and quarantine rules.
