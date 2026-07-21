# Fenrua BlackBox Protocol

**Public evidence for private AI execution.**

`fenrua-web` is the canonical public website and evidence interface for **https://fenrua.ai**.

Fenrua BlackBox Protocol is a privacy-preserving evidence layer for verifiable AI automation. It is designed to let reviewers inspect bounded evidence about AI execution, trust decisions, release artifacts, policy boundaries, and system claims without exposing the confidential machine beneath them.

Fenrua’s core rule is simple:

> Evidence Before Authority.

Capability is not authority. A system’s ability to act does not mean the action should be trusted.

---

## Official Source and Anti-Impersonation Notice

**fenrua.ai is the sole and only official website for Fenrua Protocol and Fenrua Labs Pty Ltd.**

Any website, social account, media channel, token page, contract listing, claim page, airdrop page, staking page, swap, bridge, NFT mint, Telegram group, Discord server, or public communication claiming to represent Fenrua Protocol must be treated as unofficial unless it is explicitly listed or linked from **https://fenrua.ai**.

Fenrua Protocol has **no live token, contract, presale, airdrop, staking pool, swap, bridge, NFT mint, or claim page** on Ethereum, Solana, BSC, or any other public mainnet chain.

Fenrua activity is currently limited to Fenrua’s private-chain research environment and bounded public evidence surfaces. Fenrua Labs Pty Ltd is not offering, selling, promoting, or authorising any commercial token offering.

Any public token, contract, listing, website, media profile, message, group, or account claiming to represent a live Fenrua token or an official Fenrua commercial offering should be treated as **unauthorised, impersonated, or potentially fraudulent** unless explicitly confirmed on **fenrua.ai**.

Always verify Fenrua information from **https://fenrua.ai** before trusting any external link, message, contract address, social post, or media account.

---

## Project Objective

Fenrua BlackBox Protocol exists to make autonomous AI execution governable.

As AI systems gain the ability to plan, call tools, access networks, modify infrastructure, and pursue objectives across long-running workflows, capability can no longer be treated as authority.

Fenrua separates capability from authority by placing an evidence layer beneath AI execution. Every tool call, policy decision, model action, infrastructure change, and release claim should be bounded by manifest, policy, identity, revocation, evidence, and review.

The goal is not to expose the whole machine. The goal is to prove enough about the machine’s actions for authorised reviewers to question them without revealing private infrastructure, tenant data, provider routes, credentials, node topology, or protected operational wiring.

---

## Why Fenrua Matters Now

Recent public disclosures from OpenAI and Hugging Face showed that autonomous AI-driven cybersecurity risk is no longer theoretical. The incident context involved autonomous agent activity, sandbox boundary issues, credential exposure, infrastructure intrusion, and the use of AI-assisted forensic reconstruction.

Fenrua does not claim to prevent every misuse of autonomous AI.

Fenrua addresses the governance class behind the risk:

> raw AI capability becoming unreviewed operational authority.

A sandbox alone is not enough if a capable system can find a path around it.

A tool permission alone is not enough if the action is not tied to policy.

A log alone is not enough if it cannot prove which identity, manifest, request, revocation state, and evidence boundary made the action acceptable.

Fenrua’s model requires critical AI-linked actions to be:

- tenant-scoped;
- identity-bound;
- manifest-bound;
- policy-checked;
- revocation-aware;
- replay-resistant;
- committed into evidence;
- separately verifiable;
- limited by disclosure boundary;
- reviewable after the fact.

A tool call should have evidence.

A network action should have evidence.

An infrastructure change should have evidence.

A release claim should have evidence.

A model decision that affects state should have evidence.

That is the practical meaning of:

> Evidence Before Authority.

References:

- OpenAI incident disclosure: https://openai.com/index/hugging-face-model-evaluation-security-incident/
- Hugging Face security disclosure: https://huggingface.co/blog/security-incident-july-2026

These references are included only to explain the current autonomous AI risk context. Fenrua does not claim to have prevented those specific incidents.

---

## What This Project Demonstrates

Fenrua addresses a core problem in autonomous AI automation:

> Autonomous systems can act at machine speed. Trust cannot.

