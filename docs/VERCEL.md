# Vercel Publishing Boundary

`fenrua.ai` is served by the existing Vercel project for `fenrua-web`.

The public repository does not store Vercel tokens, provider credentials, `.vercel` state, production deployment CLI wiring, or protected deployment secrets.

Website changes are not published directly by CSA, the founder, or ad-hoc repository edits. All updates, including founder-requested updates, pass through SAE-owned release control.

The allowed public repository path is:

1. bounded SAE-owned branch;
2. bounded pull request;
3. `Validate public surface` passing;
4. SAE-controlled merge or release action;
5. production watch;
6. live-domain verification;
7. clean handoff.

Vercel preview/build status is useful deployment signal, but it is not publishing authority and must not be the required control that blocks README/docs-only repository updates.

Production secrets and protected provider operations remain outside the public repository.
