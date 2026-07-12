# Fenrua V2 UX Report

Status: V2 UX review  
Last reviewed: 2026-07-13

## Improvements

- Homepage density was reduced to five reviewer questions.
- Deep technical content moved to dedicated routes.
- Toolchain no longer depends on client-side loading to show rows.
- Verifier, developer, evidence, and status experiences are separate.
- Route navigation uses plain labels rather than unexplained branded labels.

## Reviewer Paths

| Reviewer | Primary Route |
| --- | --- |
| Security engineer | `/kernel/`, `/evidence/`, `/status/` |
| AI infrastructure architect | `/architecture/`, `/developers/` |
| Cryptographer | `/research/`, `/evidence/` |
| Developer relations | `/developers/`, `/verify/` |
| Open-source maintainer | `/toolchain/`, `/docs/FENRUA_TOOLCHAIN_LOCK.md` |
| Accessibility specialist | `/docs/FENRUA_V2_ACCESSIBILITY_REPORT.md` |
| Performance engineer | `/docs/FENRUA_V2_PERFORMANCE_REPORT.md` |

## Remaining Gap

The current design is static documentation. It does not include site-wide fuzzy
search or a full docs sidebar.

