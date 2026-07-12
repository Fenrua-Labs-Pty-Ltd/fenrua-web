# Fenrua V2 Evidence Reconciliation

Status: V2 evidence reconciliation  
Last reviewed: 2026-07-13

## Reconciled Facts

| Fact | Evidence | Limitation |
| --- | --- | --- |
| Toolchain rows are server-rendered | `toolchain/index.html`, `scripts/test-static-routes.mjs` | Pagination is progressive enhancement |
| Toolchain registry has 129 tools | `data/toolchain-registry.json` | Version capture is not security proof |
| Registry hash is public | `/toolchain/` shows SHA-256 | Hash changes when registry changes |
| Semgrep is `1.169.0` | `semgrep --version`, registry test | No Semgrep scan output claimed |
| SnarkJS is `0.7.6` | `snarkjs --version`, kernel package | `1.13.8` is `underscore` |
| No post-evidence updates | evidence-lock policy and registry field | Future updates require new evidence |
| Contract evidence is pending | contract boundary doc | No stale contract details published |

## Registry SHA-256

`98ff822190553ef631df43b00fa8ec5003ab757124b522b51c7d5ae8ad7d21e9`

