# External audit-artifact policy

Status: active repository boundary
Effective: 2026-07-13

Audit reports, security-review reports, test-output reports, visual captures,
assessment matrices, builder handoffs, scan exports, and working review notes
must be created and retained outside this source repository. They must not be
committed, staged into the public output, listed as public website documents, or
included in a release manifest.

This repository may contain source code, tests, specifications, policies,
sanitized machine-readable inputs, release manifests generated from the exact
release checkout, and narrowly scoped public evidence records. Calling a route
`/audit` or running a verification command does not create an exception for a
report file.

If a report later requires public publication, it must be reviewed, sanitized,
and released through a separately governed evidence location. The website may
then reference its immutable public URL and SHA-256, but the report itself must
remain outside this repository.

The repository validation suite enforces the prohibited report-filename and
output-directory boundary. There are no implicit exceptions.

A visual-capture run proves only that the external capture path executed. A
production visual-regression comparison additionally requires an approved
external baseline created for the pinned rendering environment. Captures,
baselines, diffs, browser traces, and comparison receipts remain external to
this repository.
