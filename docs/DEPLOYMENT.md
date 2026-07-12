# Deployment Notes

`fenrua-web` is the canonical static website for `fenrua.ai`.

## Vercel

Use Vercel as the production deployment for `fenrua.ai`.

See [Vercel Publishing](VERCEL.md).

## Evidence Sync

The public status fields live in `kernel-status.js`. A future CI task can update
that file from the latest `fenrua-kernel` commit metadata before publishing.

No analytics, pixels, remote embeds, or third-party scripts are required.
