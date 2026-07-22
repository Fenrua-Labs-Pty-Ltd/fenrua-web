# SAM/Owner Website Release Policy

Status: **active Owner-approved control**
Repository: `Fenrua-Labs-Pty-Ltd/fenrua-web`  
Canonical public domain: `https://fenrua.ai`

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
