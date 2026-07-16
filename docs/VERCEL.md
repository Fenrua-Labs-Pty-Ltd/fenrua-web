# Vercel Publishing

Canonical production domain: `fenrua.ai`

Canonical Vercel project: `fenrua-web`

Node runtime: `24.x`

Owner and GitHub release validation use exact Node `24.18.0` and npm
`11.18.0`. Vercel exposes only a managed major-version selector, so a Vercel
build is accepted only when `VERCEL=1`, `VERCEL_GIT_COMMIT_SHA` is a valid
40-character commit, and the managed runtime remains on Node `24.x` and npm
`11.x`. The release manifest binds the resulting static artifact set to that
commit and explicitly does not claim runtime attestation.

## Project Settings

Use these settings for the existing Vercel project:

- Project: `fenrua-web`
- Framework preset: `Other`
- Root directory: repository root
- Node.js version: `24.x`
- Install command: `npm ci --omit=dev`
- Build command: `npm run build:release`
- Output directory: `public` (generated deterministically by the release build)
- Production branch: `main`
- Production domain: `fenrua.ai`

The Vercel Git integration supplies the checked-out, approved commit as
`VERCEL_GIT_COMMIT_SHA`. Enable Vercel's system environment variables for Git
builds. The generated public release
manifest binds only the listed public static artifacts to that source commit;
it never prints credentials, project identifiers, or protected operational
data.

`vercel.json` is non-secret, reviewable deployment configuration and remains at
the project root because Vercel loads project configuration from there. Local
CLI linkage metadata such as `.vercel/project.json` is not a deployment
artifact, is excluded from upload, and is rejected by the public-source secret
boundary. Non-interactive tooling must use externally supplied
`VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` values so no local linkage file is
required in this repository.

## Domain

In Vercel, open the project, go to **Settings -> Domains**, and add:

- `fenrua.ai` as the canonical production domain
- `www.fenrua.ai` as an alias; the committed host-specific redirect sends every
  `www` request permanently to `https://fenrua.ai`

The stable `fenrua-web.vercel.app` hostname also redirects to the canonical
domain. Branch and unique preview hostnames remain inspectable for release
review and receive `X-Robots-Tag: noindex, nofollow, noarchive`.

Do not add project IDs, organisation IDs, credentials, tokens, or other project
internals to this repository.

## Notes

`vercel.json` keeps clean URLs, security headers, cache headers, the current
`/audit` route, and redirects for superseded `/genesis` and `/regression`
routes. Release evidence is limited to the public static artifacts listed in
the generated release manifest; it does not attest to protected systems or live
block-card data.

Do not add analytics, pixels, session replay, remote embeds, or third-party
tracking scripts.

The site provides access-only technology services through tiered subscriptions
and client-specific business agreements. See the
[access-only commercial boundary](ACCESS_ONLY_COMMERCIAL_BOUNDARY.md); this
repository must not describe a token, investment, exchange, trading, or
financial-return product.

## Validate From WSL and Publish Through Git

Use Node 24 from a clean checkout of the owner-approved source. The baseline
directory is an owner-approved external record for the pinned visual-rendering environment:

```bash
npm ci
FENRUA_VISUAL_BASELINE_DIR=/absolute/external/approved-visual-baseline npm run release:production-check
```

After review, merge or push that exact approved commit to the protected `main`
branch. The existing Vercel Git integration deploys it to `fenrua-web`; Vercel's
system `VERCEL_GIT_COMMIT_SHA` binds the remote build to the source revision.
The repository deliberately has no Vercel CLI dependency. Browser testing stays
outside the Vercel build because Vercel installs production dependencies only.

For an explicitly owner-authorized release PR, whether ready for merge or
already merged, use the guarded Node 24 command:

```bash
FENRUA_VISUAL_BASELINE_DIR=/absolute/external/approved-visual-baseline \
  npm run deploy:production:node24 -- --pr <number> --confirm-production

# For a PR already merged through GitHub, supply the parent of its recorded squash merge commit.
FENRUA_VISUAL_BASELINE_DIR=/absolute/external/approved-visual-baseline \
  npm run deploy:production:node24 -- --pr <number> --previous-main-sha <parent-of-recorded-squash-merge-commit-sha> --confirm-production
```

