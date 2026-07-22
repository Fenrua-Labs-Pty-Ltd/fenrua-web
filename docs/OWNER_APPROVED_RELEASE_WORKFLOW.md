# Owner-Approved Live Release Workflow

Status: active repository-wide rule  
Applies to: every `fenrua-web` branch and Codex agent

## Purpose

This is the durable, non-credentialed release rule for `Fenrua-Labs-Pty-Ltd/fenrua-web`. It replaces legacy SAE-only and separate private-operations release-request patterns while preserving Owner approval, source binding, and the public/private security boundary.

## Owner Command

After the Owner has approved the exact reviewed change, **“ship it”**, **“deploy live”**, and equivalent direct release commands authorise the Release Agent to run the established public release sequence for that exact commit. A later explicit **hold**, **stop**, or **do not deploy** instruction is the only cancellation.

## Required Sequence

1. Receive the bounded task and identify the affected public surface.
2. Implement only that scope and run the required validation.
3. For visual work, capture desktop and mobile screenshots from an isolated local preview; revise until the Owner approves the exact result.
4. Commit and open the bounded public pull request. Wait for every required GitHub check and Vercel preview to pass.
5. On the Owner's live-release command, squash-merge the exact approved pull-request head to protected `main`.
6. Let the existing Vercel Git integration create the Production deployment. Do not use the Vercel CLI, a provider dashboard, provider credentials, tokens, or a direct provider API call.
7. Confirm the Vercel Production record for the merged `main` commit.
8. Derive the release-record digest from a clean checkout of that exact commit and run the read-only live audit against `https://fenrua.ai`. Report publication only when the manifest binds that exact commit and digest.

## Release Agent Authority

An explicitly assigned Codex Release Agent may implement, validate, capture evidence, open the pull request, merge the exact green approved pull request, watch the Git-integrated deployment, and perform the source-bound live audit.

The Release Agent must not substitute the approved commit, bypass required checks, infer approval from WSL or a provider dashboard, access credentials, or claim a release is live before the live audit succeeds.

## Security Boundary

The public repository must never store, request, view, copy, echo, or transmit credentials, tokens, private keys, decrypted bundles, provider responses, private endpoint details, topology, or protected runtime configuration.

This repository must not use a Vercel CLI deployment command, provider API call, `.vercel` project state, provider secret, or runtime dependency on a private operations repository. The existing GitHub-to-Vercel integration is the only production transport used by this workflow.

## Required Handoff

```yaml
Release_Handoff:
  public_commit: "<exact merged main commit>"
  owner_visual_approval: true
  validation_passed: true
  public_pr: "<url>"
  production_triggered: true
  vercel_production_status: "success"
  live_manifest_matches_commit: true
  private_ops_credentials_seen: false
```
