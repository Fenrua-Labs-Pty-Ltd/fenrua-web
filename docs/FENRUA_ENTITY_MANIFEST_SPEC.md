# Fenrua Entity Manifest Spec

Status: historical schema foundation; not a strict Trust Gate v0.1 release
Last reviewed: 2026-07-12

## Boundary

This is an explanatory historical manifest shape, not a released strict Trust
Gate schema or an authorisation input. The future v0.1 schema boundary is
defined by `FENRUA_TRUST_GATE_V0_1_CONTRACT.md` and rejects unknown fields in
strict schema objects. No current website component accepts this document for a
Trust Gate decision.

## Required Shape

```json
{
  "schema": "fenrua.entity-manifest.v1",
  "entity": {
    "id": "fenrua-entity:<stable-id>",
    "type": "agent|model|tool|workflow|operator|organization|deployment",
    "name": "<public-name>",
    "owner": "<operator-or-organization-id>"
  },
  "artifact": {
    "sourceRevision": "<git-sha-or-null>",
    "buildDigest": "<digest-or-null>",
    "dependencyLockDigest": "<digest-or-null>",
    "containerDigest": "<digest-or-null>"
  },
  "model": {
    "provider": "<provider-or-null>",
    "modelId": "<model-id-or-null>",
    "policyRevision": "<revision-or-null>"
  },
  "tools": [],
  "authorityPolicy": "<policy-id>",
  "evidenceBundles": [],
  "runtime": {
    "environment": "<environment-label>",
    "attestation": "<attestation-id-or-null>"
  },
  "revocation": {
    "state": "active|revoked|quarantined|superseded",
    "reason": null
  }
}
```

## Required Behavior

- Historical readers may retain unknown fields but must not use them for
  authorisation. A future strict v0.1 parser rejects unknown fields.
- Missing required identity or authority fields must produce `INCOMPLETE`.
- Unsupported schema versions must produce `UNSUPPORTED_SCHEMA`.
- Revoked manifests must produce `REVOKED`.
