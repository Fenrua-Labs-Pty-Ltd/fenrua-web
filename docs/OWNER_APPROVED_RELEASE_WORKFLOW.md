# Owner-Approved Release Workflow

Status: active repository-wide rule  
Applies to: every `fenrua-web` branch and Codex agent  
Control-plane source: `fenrualabs/fenrua-public-operations-system` at `9c6ed80acf3edc4565fb2d0d98df35633eeac461`

## Purpose

This is the durable, non-credentialed release rule for `Fenrua-Labs-Pty-Ltd/fenrua-web`. It replaces legacy SAE-only ownership and public-repository deployment execution. It lets any explicitly assigned Codex Release Agent prepare a website update and release request, while preserving Owner-only production approval and the public/private security boundary.

This document is a policy reference to the approved control plane. It does not make this public repository import, call, clone, or depend on that repository at runtime, and it does not copy encrypted bundles, credentials, private topology, or provider configuration here.

## Release Agent Authority

An explicitly assigned Codex Release Agent may:

- receive and implement a bounded public website task;
- regenerate and validate the affected public surfaces;
- capture local desktop and mobile screenshots for visual work;
- revise until the Owner approves the exact result;
- create the public source pull request; and
- prepare a non-secret release-request pull request after the exact public commit is approved on protected `main`.

The Release Agent may not merge the protected release request, trigger production directly, access a provider dashboard or credential, replace the approved commit, extend an expired request, or claim the website is live before the required live-manifest check succeeds.

## Required Sequence

1. Receive the task and identify the public routes, generated output, and trust-boundary surfaces it affects.
2. Implement only the agreed scope. Run the repository validation required for the change.
3. For visual work, capture desktop and mobile screenshots from an isolated local preview. Preserve an Owner-frozen mobile treatment unless the Owner explicitly changes it.
4. Send the evidence to the Owner. If the Owner asks for a fix, revise and repeat this step. Do not open the release path until the Owner approves the exact result.
5. Commit and open the bounded public pull request. It is source review only and has no production authority.
6. After the Owner-approved exact public commit is on protected `main`, prepare a release request in the approved operations control plane. The request contains only the current schema, target repository, target branch, exact commit, production domain, `SAM_OWNER` publisher marker, `OWNER_APPROVES_EXACT_RELEASE` confirmation, and a short expiry.
7. The Owner merges that exact request into the protected control-plane branch. This is the only production trigger.
8. The private controller verifies the exact source binding and provider readiness. The Release Agent then performs read-only live-manifest verification against the approved source commit before reporting production as live.

## Owner Approval Rules

Owner approval must bind to the exact reviewed work. A WSL sign-in, unlock code, green provider badge, preview status, generic acknowledgement, or stale approval is not production authority.

The protected control-plane merge is the authoritative record that the Owner approved the exact release request. If the source commit, expiry, target repository, branch, or domain no longer matches, stop and prepare a new request; never repair or bypass a stale request.

## Public/Private Boundary

The public repository must never store, request, view, copy, echo, or transmit credentials, tokens, private keys, decrypted bundles, provider responses, private endpoint details, topology, or protected runtime configuration. It must never log those values or details.

Validation and public pull requests remain credential-free. The public compatibility command `npm run deploy:production:node24` is intentionally fail-closed; it cannot merge a pull request, call a provider, or trigger a deployment.

## Required Handoff

Before asking the Owner to merge a release request, the Release Agent must provide:

```yaml
Release_Handoff:
  public_commit: "<exact protected-main commit>"
  owner_visual_approval: true
  validation_passed: true
  public_pr: "<url>"
  release_request: "<url>"
  production_triggered: false
  private_ops_credentials_seen: false
```

After the private controller completes, report production only when the live `fenrua.ai` release manifest binds the exact approved public commit. If that check fails or is unavailable, report the gate as blocked; do not imply success.
