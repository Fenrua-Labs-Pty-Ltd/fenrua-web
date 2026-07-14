# Fenrua Promotion Gates

Status: Governance contract baseline v0.1
Owner: A0 with owner approval at promotion boundaries
Last reviewed: 2026-07-14

## Maturity Model

| Level | Meaning | Public presentation |
| --- | --- | --- |
| R0 | Research | Research only; not a product availability statement. |
| R1 | Specification | Documents and contracts, no release interface. |
| R2 | Prototype | Internal or unpromoted implementation; no public availability. |
| R3 | Reference implementation | Source and repeatable tests, not a preview until R4 evidence exists. |
| R4 | Limited preview | Signed, bounded release with stated limitations and controlled access. |
| R5 | Production candidate | Owner-approved candidate with review, recovery, and integration evidence. |
| R6 | Generally available | Supported public offering with operational, legal, and compatibility evidence. |
| R7 | Industrial assured | Sustained operations and independent assurance, not a self-awarded label. |

No capability may skip directly from R2 to R6. The Local Trust Gate remains
planned until its public release gate is satisfied and the capability register
is updated with the corresponding interface, evidence, limitations, and claim.

## Required Gates

### R3 to R4 Limited Preview

Requires public source, CLI, stable v1 schemas, signed release, SBOM,
provenance, threat model, negative corpus, benchmark, limitations, and clean
reproduction.

### R4 to R5 Production Candidate

Requires independent review, fuzzing, cross-platform tests, one real
integration, recovery plan, vulnerability process, signed artifacts, and owner
approval.

### R5 to R6 Generally Available

Requires support operations, compatibility commitment, security review,
measured reliability where hosted, release and rollback history, incident
readiness, enterprise data boundary, approved legal documents, and a public
promotion decision.

### R6 to R7 Industrial Assured

Requires sustained operational evidence, independent assurance, restore and
key-rotation history, incident learning, capacity and tenant-isolation evidence,
customer outcome evidence where disclosure is approved, governance evidence,
and a formal promotion decision.

## Promotion Record

Every promotion record identifies the capability, prior and target maturity,
source commit, artifact digest, evidence IDs, tested platforms, limitations,
rollback point, unresolved risks, approving owner, and date. A missing element
blocks promotion; a release may remain source-complete without being publicly
promoted.
