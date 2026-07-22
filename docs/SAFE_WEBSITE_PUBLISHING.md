# Safe Website Publishing Control

Status: Active public-repository control  
Repository: `Fenrua-Labs-Pty-Ltd/fenrua-web`  
Canonical public domain: `https://fenrua.ai`  
Publication authority: Owner-approved private control plane
Founder authority: may authorise, halt, or supersede publication  
CSA boundary: CSA does not publish

## Purpose

This document defines the minimum safe path for publishing any Fenrua website update. It replaces ad-hoc publish behaviour for this repository.

A website update is safe to publish only when the source tree, review surface, generated public output, deployment state, and live-domain confirmation all agree.

## Authority boundary

An explicitly assigned Codex Release Agent may prepare a bounded website change, validation evidence, screenshots, public pull request, and non-secret operations release request. CSA may review final public posture, synthesize department findings, and raise release concerns, but CSA does not publish.

Founder or Project Lead authority may authorise, stop, or supersede publication. The Owner's protected merge of the exact, expiring request in `fenrualabs/fenrua-public-operations-system` is the only production trigger. A Release Agent cannot merge that request, access credentials, trigger production directly, or claim publication before the live-manifest check passes.

The [Owner-approved release workflow](OWNER_APPROVED_RELEASE_WORKFLOW.md) is the repository-wide source of truth.

## Non-negotiable publishing rule

Do not publish from a dirty, failed, pending, ambiguous, or unreviewed state.

A public website update must follow this order:

1. Start from current `main` and create a bounded topic branch.
2. Apply the bounded website change, regenerate output when required, and validate it.
3. For visual changes, provide desktop and mobile screenshots; revise until the Owner approves the exact result.
4. Open the public source pull request and obtain the required review and validation evidence.
5. Bind the exact Owner-approved public commit on protected `main` into a non-secret, expiring operations release request.
6. The Owner merges that exact request in the protected private control plane.
7. Verify the live `fenrua.ai` manifest against that exact commit before claiming publication.

If any gate is pending, stay silent and do not claim publication. If any gate fails, stop the release and report the failed gate.

## Required preflight

Before a website update branch is opened or reused, record:

```yaml
Preflight:
  repository: "Fenrua-Labs-Pty-Ltd/fenrua-web"
  base_branch: "main"
  base_commit: "<current main sha>"
  open_release_prs: <count>
  production_status_for_base: "success | failure | pending | missing"
  action: "continue | hold"
```

Continue only when the base state is understood. If the previous production state is failed or unclear, the next update must first resolve that release condition.

## Implementation scope rule

Each website update must identify its route and output surface:

```yaml
Implementation_Scope:
  routes_changed:
    - "/"
  generated_files_changed: true
  source_generator_changed: true
  static_assets_changed: false
  public_claim_surface_changed: true
  protected_infrastructure_touched: false
```

When `generated_files_changed` is true, the generator or postprocessor that owns those files must also be updated or validated. Do not hand-edit generated public output without preserving the deterministic generation path.

## Required local or CI validation

The release path must preserve the repository validation contract. At minimum, the pull request must leave the following commands valid for the checked-out source:

```bash
npm run generate:static
npm run check:source-syntax
npm run check:generated
npm run validate
npm run build:release
```

If a local execution environment is unavailable, the pull request body must state that CI and deployment checks are authoritative, and the PR must not be merged until the required checks and preview deployment succeed.

## Public trust-boundary review

Any change that affects public claims, trust language, legal/commercial boundaries, official-source statements, token/no-token statements, evidence language, or operational status language requires explicit trust-boundary review before merge.

The review must confirm:

```yaml
Trust_Boundary_Check:
  provider_names_added: false
  secrets_or_credentials_added: false
  contract_addresses_added: false
  tokenomics_added: false
  wallet_payment_swap_staking_bridge_claim_mechanics_added: false
  future_token_implication_added: false
  protected_infrastructure_disclosed: false
  private_chain_operational_details_disclosed: false
  unsupported_live_claim_added: false
```

## Merge gate

A pull request may be merged only when:

- it is based on the current intended `main` line;
- the file diff matches the approved scope;
- required GitHub checks are successful;
- preview deployment is successful;
- no unresolved trust-boundary or release-boundary finding remains;
- no unrelated open release PR is competing for the same public surface.

Do not merge a PR with a failed preview deployment. Do not merge a PR only because the code diff looks correct.

## Production watch gate

After merge, bind the watch to the merged `main` commit, not only to the pre-merge branch head.

```yaml
Production_Watch:
  commit: "<merged main sha>"
  notify_on:
    - "success"
    - "failure"
  silent_on:
    - "pending"
    - "missing"
  include_deployment_url: true
  stop_after_final_state: true
```

If production succeeds, verify `https://fenrua.ai` directly. If production fails, do not publish another website update until the failed deployment is either fixed, reverted, or explicitly superseded by an approved recovery release.

## Owner-approved private-control-plane publication rule

The public repository's former production gate is retired and fail-closed. Production workflow execution belongs only to the protected private operations control plane. A Release Agent may prepare the non-secret request only after the exact public commit and Owner review evidence are ready; only the Owner merges it.

## Clean handoff gate

A website update is complete only when the handoff says:

```yaml
Release_Handoff:
  publisher: "Owner-approved private controller"
  open_prs: 0
  main_commit: "<published main sha>"
  production_status: "success"
  live_domain_checked: true
  release_branch_ahead: false
  pending_failed_preview: false
  next_task_ready: true
```

If any field cannot be confirmed, the handoff is not clean.

## Rollback and recovery

Rollback must be treated as a new controlled release unless the repository already provides an approved release command for the exact scenario.

A rollback must identify:

- the published commit being reverted;
- the reason for rollback;
- the last known good production commit;
- whether public trust language, legal language, or official-source notices are affected;
- the production watch result after rollback.

## No-touch boundaries

Safe website publishing never authorises exposure of:

- credentials, tokens, secrets, private keys, provider secrets, or internal environment values;
- private infrastructure topology, protected endpoints, validator routes, signing material, or private mesh details;
- contract addresses unless separately approved for a public evidence record;
- tokenomics, wallet mechanics, swap mechanics, staking mechanics, bridge mechanics, or claim mechanics;
- unsupported production, certification, uptime, runtime, or external-assurance claims.

## Operator summary

Use this rule for every website update:

```text
One bounded change. One evidence loop. One Owner-approved exact commit. One expiring non-secret private request. Owner merge. Verify the live manifest.
```

## Release Agent preparation rule

Any explicitly assigned Codex Release Agent may prepare a public update and its non-secret operations release request. The Owner retains production authority through the protected control-plane merge. No agent, department, WSL session, code, preview, or provider status can replace that merge.

The public `fenrua-web` repository must not contain Vercel tokens, provider credentials, `.vercel` project state, production deployment CLI wiring, or protected deployment secrets.

Vercel preview/build status may provide useful signal, but it is not the source of publishing authority. The required public repository gate is the GitHub Actions `Validate public surface` check. Production publishing authority remains Owner-approved and private-control-plane controlled.

## Retired public deployment sentinels

The files `.github/workflows/deploy-production.yml` and `.github/workflows/sae-release-gate.yml` may remain only as fail-closed sentinels for repository continuity and validation compatibility.

They must not contain Vercel CLI usage, provider secrets, production deploy steps, or public-repository publishing authority. If manually triggered, they must refuse deployment and direct execution to Owner-approved private operations control.