The owner-approved out-of-repository visual baseline path is private custody
metadata. The production command verifies the baseline but must not print the
raw path in routine output. Do not commit, upload, or paste baseline files,
screenshots, captures, local paths, credentials, provider internals, or private
evidence artifacts into the repository or public reports.

It requires a clean checkout matching the ready PR head before merge, or a
clean worktree for an already-merged PR. Both paths require passing PR checks,
an owner-approved out-of-repository visual baseline, and an explicit
confirmation flag. The already-merged path additionally requires
`--previous-main-sha`; its value must equal the parent of the recorded
single-parent squash merge commit, and `main` must still equal that exact merge
commit. It runs the release check and strict visual comparison. For a ready PR
it squash-merges the exact head through GitHub; for an already-merged PR it
verifies the remote deployment of the exact recorded main commit. Both paths
refuse if, after synchronising main, it is not the PR's recorded merge commit,
then wait for the matching Vercel Git production deployment and retry the
read-only live release audit while the canonical alias propagates. It never
stores provider credentials, changes domains or environment variables, purges
caches, or promotes previews.

After deployment, observe the public static artifact set without writing to
the deployment:

```bash
RECORD_SHA256=$(node -p "require('./.well-known/fenrua-release.json').integrity.recordSha256")
npm run audit:live-release -- --url https://fenrua.ai --expected-commit <40-character-commit> --expected-record-sha256 "$RECORD_SHA256"
```

Retain that command's receipt with the release record. It is an observation at
a point in time, not an assertion about live cards, APIs, protected systems, or
future alias state.

## Preview and production gates

The deployment command never runs the Vercel CLI, changes domains or environment
variables, purges caches, or promotes previews. It is an owner-authorized Git release
path only: its explicit confirmation flag is an intentional local guard, not a
substitute for owner approval. A local release check is necessary source evidence, not
a preview or production verification.

Before the owner authorises a preview, record outside this repository:

1. the exact approved commit;
2. the independently retained release-record digest;
3. the designated last-known-good (LKG) commit and release-manifest reference;
4. the expected route-lifecycle revision and legal-route state.

The human preview gate verifies the exact commit and record digest, current
routes and redirects, cache headers, canonical and noindex alias behaviour,
the public release audit, and browser failure states. The owner may authorise a
production deployment only when the preview evidence is bound to the same
commit and manifest. Until that happens, source work is code-complete but
production-unverified.

## Rollback and external cleanup

A rollback is an owner decision to restore the designated LKG commit through
the approved hosting control plane. Do not select an arbitrary older deployment
or treat a recently successful build as LKG without the source-bound manifest
and owner record.

Before a rollback, the owner must review these constraints:

- The target release manifest must bind the LKG commit and its static artifact
  set.
- The route lifecycle must not restore contradictory legacy product or legal
  content. Retired `/terms`, `/privacy`, and `/cookies` routes remain safely
  retired unless an owner-approved canonical legal source is released.
- The owner decides and records whether cache invalidation is required. Codex
  does not purge a cache or infer that downstream clients have refreshed.
- If the observation adapter or verification-key metadata changes, record the
  source and target key IDs, canonical payload version, continuity-store
  compatibility, and key-rotation decision. A rollback must not silently
  create replay, equivocation, or retired-key reuse risk.

After the owner performs the rollback, a human runs the same read-only public
checks against the intended canonical host and retains results externally:

```bash
npm run audit:live-release -- --url https://fenrua.ai --expected-commit <lkg-commit> --expected-record-sha256 <lkg-record-digest>
npm run audit:live-routes -- --url https://fenrua.ai
npm run audit:live-search-surface -- --url=https://fenrua.ai
```

Store preview, production, rollback, cache-decision, and post-rollback audit
evidence in the owner-designated external audit location. Do not commit audit
reports, provider exports, logs, screenshots, or temporary output to this
repository. Keep `www.fenrua.ai` only as a redirect to `https://fenrua.ai`,
never as a second content site. Do not record credentials, server-environment
values, or protected provider internals in this repository.