Conventional logs may describe what happened. Fenrua focuses on a harder question:

> What evidence made that action acceptable?

The current public project demonstrates:

- a public evidence interface for technical review;
- claim, capability, evidence, and release-boundary records;
- public/private disclosure separation;
- a Trust Gate model for controlled AI action review;
- a P/N-521 proof-kernel research direction;
- bounded private-chain observation;
- source-bound release validation;
- human-directed GPT-5.5 and GPT-5.6 project workflows;
- a professional reviewer path for inspecting the system without credentials.

Fenrua does **not** expose private infrastructure, provider routes, credentials, topology, activation profiles, treasury details, private-chain operational wiring, or protected internal mappings.

---

## Demo Video

**Fenrua — Evidence Before Authority**

A 2:56 cinematic technical demo presenting the project’s core idea:

> Public evidence for private AI execution.

Video link: **PASTE YOUTUBE LINK HERE**

The final demo combines protocol narration, BlackBox architecture, public/private boundary framing, Trust Gate review, P/N-521 proof direction, bounded observation, and the human-directed GPT-5.5 / GPT-5.6 build record.

---

## Public Review Links

- Website: https://fenrua.ai
- Evidence: https://fenrua.ai/evidence
- Trust: https://fenrua.ai/trust
- Verify: https://fenrua.ai/verify
- Operations: https://fenrua.ai/operations
- Release manifest: https://fenrua.ai/.well-known/fenrua-release.json
- Repository: https://github.com/fenrualabs/fenrua-web

No credentials are required.

---

## Repository Purpose

This repository contains the public website and evidence interface for `fenrua.ai`.

It includes:

- static website routes;
- public evidence and claim registers;
- capability and maturity records;
- public document registers;
- release-manifest generation;
- validation scripts;
- accessibility and information-architecture checks;
- public-boundary documentation;
- bounded public observation adapters.

This repository is **not** the private execution mesh, not the internal protocol control plane, not a wallet system, and not a token contract repository.

---

## Current Public Evidence

- [Current public audit](/audit)
- [Release manifest](/.well-known/fenrua-release.json)
- [Site-evidence input](data/site-evidence.json)
- [Public document register](data/public-document-register.json)

Public boundary documents:

- [External audit-artifact policy](docs/EXTERNAL_ARTIFACT_POLICY.md)
- [Public repository secret boundary](docs/PUBLIC_SECRET_BOUNDARY.md)
- [Access-only commercial boundary](docs/ACCESS_ONLY_COMMERCIAL_BOUNDARY.md)
- [Safe website publishing control](docs/SAFE_WEBSITE_PUBLISHING.md)
- [Public Observation Gateway](docs/PUBLIC_OBSERVATION_GATEWAY.md)
- [Vercel publishing notes](docs/VERCEL.md)

Audit, review, scan-output, test-output, visual-capture, and builder reports are stored outside this source repository. Credentials, encrypted recovery bundles, keys, provider internals, and protected operational evidence are prohibited from this repository.

---

## Architecture Overview

Fenrua follows a BlackBox model:

```text
AI agent event
  -> encrypted capture
  -> private execution boundary
  -> tenant-scoped state
  -> bounded public evidence
  -> reviewer verification
```

The public system is designed to expose enough evidence for review while keeping the confidential machine private.

Key concepts:

- **Evidence Before Authority** — claims should be supported by inspectable evidence.
- **Capability Is Not Authority** — an AI system’s ability to act does not mean the action should be trusted.
- **Public Evidence / Private Execution** — reviewers inspect bounded public records, not private infrastructure.
- **Trust Gate** — AI actions are evaluated against policy, manifest, request, and revocation context.
- **P/N-521 kernel direction** — cryptographic proof-boundary research around canonical values, arithmetic, and receipts.
- **Bounded observation** — private-chain state is surfaced only through signed, limited public observations.
- **No private topology disclosure** — routes, endpoints, provider internals, keys, and node relationships remain protected.

---

## Protocol Math Spine

The full mathematical and cryptographic discussion belongs in the technical dossier. This README keeps only the minimum protocol spine.

### Bounded tenant projection

