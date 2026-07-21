# Safe Website Publishing Control

Status: Active public-repository control  
Repository: `Fenrua-Labs-Pty-Ltd/fenrua-web`  
Canonical public domain: `https://fenrua.ai`  
Publication authority: SAE only  
Founder authority: may authorise, halt, or supersede publication  
CSA boundary: CSA does not publish

## Purpose

This document defines the minimum safe path for publishing any Fenrua website update. It replaces ad-hoc publish behaviour for this repository.

A website update is safe to publish only when the source tree, review surface, generated public output, deployment state, and live-domain confirmation all agree.

## Authority boundary

SAE is the only approved website publishing executor for this repository.

CSA may review final public posture, synthesize department findings, and raise release concerns. CSA must not push, merge, trigger, announce, or claim a website publication.

SATE may review wording, trust, impersonation, disclosure, no-token language, and public-boundary risk. OPS may review operational clarity, deployment state, live-domain status, and release handoff. Their reviews do not replace SAE publication execution.

Founder or Project Lead may authorise, stop, or supersede publication. Once authorised, SAE owns the release path, merge readiness, production watch, and final clean handoff.

## Non-negotiable publishing rule

Do not publish from a dirty, failed, pending, ambiguous, or unreviewed state.

A public website update must follow this order:

1. Start from current `main`.
2. Confirm there are no unintended open pull requests for the website release lane.
3. Create a topic branch from the exact current `main` commit.
4. Apply the bounded website change.
5. Generate and validate the static output if the change touches generated surfaces.
6. Open a pull request for review and preview deployment.
7. Wait for required GitHub checks and preview deployment to succeed.
8. Merge by the repository-approved merge method only.
9. Watch the merged `main` commit until the production deployment reaches success or failure.
10. Confirm the live `fenrua.ai` surface after the deployment reaches a final state.

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

## SAE GitHub release gate

The repository provides `.github/workflows/sae-release-gate.yml` as the controlled manual production executor for SAE after a pull request has already passed review, preview, required checks, and merge.

The workflow must be dispatched from `main` and requires:

```yaml
SAE_Release_Gate_Input:
  expected_main_sha: "<exact approved main commit sha>"
  confirmation: "SAE_APPROVES_PRODUCTION_RELEASE"
```

The gate verifies the checked-out `main` commit, requires a clean source tree, validates the public release artifact set, builds with the existing Vercel production secret set, deploys production, audits `https://fenrua.ai`, and fails if the release checkout is dirty after deployment.

CSA must not dispatch this workflow or claim its result. OPS may inspect the workflow run and live-domain result, but SAE remains the publishing executor.

## Clean handoff gate

A website update is complete only when the handoff says:

```yaml
Release_Handoff:
  publisher: "SAE"
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
One SAE-owned release path. One clean branch. One bounded PR. Passing checks. Successful preview. Squash merge. Watch main. Verify live domain. Leave no open release PR behind.
```

## Locked SAE-only publication rule

All public website updates are executed through SAE-owned release control.

Founder, CSA, or any other department may request, authorise, halt, or reject a change, but they do not directly publish the site. Even founder-originated updates must enter the same SAE-owned path:

1. SAE creates or accepts the bounded change request.
2. SAE owns the implementation branch.
3. SAE opens the pull request.
4. Required public validation must pass.
5. SAE performs the merge or release action.
6. Production is watched and verified.
7. SAE leaves a clean handoff.

The public `fenrua-web` repository must not contain Vercel tokens, provider credentials, `.vercel` project state, production deployment CLI wiring, or protected deployment secrets.

Vercel preview/build status may provide useful signal, but it is not the source of publishing authority. The required public repository gate is the GitHub Actions `Validate public surface` check. Production publishing authority remains SAE-controlled.
