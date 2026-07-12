# Vercel Publishing

Canonical production domain: `fenrua.ai`

Canonical Vercel project: `fenrua-commons`

Node runtime: `24.x`

## Project Settings

Use these settings for the existing Vercel project:

- Project: `fenrua-commons`
- Framework preset: `Other`
- Root directory: repository root
- Node.js version: `24.x`
- Build command: automatic/static
- Output directory: automatic/static
- Install command: automatic
- Production branch: `main`
- Production domain: `fenrua.ai`

## Domain

In Vercel, open the project, go to **Settings -> Domains**, and add:

- `fenrua.ai`

Optionally add `www.fenrua.ai` and redirect it to `fenrua.ai`.

## Notes

`vercel.json` keeps clean URLs, security headers, cache headers, and stable
short routes for `/audit`, `/genesis`, and `/regression`.

Do not add analytics, pixels, session replay, remote embeds, or third-party
tracking scripts.

## Publish From WSL

Use Node 24:

```bash
npm run deploy:production:node24
```

The script deploys production to `fenrua-commons`, which aliases production to
`fenrua.ai`.