Fenrua separates internal execution from client-visible verification by exposing only an authorised tenant projection:

$$
\mathcal{P}_t =
\{A_t, E_t, B_t, \Pi_t, \Omega_t, U_t\}
$$

Where:

- \(A_t\) is the tenant’s authorised agent registry.
- \(E_t\) is the tenant’s event set.
- \(B_t\) is the tenant’s logical block sequence.
- \(\Pi_t\) is the tenant’s cryptographic proof set.
- \(\Omega_t\) is the tenant’s public-anchor receipt set.
- \(U_t\) is the tenant’s settlement and accounting view where applicable.

Access must stay inside the authorised projection:

$$
\operatorname{Authorised}(q,t)=1
\Rightarrow
\operatorname{Response}(q) \subseteq \mathcal{P}_t
$$

Unauthorised requests fail closed:

$$
\operatorname{Authorised}(q,t)=0
\Rightarrow
\operatorname{Response}(q)=\bot
$$

### Event commitment

A private event payload is encrypted and committed without exposing plaintext:

$$
h_i =
H(
\texttt{"FENRUA\_EVENT\_V1"}
\parallel C_t
\parallel A_{t,a}
\parallel q_i
\parallel \tau_i
\parallel H(X_i)
\parallel H(M_i)
\parallel H(W_i)
\parallel \nu_i
)
$$

### Replay nullifier

Replay protection is tenant-bound and epoch-scoped:

$$
N_i =
\operatorname{PRF}_{K_{t,\mathrm{null}}^{(e)}}(
A_{t,a}
\parallel q_i
\parallel e
)
$$

A valid event requires:

$$
N_i \notin \mathcal{N}_{t,e}
$$

### P-521 primitive direction

Fenrua’s proof-kernel direction uses P-521 verification concepts over:

$$
p = 2^{521} - 1
$$

The direction includes canonical values, limb arithmetic, modular operations, deterministic commitments, replay protection, and future zero-knowledge proof integration.

### Tenant logical block

Tenant state can be committed without exposing private mesh height:

$$
B_{t,k} =
H(
\texttt{"FENRUA\_TENANT\_BLOCK\_V1"}
\parallel k
\parallel B_{t,k-1}
\parallel E_{t,k}
\parallel q_{\mathrm{first}}
\parallel q_{\mathrm{last}}
\parallel m
\parallel v_{\mathrm{policy}}
)
$$

This creates tenant-local history without disclosing shared execution topology.

---

## Trust Gate Model

The Local Trust Gate remains a planned promotion-gated research capability. This repository does not publish its CLI, SDK, hosted verifier, upload interface, or release artifact.

The Trust Gate model evaluates controlled AI actions using:

- manifest;
- authority policy;
- tool-call request;
- revocation set;
- strict parsing;
- duplicate-key rejection;
- closed-profile admission;
- local digest checks;
- freshness and context checks;
- deny-overrides;
- evidence construction;
- separate verification.

The rule is:

> ALLOW is not EXECUTE.

A successful policy decision is evidence that a bounded review passed. It is not unrestricted authority to act.

---

## Bounded Chain Observation

Fenrua operates a protected two-chain private-mesh research environment.

During the final submission window, Fenrua passed the one-million-block bounded observation milestone across its two private chains.

This is presented as infrastructure continuity context and bounded observation evidence.

It is not presented as:

- a public mainnet deployment;
- runtime safety proof;
- external certification;
- financial network proof;
- contract safety proof;
- token proof;
- public RPC availability.

Each chain is published only through bounded signed observation surfaces. The public site never exposes unrestricted JSON-RPC, peer maps, validator topology, private routes, keys, provider internals, or operational wiring.

See [Public Observation Gateway](docs/PUBLIC_OBSERVATION_GATEWAY.md).

---

## Canonical Website

`fenrua-web` is the canonical public website for Fenrua Labs.

Production publishes through the existing Vercel project `fenrua-web`, which owns `fenrua.ai`.

---

## Website Publishing Authority

Website publishing is controlled by the [Safe Website Publishing Control](docs/SAFE_WEBSITE_PUBLISHING.md).

CSA may synthesize public posture, review final wording, and raise release concerns, but CSA does not publish website updates.

