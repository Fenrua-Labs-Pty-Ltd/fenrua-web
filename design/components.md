# Fenrua Public Components

Status: Active public-interface catalogue v0.1
Owner: Public Platform
Last reviewed: 2026-07-14

| Component | Purpose | Truth boundary |
| --- | --- | --- |
| Header and primary navigation | Establish product identity and route access. | Navigation is not a capability claim. |
| Route hero | State a page's purpose, current boundary, and next inspection path. | Never presents an unavailable feature as a launch surface. |
| Current-state strip | Separates public release, planned product, hosted-service, and observation states. | Each value must link to a record or stated limitation. |
| Capability matrix | Shows maturity, availability, interface, limitation, and next gate. | Generated from the canonical capability register. |
| Decision flow | Explains the reference `Request -> Evaluate -> Decide -> Record -> Verify` sequence. | It is a specification until a released Trust Gate provides an interface. |
| Evidence proof grid | Links exact release, claim, limitation, and reproduction records. | Links are evidence entry points, not a certification badge. |
| Architecture diagram | Presents labelled system planes and an adjacent text equivalent. | State labels distinguish current, reference, planned, optional, and external nodes. |
| Record card and table | Make technical records scannable on desktop and mobile. | Values retain their source and limitation context. |
| Status row | Shows text, icon, and semantic colour for a verified status. | Green requires a verified current success; loading and unavailable remain neutral. |
| Limitation and non-claim box | Keeps the boundary adjacent to the subject. | It cannot be hidden behind interaction or hover state. |
| Release record | Binds a static artifact set to a source commit and validation scope. | It never implies runtime attestation. |

The future authenticated console is not part of this public site. It requires a
separate ADR and product boundary.
