# Legacy Verifier Corpus Disposition

Status: Quarantined explanatory corpus; not a Trust Gate schema or product output
Owner: A3 and A4
Last reviewed: 2026-07-14

## Scope

`examples/verification-results/` is a historical public scenario corpus. It
records the conditions and evidence boundaries used by the existing website
verification reference. It is not a released `fenrua-trust-gate` interface,
strict schema, CLI input, verifier output, authorisation decision, or execution
instruction.

The corpus uses `fenrua.legacy-verification-scenario.v1` solely as a local
corpus label. That label is not a released Trust Gate schema and must not be
accepted by a future Trust Gate parser.

## Quarantine Rules

Each legacy scenario may state its expected verification result, supplied and
absent evidence, safety context, and whether a human review is expected. It
must not contain `continueExecution`, an `ALLOW` or `DENY` decision, or language
that directs a caller to execute, pause, or enforce an action.

The reserved `fenrua.verification-result.v1` identifier remains limited to a
future independently produced verifier result. A `PASS` result never implies
authorisation. Only a separately produced `fenrua.decision.v1` can express
`ALLOW` or `DENY`; the caller remains responsible for its own execution
choice.

## Migration Boundary

The owner-approved future specifications repository will define and validate
strict `fenrua.verification-vector.v1` records. It will map these historical
scenarios only after it can prove field-by-field compatibility, strict unknown
field rejection, and separation from `fenrua.verification-result.v1` and
`fenrua.decision.v1`.

Until that repository and release gate exist, this website publishes the corpus
only as quarantined explanatory evidence. No Trust Gate capability, CLI, SDK,
API, hosted verifier, or execution workflow is available from this record.