SAE is the approved website publishing executor for this repository. Founder or Project Lead authority may authorise, halt, or supersede a release. After authorisation, SAE owns the branch, PR, merge readiness, production watch, live-domain verification, and clean handoff.

---

## Utility Standard

- `fenrua-kernel` is the bedrock research artifact.
- `fenrua-web` is the reproducible public website and evidence interface.
- Public release evidence is limited to the static artifacts listed in its release manifest and audit scope.
- `bedrock-source` and release provenance stay separated from marketing claims.
- Do not claim “Certified” or “Formally Verified” until the math is complete and external audits are signed.

---

## Human-Directed GPT-5.5 / GPT-5.6 Build Record

Fenrua was built through intensive human-directed AI workflows across roughly 10 billion lifetime tokens.

The model roles were not interchangeable:

- **Sol** — cryptographic reasoning, audit thinking, proof boundaries, and assurance review.
- **Terra** — implementation structure, app wiring, infrastructure, VPS, mesh, network, and node work.
- **Luna** — UI direction, graphic design, cinematic asset development, and brand consistency.
- **Codex** — repository implementation support, inspection, validation planning, and controlled code changes.

AI supported the build process, but final authority remained human-controlled.

Final project direction, claims, release boundaries, security posture, disclosure decisions, and public-facing wording were reviewed and controlled by the founder.

---

## Local Validation

Use Node 24 and the committed lockfile:

```bash
npm ci
npm run generate:static
npm run validate
```

`npm run validate` rejects stale generated routes and validates the permitted public/static scope, canonical model, route lifecycle, evidence boundaries, and release-toolchain contract.

Useful checks:

```bash
npm run check:ontology
npm run check:capabilities
npm run check:claims
npm run check:evidence-taxonomy
npm run test:ia
npm run test:accessibility
```

These checks validate the public website and evidence interface. They do not verify protected private systems.

---

## Canonical Public Model

The public estate renders material claims and capability boundaries from versioned inputs rather than page-only copy:

- `data/product-ontology.json`
- `data/capability-register.json`
- `data/claim-register.json`
- `data/evidence-taxonomy.json`
- `data/assurance-language.json`
- `data/public-service-catalogue.json`
- `data/route-lifecycle.json`

---

## Protocol Contract Index

The programme keeps product and release boundaries explicit before Trust Gate implementation is promoted:

- [Product constitution](docs/PRODUCT_CONSTITUTION.md)
- [Domain model](docs/DOMAIN_MODEL.md)
- [Decision semantics](docs/DECISION_SEMANTICS.md)
- [Trust boundary](docs/TRUST_BOUNDARY.md)
- [Promotion gates](docs/PROMOTION_GATES.md)
- [Compatibility policy](docs/COMPATIBILITY_POLICY.md)
- [Cryptographic profiles](docs/CRYPTOGRAPHIC_PROFILES.md)
- [Trust Gate v0.1 bootstrap contract](docs/FENRUA_TRUST_GATE_V0_1_CONTRACT.md)
- [Trust Gate bootstrap plan](docs/FENRUA_TRUST_GATE_BOOTSTRAP.md)
- [API error contract](docs/API_ERROR_CONTRACT.md)
- [Threat model index](docs/THREAT_MODEL_INDEX.md)
- [Integration manifest](docs/FENRUA_INDUSTRIAL_10_INTEGRATION_MANIFEST.md)
- [Readiness ledger](docs/FENRUA_INDUSTRIAL_10_READINESS_LEDGER.md)
- [Trust Gate repository ADR](docs/adr/ADR-0001-TRUST-GATE-REPOSITORY-BOUNDARY.md)
- [Trust Gate implementation ADR](docs/adr/ADR-0002-LOCAL-TRUST-GATE-IMPLEMENTATION.md)

These documents freeze proposed contracts and record unresolved promotion dependencies. They do not change the Local Trust Gate’s public availability.

---

## Owner-Approved Git Release

An owner approves and merges a validated `main` commit.

