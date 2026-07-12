# Fenrua Telemetry State Implementation

Status: implemented with declared limitation

## State Model

`api/chain-progress.js` exposes sanitized read-only observations for Chain 978 and Chain N521. Browser UI maps upstream data into terminal public states:

- `Live` when the configured evidence source confirms the expected chain ID and a fresh observed block.
- `Stale` when the observed head exceeds the freshness policy.
- `Failure` for chain ID mismatch.
- `Unavailable` when no valid observation exists.

## Source Boundary

No RPC endpoint, credential, private host, latency detail, or probe identifier is exposed. The implementation does not present a missing third-party source as an integrity failure; confidence is scoped to the declared evidence source and the read-only observation boundary.

## Non-Claims

Chain height does not prove contract safety, bytecode identity, reserve state, deployment correctness, or wallet safety.
