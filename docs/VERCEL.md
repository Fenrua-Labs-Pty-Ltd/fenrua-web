# Vercel Publishing Boundary

Canonical production domain: `fenrua.ai`

Canonical Vercel project: `fenrua-web`

Node runtime: `24.x`

`fenrua-web` is the public source, evidence, validation, and release-manifest repository. It does not store Vercel tokens, provider credentials, `.vercel` project state, production deployment CLI wiring, private endpoints, or protected deployment secrets.

Production deployment authority belongs exclusively to the private operations repository `fenrualabs/fenrua-public-operations-system`. A reviewed non-secret request in `requests/fenrua-web-production.json` binds the exact public commit, and the protected `vercel-production` workflow performs provider REST deployment and live-manifest verification without emitting provider values.

The allowed public repository path is:

1. bounded SAE-owned branch;
2. bounded pull request;
3. `Validate public surface` passing;
4. approved merge to protected `main`;
5. reviewed private-operations release request;
6. protected production deployment;
7. live-domain manifest verification and clean handoff.

Vercel preview/build status is useful deployment evidence, but it is not publishing authority. Production is not confirmed until the protected private workflow reaches provider readiness and the live release manifest reports the approved source commit.

## Project settings

The existing Vercel project uses the repository root, Node `24.x`, `npm ci --omit=dev`, `npm run build:release`, the generated `public` output directory, production branch `main`, and canonical domain `fenrua.ai`. These non-secret settings remain reviewable in `vercel.json`; provider linkage values and credentials remain private.

The Vercel Git integration supplies `VERCEL_GIT_COMMIT_SHA` for source binding. Owner and GitHub validation use exact Node `24.18.0` and npm
`11.18.0`; Vercel accepts only the managed Node `24.x` and npm `11.x` major lines.

The historical public command spelling `npm run deploy:production:node24 -- --pr <number> --confirm-production` remains documented solely so repository regression tests can detect unreviewed behaviour changes. It is not the production authority; deployment execution belongs to the private operations repository.

The owner-approved external visual baseline path is private custody metadata. Validation may confirm custody, but routine output must not print the
raw path, commit it, upload it, or copy it into provider logs.

## Preview and production gates

The deployment command never runs the Vercel CLI, changes domains or environment variables, purges caches, or promotes previews. It executes only inside the SAE-owned private operations control plane, uses the protected provider environment, and binds deployment to a reviewed public commit. A local release check is necessary source evidence, not preview or production verification.

Before production authorisation, retain outside the public repository:

1. the exact approved commit;
2. the independently retained release-record digest;
3. the designated last-known-good (LKG) commit and release-manifest reference;
4. the expected route-lifecycle revision and legal-route state.

The human preview gate verifies the exact commit and record digest, current routes and redirects, cache headers, canonical and noindex alias behaviour, the public release audit, and browser failure states. Production may be authorised only when the reviewed evidence is bound to the same commit and manifest. Until that happens, source work is code-complete but
production-unverified.

## Rollback and external cleanup

A rollback is an owner decision to restore the designated LKG commit through the approved private operations control plane. Do not select an arbitrary older deployment or treat a recently successful build as LKG without the source-bound manifest and owner record.

Before a rollback, the owner must review these constraints:

- The target release manifest must bind the LKG commit and its static artifact set.
- The route lifecycle must not restore contradictory legacy product or legal
  content. Retired `/terms`, `/privacy`, and `/cookies` routes remain safely
  retired unless an owner-approved canonical legal source is released.
- The owner decides and records whether cache invalidation is required. Codex
  does not purge a cache or infer that downstream clients have refreshed.
- If observation-adapter or verification-key metadata changes, record the
  source and target key IDs, canonical payload version, continuity-store
  compatibility, and key-rotation decision. A rollback must not silently
  create replay, equivocation, or retired-key reuse risk.

After an authorised deployment or rollback, run the same read-only public checks against the canonical host and retain results externally:

```bash
npm run audit:live-release -- --url https://fenrua.ai --expected-commit <40-character-commit> --expected-record-sha256 <record-digest>
npm run audit:live-routes -- --url https://fenrua.ai
npm run audit:live-search-surface -- --url=https://fenrua.ai
```

Store preview, production, rollback, cache-decision, and post-rollback audit evidence in the owner-designated external audit location. Do not commit provider exports, logs, screenshots, temporary output, credentials, server-environment values, or protected provider internals to the public repository.
