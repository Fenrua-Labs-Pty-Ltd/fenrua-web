# Fenrua V2 Performance Report

Status: static performance evidence  
Targets: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1  
Last reviewed: 2026-07-13

## Static Evidence

| Surface | Evidence |
| --- | --- |
| Runtime | Plain static HTML/CSS/JS |
| Remote scripts | None |
| Hydration | None |
| Toolchain route | Server-rendered rows; JS is progressive enhancement |
| Layout shift | Stable grid/table/card dimensions and no remote media |
| Input delay | Small local JS for filter/pagination/copy only |
| Cache policy | Static assets immutable; docs/data short-cache |

## Measured Local Artifacts

The generated routes are static files. The registry is `data/toolchain-registry.json`
and the toolchain page embeds table rows to avoid empty-loading states.

## Remaining Limitations

- Lighthouse or Web Vitals were not run in this environment.
- Real-user LCP/INP/CLS data is not collected because the site has no tracker.
- The target is architecturally supported but not externally measured here.

