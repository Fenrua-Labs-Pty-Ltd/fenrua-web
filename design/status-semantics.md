# Fenrua Status Semantics

Status: Active public-interface contract v0.1
Owner: Operations and Public Platform
Last reviewed: 2026-07-14

| State | Token | Required text | Meaning |
| --- | --- | --- | --- |
| Verified current success | `signal-pass` | `verified`, `current`, or a scoped equivalent | Only after the applicable signed or source-bound check succeeds. |
| Informational or awaiting | `signal-info` | `awaiting`, `checking`, or `reference` | Does not assert availability or success. |
| Warning or delayed | `signal-warn` | `delayed`, `stale`, or `limited` | A scoped concern requiring reader attention. |
| Failure or revoked | `signal-fail` | `unavailable`, `failed`, or `revoked` | Failure, destructive condition, or security incident only. |
| Paused | `signal-paused` | `paused` or `maintenance` | Intentional inactivity or maintenance state. |
| Unknown | `text-muted` | `not asserted`, `not available`, or `not defined` | Neutral state; never green. |

Colour is never the only status signal. A status includes text and a visible
shape or icon, and animation is not used to imply liveness. Public chain
observation colour may change only after the existing signature and freshness
checks have produced the corresponding state.
