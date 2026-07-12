# Fenrua Kernel Security Audit Log

This audit log is the first public evidence link for `fenrua-web`. Replace
placeholder rows with authoritative `fenrua-kernel` records as the kernel moves.

## Current Portal State

- Version tag: `v.390f7ae`
- Audit resolution: `7/7 Findings Resolved`
- Genesis integrity: `14/14 Genesis Files Verified`
- CI output: `Hardening: PASS`
- Regression coverage: `Active`

## Linked Evidence

| Artifact | Hash Reference | Source/Commit |
| --- | --- | --- |
| Bedrock Source | `85ecc97c...` | `fenrua-kernel` bedrock source commit |
| Evidence Commit | `dc36d1f2...` | `fenrua-kernel` evidence commit |
| Genesis Manifest | `bd9ec111...` | `docs/GENESIS_MANIFEST.md` |
| Audit Report | `9d9eeffc...` | `docs/audit-report.json` |

## Day Zero Artifacts

Every release must include:

- Genesis receipts: SHA-256 mapped proofs for every critical arithmetic circuit.
- Regression history: explicit counterexamples, including records such as
  `regression_001_p521_sub_overflow.bin`.
- Audit log entries: every assurance finding tracked from discovery to
  resolution.

## Integrity Boundary

Research-grade. No production certification. Audit history is public and
immutable.

Do not claim "Certified" or "Formally Verified" until the math is complete and
external audits are signed.