The existing Vercel Git integration builds that exact commit and exposes `VERCEL_GIT_COMMIT_SHA`. The manifest generator refuses an unbound production build. The repository does not install the Vercel CLI, keeping unrelated deployment dependency trees out of the audited development environment.

Before deployment, retain the record digest from the independently built, trusted release checkout. After deployment, bind the read-only observation to both that digest and the exact commit:

```bash
RECORD_SHA256=$(node -p "require('./.well-known/fenrua-release.json').integrity.recordSha256")
npm run audit:live-release -- --url https://fenrua.ai --expected-commit <40-character-commit> --expected-record-sha256 "$RECORD_SHA256"
```

The expected record digest is the independent trust anchor. A live manifest’s self-hash alone cannot detect origin compromise. The receipt proves only the observed public static artifact set at that time; it is not evidence for live cards, APIs, private systems, or perpetual production assertion.

For the standalone SAE-owned production gate on the approved `main` commit, use a clean main checkout:

```bash
npm run release:production-check
```

Production publishing is performed by the existing Vercel Git integration, not by a repository-local deployment CLI.

---

## Public / Private Boundary

This repository may contain:

- public website source;
- public evidence registers;
- public claim and capability records;
- public documentation;
- validation scripts;
- release-manifest tooling;
- bounded public observation adapters;
- non-secret test examples.

This repository must not contain:

- credentials;
- private endpoints;
- provider internals;
- node topology;
- peer relationships;
- private-chain operational wiring;
- activation profiles;
- treasury mappings;
- recovery bundles;
- raw internal lock documents;
- visual baselines;
- private audit artifacts;
- screenshots or media masters;
- protected infrastructure evidence.

External reports, visual baselines, scan outputs, test-output bundles, and private evidence artifacts remain outside this source repository.

---

## Commercial Boundary

Fenrua Labs Pty Ltd is the registered operator.

**FENRUA LABS PTY LTD**  
ABN: 62 700 182 663  
ACN: 700 182 663  
Australia

This repository and public website do not publish an investment product, token-crowdfunding product, exchange, trading platform, financial-return product, customer wallet, staking product, yield product, bridge, swap, public token sale, commercial token offering, or public mainnet token deployment.

Collaboration contact: partnerships@fenrua.ai

---

## File Map

Core public files:

- `index.html` — canonical public website and evidence interface
- `styles.css` — public interface styling
- `kernel-status.js` — local telemetry and registry manifest
- `data/company-identity.json` — canonical registered operator record
- `data/site-evidence.json` — deterministic public evidence input
- `data/public-document-register.json` — public document register
- `data/toolchain-registry.json` — public machine-readable toolchain registry
- `data/capability-register.json` — capability maturity and availability records
- `data/claim-register.json` — public claim records
- `data/evidence-taxonomy.json` — evidence classes and source records
- `scripts/generate-release-manifest.mjs` — release manifest generator
- `scripts/audit-live-release.mjs` — read-only public artifact audit
- `tests/browser/` — browser, accessibility, and public-surface checks
- `api/chain-progress.js` — bounded signed Chain 978 and Chain N521 observation adapter
- `api/chain-observation-key.js` — Chain 978 public Ed25519 verification metadata endpoint
- `api/chain-n521-observation-key.js` — Chain N521 public Ed25519 verification metadata endpoint
- `server/observation-continuity.js` — atomic durable replay, equivocation, and key-rotation checkpoint
- `scripts/check-secret-boundary.mjs` — fail-closed public source credential and vault gate
- `assets/fenrua-header-logo.jpg` — shared Fenrua header and favicon mark
- `docs/` — public boundary, release, trust, and operating documentation

Deeper operating details are kept in `docs/` rather than expanded in this README.

---

## Tracking Policy

Do not add Google Analytics, Hotjar, pixels, remote embeds, or any other tracking scripts.

If traffic data is required, use host-side logs or privacy-preserving operational records.

---

## Project Position

Fenrua BlackBox Protocol is not a generic landing page and not a consumer app.

It is a public evidence interface for a deeper protocol direction:

```text
Evidence before authority.
Capability is not authority.
Public evidence.
Private execution.
Verification without revealing the machine.
```

Fenrua does not expose the whole machine.

It exposes the evidence required to question it.
