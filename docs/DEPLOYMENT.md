# Deployment Notes

`fenrua-web` is intentionally static.

## Local Preview

Open `index.html` directly in a browser.

No package install or build step is required.

## GitHub Pages

1. Create a GitHub repository named `fenrua-web`.
2. Push this folder to the `main` branch.
3. Enable Pages from the branch root.
4. Point `fenrua.ai` at the published Pages target.

## Evidence Sync

The public status fields live in `kernel-status.js`. A future CI task can update
that file from the latest `fenrua-kernel` commit metadata before publishing.

No analytics, pixels, remote embeds, or third-party scripts are required.
