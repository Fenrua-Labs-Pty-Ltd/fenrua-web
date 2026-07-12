# Differential testing telemetry format

`kernel-status.js` contains a generated static snapshot with schema version
`fenrua.web.kernel-telemetry.v1`. It is generated only from allowlisted public
files in a checked-out `fenrua-kernel` commit.

## Provenance

The snapshot always distinguishes two revisions:

- `snapshotCommit`: the immutable kernel commit the sync action checked out.
- `frozenEvidenceRevision`: the source revision declared by the generated
  Genesis evidence report.

They are deliberately separate. A later repository commit must not be presented
as if it were the revision that produced the frozen evidence.

## Public fields

- Genesis suite ID, pass/fail state, and case totals.
- Differential campaign counts, deterministic seed, and sanitizer flags.
- Permanent regression ID, classification, domain, operation, and pass/fail
  state.
- Fixture filename, byte length, SHA-256, public encoding description, and a
  commit-pinned evidence URL.
- Regression report record/file SHA-256 values and a commit-pinned evidence URL.

## Exclusions

The generated surface must never include raw fixture bytes, operand limbs,
expected result limbs, witnesses, proving artifacts, private paths, secrets, or
ephemeral build paths. The website proves what it displays through hashes and
pinned public links; it does not replay or interpret binary evidence in the
browser.

## Sync contract

The synchronization action independently verifies canonical JSON record hashes,
cross-file SHA-256 and byte bindings, passing suite totals, immutable commit
identifiers, and the build-validation/review evidence revision before it writes
the generated section. Any mismatch fails the action without changing the
published snapshot.
