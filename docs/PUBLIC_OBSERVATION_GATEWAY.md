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

During an accepted key transition, the adapter may add unsigned serving
metadata named `key_rotation` containing only version, certificate SHA-256,
previous key ID, previous payload SHA-256, previous sequence, and new key ID.
That object is emitted only after the atomic checkpoint accepts the certificate
anchor; it is not part of the watcher-signed observation payload.

`staleness_seconds` and `key_rotation` are serving-time metadata and are not
part of the signed payload. The detached Ed25519 signature covers the version,
chain, block, observation time, signed sequence, quorum, status, and key ID using the
canonicalization stated by the fixed per-chain metadata endpoint. Those
endpoints expose only the public key, key ID, algorithm, version,
canonicalization rule, and—during a key transition—the signature-validated,
target-matched rotation certificate and its canonical SHA-256 digest. The key
metadata endpoint does not itself claim that the certificate's checkpoint
anchor has been accepted; only the progress adapter can make that atomic store
comparison.

`public_key_b64` is canonical Ed25519 SPKI DER encoded as unpadded base64url.
The server configuration may supply the equivalent raw 32-byte public key or
SPKI DER, but the public endpoint always normalizes it to that one form.

No internal RPC URL, Blockscout URL, peer address, validator identity, private
IP, mesh topology, authentication value, administrative method, generic RPC
forwarding, or operator/customer metadata is returned.

## Failure semantics

- Two agreeing sources and a fresh signed record produce `confirmed` / `Live`.
- Quorum loss produces `partial`; the UI does not show an unconfirmed block as
  a live head. A valid signed partial is presented as a yellow `Awaiting next
  observation` state. It may retain only a clearly labelled `Last verified`
  block from the same browser session; that value is never presented as the
  current head.
- A confirmed record older than 90 seconds is shown as `Stale`. The ceiling
  allows for the 15-second private watcher/publisher cadence and the bounded
  cache; the browser derives the live/stale state directly from the signed
  observation time, not from the cache age. It is not a claim of immediate
  finality.
- No current observation produces `unavailable`, never a false success.
- A chain with no configured independent publisher is `Awaiting signed
  observation`; no block, sequence, or live state is fabricated.

## Controls

- Only `GET` without query parameters or a request body is accepted.
- The upstream gateway response is capped at 2 KiB and validated against the
  fixed schema before it reaches the browser. Confirmed, partial, and signed
  unavailable records must also pass Ed25519 verification against the
  configured public key; otherwise the adapter fails closed to `unavailable`.
- After signature verification and before public mapping, one atomic Redis
  script compares and advances a durable per-chain checkpoint. It binds key
  fingerprint, sequence, observation time, highest confirmed block, and
  canonical signed-payload SHA-256. Rollback, same-sequence equivocation,
  unannounced key changes, and reuse of retired key material fail closed.
- A checkpoint has no TTL. Production requires a stable, environment-specific
  namespace and configured Upstash Redis REST store. A configured store outage,
  partial configuration, malformed response, or rejected atomic transition
  never degrades to stateless acceptance.
- The public status endpoint uses a 60-second CDN cache with no stale-on-error
  serving. The browser refreshes every 20 seconds while the private signed
  publisher continues every 15 seconds. An edge may replay one response for up
  to 60 seconds, but a cached record keeps its original signed `observed_at`;
  it never receives a synthetic current timestamp. The browser's 90-second
  live/stale decision is derived only from that signed timestamp.
- A salted, in-memory, best-effort limit of 60 requests per minute per client
  is applied per warm serverless isolate. It does not replace edge-level DDoS
  protection.
- The public-key endpoint has the same request restrictions and always requires
  browser and CDN revalidation. This prevents a previously cached key response
  from obscuring a newly configured transition.
- Error responses are generic and do not contain upstream or network details.

## Authenticated key rotation

A key transition reaches the progress response only when the configured
certificate:

- has the fixed version, purpose, chain, and field set;
- names the newly configured key ID and public key;
- is signed by the previous Ed25519 private key;
- binds the previous key ID, key fingerprint, sequence, and canonical payload
  digest to the exact durable checkpoint; and
- advances to key material that has never appeared in that chain's checkpoint
  history.

The certificate cannot bootstrap an empty checkpoint. The first checkpoint
must be a fresh, signed, quorum-confirmed observation. Retain a rotation
certificate until it is superseded so open browser sessions can consume the
server-validated `key_rotation` binding from the progress response. The browser
accepts a new key only when that binding names its previous key ID, a bridge
sequence at or above the session high-water, and an advancing new-key sequence.
This permits a backgrounded tab to miss intermediate old-key observations
without weakening rollback checks. Never publish a signing key.

## Server configuration

Set these as server-only production variables. Never expose them in browser
code, logs, source commits, or `NEXT_PUBLIC_*` variables.

| Variable | Purpose |
| --- | --- |
| `FENRUA_OBSERVATION_GATEWAY_URL` | Chain 978 fixed HTTPS public-observation gateway route. |
| `FENRUA_OBSERVATION_READ_TOKEN` | Chain 978 Vercel-to-gateway read credential. |
| `FENRUA_OBSERVATION_PUBLIC_KEY_B64` | Chain 978 public Ed25519 verification key. |
| `FENRUA_OBSERVATION_KEY_ID` | Chain 978 identifier bound into each signed record. |
| `FENRUA_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64` | Optional old-key-signed Chain 978 rotation certificate. |
| `FENRUA_N521_OBSERVATION_GATEWAY_URL` | Chain N521 fixed HTTPS public-observation gateway route. |
| `FENRUA_N521_OBSERVATION_READ_TOKEN` | Chain N521 Vercel-to-gateway read credential. |
| `FENRUA_N521_OBSERVATION_PUBLIC_KEY_B64` | Chain N521 public Ed25519 verification key. |
| `FENRUA_N521_OBSERVATION_KEY_ID` | Chain N521 identifier bound into each signed record. |
| `FENRUA_N521_OBSERVATION_KEY_ROTATION_CERTIFICATE_B64` | Optional old-key-signed Chain N521 rotation certificate. |
| `FENRUA_OBSERVATION_CHECKPOINT_MODE` | `required` in production; `optional` is permitted only outside production. |
| `FENRUA_OBSERVATION_CHECKPOINT_NAMESPACE` | Stable environment-specific checkpoint namespace. |
| `UPSTASH_REDIS_REST_URL` | HTTPS Upstash Redis REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Write-capable, narrowly scoped server-only Redis REST credential. |

The public keys and key IDs are intentionally publishable through
`/api/chain-observation-key` (978) and `/api/chain-n521-observation-key`
(N521). Gateway URLs and read tokens are not.

`KV_REST_API_URL` and `KV_REST_API_TOKEN` are accepted only as compatibility
names for migrated Vercel/Upstash installations. If both naming schemes are
present, their values must match exactly. Production must set
`FENRUA_OBSERVATION_CHECKPOINT_MODE=required`; credentials and namespaces are
never returned, logged, or placed in `NEXT_PUBLIC_*` variables.

The checkpoint provides durable application-level continuity using the
configured provider's atomic script execution. It is not a claim of Byzantine
consensus or formal linearizability during an upstream storage partition.
