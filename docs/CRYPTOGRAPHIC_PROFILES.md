# Fenrua Cryptographic Profiles

Status: Contract baseline v0.1; no production profile released
Owner: Identity, Policy, and Keys (A6)
Last reviewed: 2026-07-14

## Scope

This document freezes profile names and security properties for the future Local
Trust Gate. It does not claim a released implementation, independent
cryptographic review, certificate, or production deployment.

Production-candidate profiles use established, reviewed platform cryptography.
Custom research primitives, including P/N521 research material, are excluded
from the authorisation hot path until separately reviewed and promoted.

## Profiles

| Profile | Intended use | Signature rule | Release state |
| --- | --- | --- | --- |
| `local-unsigned-development` | Isolated development fixtures only | Marks evidence unsigned-local; never satisfies a signature-required policy. | Contract only |
| `ed25519-v1` | Default portable local signing profile | Ed25519 over a profile-defined canonical byte sequence. | Contract only |
| `p256-v1` | Interoperability profile | ECDSA P-256 through a reviewed platform implementation and profile-defined encoding. | Contract only |
| `enterprise-provider-v1` | Explicitly integrated provider-backed keys | Provider-specific signing only after an authenticated profile and verifier are released. | Contract only |

## Common Requirements

- Every signature is domain-separated and binds profile, schema version,
  audience, context, exact payload digest, issuer, and expiry.
- Key IDs are stable, scoped by tenant/environment/purpose, and never reused
  for a retired key version.
- The verifier rejects unknown profiles and prohibited downgrade paths.
- Private key material never enters source, logs, artifacts, fixtures, browser
  payloads, or evidence bundles.
- Rotation is an authenticated record from an authorised prior/current key or
  approved emergency control. A retired or revoked key cannot be reused.
- The verification result records the exact profile and verifier version used.
- Canonicalisation is versioned per profile; textual re-serialisation cannot
  silently change the signed bytes.

## Profile Promotion

A profile is not production-candidate until it has a published specification,
test vectors, mutation tests, compatibility tests, key lifecycle controls,
independent review, and a release decision. Algorithm agility may add profiles;
it may not silently weaken an existing policy or verification result.
