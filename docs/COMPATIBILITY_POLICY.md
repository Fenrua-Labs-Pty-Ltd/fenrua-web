# Fenrua Compatibility Policy

Status: Contract baseline v0.1; no public support commitment yet
Owner: Schemas and SDK (A4)
Last reviewed: 2026-07-14

## Version Domains

Fenrua versions the following domains independently:

```text
schema, policy language, CLI, core library, SDK, API, trust profile,
signature profile, evidence bundle, compatibility profile
```

Each released artifact declares the exact versions it accepts and produces.
Version interpretation is local and explicit; a future schema, unknown profile,
or undeclared extension is rejected rather than guessed or partially parsed.

## Versioning Rules

- Libraries, CLI, and SDK use semantic versioning.
- Released JSON schemas are immutable and have a unique `$id` and exact version.
- A breaking schema, result-code, canonicalisation, or signature-profile change
  uses a new schema/profile version.
- Policy evaluation defaults are never changed in place.
- Generated clients derive only from frozen contracts and must be reproducible;
  generated output is never hand-edited.
- A compatibility profile names an allowed tuple of schema, policy, evidence,
  CLI, SDK, and profile versions.

## Support And Deprecation

Before the first limited-preview release, there is no public support-window
promise. Each R4-or-later release must publish its supported versions, support
start, end-of-support date, migration path, and any compatibility exceptions.

Normal deprecation requires a successor version, migration tooling or guidance,
an announced window, and a final end-of-support record. Emergency deprecation
may shorten a window only for a documented security or integrity reason,
accompanied by an explicit deny or revocation path and a compatibility notice.

Downgrade is forbidden by default. A caller may select an older compatible
profile only when it is explicitly configured, not revoked, and does not weaken
the required policy, signature, freshness, or evidence guarantees.

## Compatibility Decision

The evaluator checks compatibility before policy evaluation. A request that
names an unsupported schema, profile, or version returns a structured
`DENY_UNSUPPORTED_SCHEMA` or `DENY_FAIL_CLOSED` result. Compatibility metadata
is evidence material and is included in the decision/evidence bundle.
