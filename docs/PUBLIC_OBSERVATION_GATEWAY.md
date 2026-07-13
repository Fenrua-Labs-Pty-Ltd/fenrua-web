# Public Observation Gateway over Encrypted Private-Mesh Transport

## Purpose

The public site exposes narrow evidence products for Chain 978 and Chain N521.
They are not public RPC services and have no route into the private mesh.

```
validator + private observers
        -> private quorum watcher
        -> signed canonical observation
        -> one-way private publication
        -> bounded public observation gateway
        -> /api/chain-progress
        -> fenrua.ai status component
```

The publication path is one-way: the website can ask the public gateway for a
fixed record, but cannot use it to reach a node, peer, validator, or
administrative interface.

## Public record

`/api/chain-progress` may include one independently verified entry per chain in
`observations`, with only these fields:

```json
{
  "version": 1,
  "chain": "978",
  "observed_block": 184201,
  "observed_at": "2026-07-13T08:10:00Z",
  "sequence": 1842,
  "source_quorum": 2,
  "status": "confirmed",
  "staleness_seconds": 12,
  "signature": "…",
  "key_id": "fenchain-978-observation-v1"
}
```

`staleness_seconds` is serving-time metadata and is not part of the signed
payload. The detached Ed25519 signature covers the version, chain, block,
observation time, signed sequence, quorum, status, and key ID using the
canonicalization stated by the fixed per-chain metadata endpoint. Those
endpoints expose only the public key, key ID, algorithm, version, and
canonicalization rule.

`public_key_b64` is canonical Ed25519 SPKI DER encoded as unpadded base64url.
The server configuration may supply the equivalent raw 32-byte public key or
SPKI DER, but the public endpoint always normalizes it to that one form.

No internal RPC URL, Blockscout URL, peer address, validator identity, private
IP, mesh topology, authentication value, administrative method, generic RPC
forwarding, or operator/customer metadata is returned.

## Failure semantics

- Two agreeing sources and a fresh signed record produce `confirmed` / `Live`.
- Quorum loss produces `partial`; the UI does not show an unconfirmed block as
  a live head.
- A confirmed record older than 90 seconds is shown as `Stale`. The ceiling
  allows for the 15-second private watcher/publisher cadence, a 20-second
  browser refresh, and the bounded cache; it is not a claim of immediate
  finality.
- No current observation produces `unavailable`, never a false success.
- A chain with no configured independent publisher is `Awaiting signed
  observation`; no block, sequence, or live state is fabricated.

## Controls

- Only `GET` without query parameters or a request body is accepted.
- The upstream gateway response is capped at 2 KiB and validated against the
  fixed schema before it reaches the browser. Confirmed, partial, and signed
  unavailable records must also pass Ed25519 verification against the configured public key;
  otherwise the adapter fails closed to `unavailable`.
- The public status endpoint uses a 5-second CDN cache with no stale-on-error
  serving. The browser refreshes every 20 seconds while the private signed
  publisher continues every 15 seconds.
- A salted, in-memory, best-effort limit of 60 requests per minute per client
  is applied per warm serverless isolate. It does not replace edge-level DDoS
  protection.
- The public-key endpoint has the same request restrictions and a 5-minute
  cache because public-key rotation is an explicit deployment event.
- Error responses are generic and do not contain upstream or network details.

## Server configuration

Set these as server-only production variables. Never expose them in browser
code, logs, source commits, or `NEXT_PUBLIC_*` variables.

| Variable | Purpose |
| --- | --- |
| `FENRUA_OBSERVATION_GATEWAY_URL` | Chain 978 fixed HTTPS public-observation gateway route. |
| `FENRUA_OBSERVATION_READ_TOKEN` | Chain 978 Vercel-to-gateway read credential. |
| `FENRUA_OBSERVATION_PUBLIC_KEY_B64` | Chain 978 public Ed25519 verification key. |
| `FENRUA_OBSERVATION_KEY_ID` | Chain 978 identifier bound into each signed record. |
| `FENRUA_N521_OBSERVATION_GATEWAY_URL` | Chain N521 fixed HTTPS public-observation gateway route. |
| `FENRUA_N521_OBSERVATION_READ_TOKEN` | Chain N521 Vercel-to-gateway read credential. |
| `FENRUA_N521_OBSERVATION_PUBLIC_KEY_B64` | Chain N521 public Ed25519 verification key. |
| `FENRUA_N521_OBSERVATION_KEY_ID` | Chain N521 identifier bound into each signed record. |

The public keys and key IDs are intentionally publishable through
`/api/chain-observation-key` (978) and `/api/chain-n521-observation-key`
(N521). Gateway URLs and read tokens are not.
