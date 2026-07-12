# Fenrua V2 Architecture Report

Status: V2 route-separation report  
Last reviewed: 2026-07-13

## Change

The public site is no longer a single encyclopedia page. The architecture is
split into standalone routes:

- `/architecture/`
- `/kernel/`
- `/utilities/`
- `/research/`
- `/verify/`
- `/developers/`
- `/toolchain/`
- `/evidence/`
- `/status/`

## Evidence

- `scripts/generate-static-routes.mjs` generates the static route set.
- `scripts/test-static-routes.mjs` asserts required route landmarks.
- `sitemap.xml` includes the standalone routes.

## Remaining Gap

The route system is static and intentionally simple. It is not a dynamic docs
platform with server-rendered per-request content.

