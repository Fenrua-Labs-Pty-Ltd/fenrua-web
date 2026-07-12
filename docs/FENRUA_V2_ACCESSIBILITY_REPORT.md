# Fenrua V2 Accessibility Report

Status: manual accessibility report  
Target: WCAG 2.2 AA  
Last reviewed: 2026-07-13

## Manual Verification

| Area | Evidence | Result |
| --- | --- | --- |
| Keyboard | Skip link, focus-visible styles, native links/buttons | Pass by inspection |
| Focus | Buttons and links have visible focus states | Pass by inspection |
| Zoom | Responsive grids collapse at narrow widths | Pass by inspection |
| Screen readers | Semantic `main`, `nav`, headings, tables, labels | Pass by inspection |
| Reduced motion | `prefers-reduced-motion` disables animation/transition | Pass by inspection |
| Mobile | CSS reflows major grids to single column | Pass by inspection |
| Tables | Header cells and scoped row/header semantics are used | Pass by inspection |

## Remaining Limitations

- Automated screen-reader testing was not run.
- Browser-based Playwright accessibility coverage is still unavailable in this
  environment.
- Color contrast was reviewed against the existing palette by inspection, not by
  an external contrast scanner.

