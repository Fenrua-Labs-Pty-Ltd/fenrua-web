# Fenrua Public Claim Evidence Register

Status: public claim register  
Last reviewed: 2026-07-12

| Claim | Page | Source | Evidence | Freshness | Maturity | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Fenrua is Layer 0 AI Security Utility Infrastructure | Home | task doctrine | architecture docs | 2026-07-12 | Category thesis | Needs continuous evidence mapping |
| Fenrua is building a security kernel beneath autonomous AI | Home | architecture docs | kernel spec | 2026-07-12 | Reference architecture | Must not imply production certification |
| Fenrua provides identity, authority, integrity, policy, evidence, verification, containment, recovery primitives | Home, kernel | kernel spec | maturity register | 2026-07-12 | Mixed maturity | Each primitive must keep separate status |
| Public kernel snapshot is source-linked | Home, evidence | `kernel-status.js` | pinned GitHub links | 2026-07-12 | Read-only live | Snapshot is not proof of future revisions |
| Genesis suite is verified | Home, evidence | `kernel-status.js` | public telemetry | 2026-07-12 | Evidence surface | Scope limited to listed suite |
| Differential campaign passed | Home, evidence | `kernel-status.js` | public telemetry | 2026-07-12 | Evidence surface | Does not prove production runtime |
| Toolchain registry is public | Toolchain | `data/toolchain-registry.json` | `/toolchain/` | 2026-07-12 | Read-only live | Version capture is not security proof |
| Semgrep detected version is `1.169.0` | Toolchain | `semgrep --version` | toolchain registry | 2026-07-12 | Version inventory | No Semgrep scan result claimed |
| SnarkJS detected version is `0.7.6` | Toolchain | `snarkjs --version`, kernel package | toolchain lock | 2026-07-12 | Version inventory | Do not confuse with `underscore 1.13.8` |
| Chain 978 is a signed bounded observation | Home | `/api/chain-progress`, `/api/chain-observation-key` | API tests | 2026-07-13 | Read-only live | Not chain safety, contract state, or reserve proof |
| Chain N521 telemetry is intentionally private | Home | `/api/chain-progress` | API tests | 2026-07-13 | Unavailable by design | No public liveness claim is made |
| Contract evidence refresh is pending | Home, docs | contract boundary register | placeholder statement | 2026-07-12 | Pending refreshed bundle | Blocks stale contract claims |

## Flagged Historical Risks

- Some previous copy used phrases such as "audit-sealed" and "immutable" too
  broadly. The new interface narrows those claims to pinned public evidence.
- Contract-derived content is pending refreshed evidence and must not be used as
  current deployment proof.
