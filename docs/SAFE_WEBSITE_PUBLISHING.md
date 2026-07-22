# SAM/Owner Website Release Policy

Status: **active Owner-approved control**
Repository: `Fenrua-Labs-Pty-Ltd/fenrua-web`  
Canonical public domain: `https://fenrua.ai`
Canonical public domain: `https://fenrua.ai`  
Publication authority: Owner-approved Git-integrated release
Founder authority: may authorise, halt, or supersede publication  
CSA boundary: CSA does not publish

## Legacy disposition

All earlier CSA and SAE-only website-publication rulings are legacy for this
repository. They do not block the SAM/Owner path. This replacement does not
weaken the public secret boundary, exact-commit binding, public validation, or
live-manifest verification.

## Authority model

An authorized Codex agent may submit a bounded website-update pull request and
prepare a non-secret release request. The Owner approves the exact release in
GitHub. The private
`fenrualabs/fenrua-public-operations-system` repository is the only production
publisher; it holds the protected provider integration and never exposes its
credentials to the public website repository or agent workspace.

```text
Codex agent -> validated public PR -> Owner approval -> private operations
release request -> protected deployment -> fenrua.ai live-manifest check
An explicitly assigned Codex Release Agent may prepare a bounded website change, validation evidence, screenshots, public pull request, protected-main merge, production watch, and source-bound live audit. CSA may review final public posture, synthesize department findings, and raise release concerns, but CSA does not publish unless explicitly assigned the Release Agent role.

Founder or Project Lead authority may authorise, stop, or supersede publication. After the exact reviewed pull request is green, the Owner's direct **ship it** or **deploy live** command authorises the Release Agent to squash-merge that exact commit to protected `main`; the existing Vercel Git integration is the production trigger. A Release Agent cannot access credentials, substitute a commit, bypass a gate, or claim publication before the live-manifest check passes.

The [Owner-approved release workflow](OWNER_APPROVED_RELEASE_WORKFLOW.md) is the repository-wide source of truth.

## Non-negotiable publishing rule

Do not publish from a dirty, failed, pending, ambiguous, or unreviewed state.

A public website update must follow this order:

1. Start from current `main` and create a bounded topic branch.
2. Apply the bounded website change, regenerate output when required, and validate it.
3. For visual changes, provide desktop and mobile screenshots; revise until the Owner approves the exact result.
4. Open the public source pull request and obtain the required review and validation evidence.
5. Wait for all required GitHub checks and Vercel preview to pass for the exact Owner-approved public commit.
6. On the Owner's live-release command, squash-merge that exact pull request to protected `main` and verify Vercel Production for the resulting main commit.
7. Verify the live `fenrua.ai` manifest against that exact commit and independently derived record digest before claiming publication.

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

An agent may not retrieve, copy, echo, set, or use a Vercel token, provider
secret, `.vercel` linkage, private endpoint, or production environment value.
An Owner's GitHub approval is the release decision. A WSL login, local path, or
manually entered unlock code is not an approval mechanism.

## Fast release lane

1. Start from the intended `main` commit and create a bounded pull request.
2. Run the repository's public validation and use the preview as review
   evidence.
3. The Owner approves the exact reviewed change and merges it to protected
   `main`.
4. A non-secret request in the private operations repository binds that exact
   merge commit, repository, branch, domain, Owner approval marker, and expiry.
5. The Owner merges the reviewed private release request to protected
   pull-request-only `main`. The controller accepts deployment only when that
   merge is performed by the designated Owner actor; this is the
   GitHub-recorded approval for the private operation.
6. The private operation verifies the source commit and Vercel project binding,
   deploys only that commit, waits for provider readiness, and checks the live
   release manifest at `https://fenrua.ai`.

Failure of a public check, private deployment, or live-manifest binding stops
that release only. It does not require an unlock code, credentials in WSL, or a
public deployment command.

## Required public boundaries

The public repository must never contain:

- Vercel tokens, organization IDs, project IDs, provider credentials, or
  `.vercel` project state;
- Vercel CLI deployment commands or deployment workflows;
- private infrastructure topology, signing material, validator routes, or
  protected runtime values;
- unsupported public claims about production, certification, uptime, or private
  systems.

The public boundary workflow validates these constraints on every pull request
and `main` update. It is a guardrail, not a publishing authority.

## Recovery and rollback

Recovery uses the same Owner-approved private release route. A rollback targets
the designated last-known-good commit and its release record; it does not
promote an arbitrary historical deployment. Post-release and post-rollback
checks remain read-only:

```bash
npm run audit:live-release -- --url https://fenrua.ai --expected-commit <40-character-commit> --expected-record-sha256 <record-digest>
npm run audit:live-routes -- --url https://fenrua.ai
npm run audit:live-search-surface -- --url=https://fenrua.ai
```

Keep approval, deployment, and audit receipts outside the public source
repository. Never commit credentials, provider exports, private paths, or
protected operational data.
If production succeeds, verify `https://fenrua.ai` directly. If production fails, do not publish another website update until the failed deployment is either fixed, reverted, or explicitly superseded by an approved recovery release.

## Owner-approved Git-integrated publication rule

The historical direct deployment command is retired and fail-closed. The Release Agent never uses a Vercel CLI, provider dashboard, provider API, `.vercel` project state, or provider credential. Production occurs only through the existing Git integration after the Owner-approved exact pull request is merged to protected `main`.

## Clean handoff gate

A website update is complete only when the handoff says:

```yaml
Release_Handoff:
  publisher: "Owner-approved Git-integrated release"
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
One bounded change. One evidence loop. One Owner-approved exact commit. Green gates. Protected main merge. Git-integrated Production. Verify the live manifest.
```

## Release Agent preparation rule

Any explicitly assigned Codex Release Agent may prepare a public update and merge the exact green Owner-approved pull request after the Owner says **ship it** or **deploy live**. No agent, department, WSL session, code, preview, or provider status can replace that current direct Owner command or the required live audit.

The public `fenrua-web` repository must not contain Vercel tokens, provider credentials, `.vercel` project state, production deployment CLI wiring, or protected deployment secrets.

Vercel preview/build status is a required release gate, alongside the GitHub Actions `Validate public surface` check. Production publishing authority remains Owner-approved and Git-integrated; live publication remains unconfirmed until the source-bound audit succeeds.

## Retired public deployment sentinels

The files `.github/workflows/deploy-production.yml` and `.github/workflows/sae-release-gate.yml` may remain only as fail-closed sentinels for repository continuity and validation compatibility.

They must not contain Vercel CLI usage, provider secrets, or direct production deploy steps. If manually triggered, they must refuse deployment and direct execution to the Owner-approved Git-integrated release sequence.
