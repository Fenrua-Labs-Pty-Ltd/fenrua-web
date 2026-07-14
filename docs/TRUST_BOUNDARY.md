# Fenrua Trust Boundary

Status: Architecture contract baseline v0.1
Owner: Architecture (A0) with Core Trust Gate (A3)
Last reviewed: 2026-07-14

## Planes

```text
Developer plane -> local decision data plane -> caller-controlled execution
                                  |
                                  +-> optional evidence export
                                  +-> optional signed control-plane sync

Control plane, evidence plane, management plane, and public observation remain
separate from the local decision data plane and from each other by interface,
identity, data classification, and failure mode.
```

## Local Decision Data Plane

The local plane accepts only explicitly supplied manifest, policy, request,
approval, revocation, and profile material. It verifies and evaluates offline,
uses bounded CPU/memory/input size, produces deterministic results, and sends
no hidden telemetry. Its output is a decision and evidence bundle, not an
execution side effect.

An absent optional control-plane or evidence-plane connection cannot change a
local decision. An absent mandatory policy, revocation state, signing profile,
approval, or freshness proof causes a fail-closed `DENY`.

## Control Plane

The future control plane may publish signed immutable policy and revocation
revisions, tenant/environment metadata, compatibility metadata, and evidence
intake configuration. It cannot silently alter a local evaluation, permit an
unsigned policy, cross a tenant boundary, or report unmeasured propagation as
successful revocation.

## Evidence Plane

The evidence plane verifies independently, preserves original payload digests,
distinguishes private and public evidence, and records verifier version and
method. Storage is not evidence correctness. Redaction may conceal private
facts but must retain enough provenance to state exactly what cannot be
recomputed.

## Management And Observation

The management plane owns deployment, incident, backup, restore, key lifecycle,
and release records. Public observation is optional, read-only, and never a
mandatory authorisation input. Chain observations remain independently bounded
and cannot define product availability or grant an allow decision.

## Explicit Non-Trusts

- The browser, public site, and public release manifest are not a control plane.
- A policy issuer is not automatically a workload identity.
- A request-supplied tenant ID is not trusted tenant context.
- A valid signature does not override expiry, revocation, audience, context,
  policy, approval, or integrity requirements.
- Research cryptography and P/N521 material are not production signing profiles.
- A receipt never exposes private keys, secrets, raw protected payloads, or
  another tenant's data.
