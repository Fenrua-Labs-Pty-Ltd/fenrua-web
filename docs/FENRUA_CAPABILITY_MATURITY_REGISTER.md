# Fenrua Capability Maturity Register

Status: public maturity register  
Last reviewed: 2026-07-13

| Capability | Status | Evidence | Limitation |
| --- | --- | --- | --- |
| Website | Reference implementation | `index.html`, `styles.css`, `kernel-status.js` | Static public interface only |
| Kernel repository | Reference implementation | pinned GitHub links in `kernel-status.js` | Website mirrors selected public evidence |
| Evidence registry | Point-in-time public snapshot | `/evidence/`, `kernel-status.js` | Hash and link validation does not rerun or prove the source campaigns |
| Toolchain registry | Point-in-time published inventory | `data/toolchain-registry.json`, `/toolchain/` | Version capture is not current-install, availability, or security proof |
| Public verifier | Prototype foundation | `#verify`, verification result spec | No live server-side verifier claimed |
| Chain 978 observation | Read-only live | `/api/chain-progress`, `/api/chain-observation-key`, `server/observation-continuity.js` | Signed bounded observation is not contract safety; production continuity requires its configured durable checkpoint store |
| Chain N521 observation | Awaiting independent evidence | `/api/chain-progress`, `/api/chain-n521-observation-key` | No liveness claim until an independent gateway and public verification key are configured |
| Entity manifest | Specification | `FENRUA_ENTITY_MANIFEST_SPEC.md` | Schema foundation only |
| Authority policy | Specification | `FENRUA_AUTHORITY_POLICY_SPEC.md` | Enforcement requires integration |
| Evidence bundle | Specification | `FENRUA_EVIDENCE_BUNDLE_SPEC.md` | Bundle signature flow not finalized here |
| CLI | Planned | Toolchain docs | No public Fenrua CLI release claimed |
| SDK | Planned | Developer docs | No SDK availability claimed |
| API | Design | Developer docs | No public API contract claimed |
| Policy engine | Specification | kernel spec | No production engine claimed |
| Runtime gate | Planned | kernel spec | Requires adapter |
| Registry | Research | website evidence registry | Contract refresh pending |
| Revocation service | Doctrine | contract boundary doc | No live service claimed |
