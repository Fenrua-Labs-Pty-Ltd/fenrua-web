# Fenrua Telemetry State Implementation

Status: implemented with declared limitation

## State Model

`api/chain-progress.js` exposes a sanitized, signed read-only observation for
Chain 978. Chain N521 is intentionally represented as unavailable because its
telemetry is not published. Browser UI maps the bounded observation into
terminal public states:

- `Live` when a two-source signed observation is fresh.
- `Partial` when the private watcher has not reached quorum.
- `Stale` when a previously confirmed observation exceeds the freshness policy.
- `Unavailable` when no valid observation exists, or where telemetry is intentionally private.

## Source Boundary

The gateway name is **Public Observation Gateway over Encrypted Private-Mesh
Transport**. No RPC endpoint, credential, private host, peer, validator
identity, latency detail, or probe identifier is exposed. The public adapter
accepts only one fixed response schema, verifies its Ed25519 signature against
the configured public key, rejects oversized responses and query requests, and
cannot proxy generic JSON-RPC. A signed observation can also be checked
independently using `/api/chain-observation-key`.

## Non-Claims

Chain height does not prove contract safety, bytecode identity, reserve state, deployment correctness, or wallet safety.
