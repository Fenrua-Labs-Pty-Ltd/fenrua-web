# Fenrua API Error Contract

Status: Frozen bootstrap contract; no hosted API is available
Owner: A4 with A5/A10 review
Last reviewed: 2026-07-14

## Envelope

Future hosted APIs use `application/problem+json` and a stable envelope:

```json
{
  "type": "https://fenrua.ai/problems/policy-revoked",
  "title": "Policy revoked",
  "status": 409,
  "code": "POLICY_REVOKED",
  "detail": "The requested policy revision is revoked.",
  "correlationId": "01H...",
  "retryable": false,
  "limitations": []
}
```

`type`, `title`, `status`, `code`, `detail`, `correlationId`, `retryable`, and
`limitations` are required. `code` is stable, uppercase snake case, and mapped
to the versioned API contract. `type` is a stable Fenrua problem URI, not a
provider URL. `correlationId` is opaque and cannot encode a tenant, user,
provider, key, filesystem path, or secret.

## Safety Rules

- No stack trace, SQL, filesystem path, private topology, key material, raw
  token, secret, or unescaped input is returned.
- A response cannot reveal whether another tenant, entity, policy, evidence
  bundle, or key exists. Use the same public outcome for inaccessible and
  unknown scoped resources where required by the threat model.
- `detail` is safe for a human operator and `type`/`code` are safe for a
  machine; neither is a policy-evaluation escape hatch.
- Retryability is explicit. Retrying cannot turn a denied action into an allow
  without a changed, valid input or state.
- The local CLI maps errors to structured output and a non-zero exit code; it
  does not expose internal parser/library details by default.

## Initial Codes

```text
INVALID_REQUEST
UNSUPPORTED_SCHEMA
POLICY_INVALID
POLICY_REVOKED
REVOCATION_STALE
SIGNATURE_INVALID
REPLAY_DETECTED
TENANT_SCOPE_DENIED
RATE_LIMITED
DEPENDENCY_UNAVAILABLE
INTERNAL_ERROR
```

No hosted endpoint may be made public until this contract has authz, tenant
leakage, input-reflection, abuse, retryability, and observability tests.
