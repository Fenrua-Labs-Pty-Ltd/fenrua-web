# Dependency License Inventory

This inventory covers the exact development dependency closure used to validate
the public website. It is not a legal opinion or a substitute for a release
review. Package versions remain pinned in `package-lock.json`.

| Package | Exact version | License | Public validation role |
| --- | --- | --- | --- |
| `@axe-core/playwright` | `4.12.1` | MPL-2.0 | Route-wide automated accessibility analysis. |
| `@playwright/test` | `1.61.1` | Apache-2.0 | Browser, responsive, and JavaScript-disabled validation. |
| `playwright` | `1.61.1` | Apache-2.0 | Browser automation runtime required by `@playwright/test`. |
| `playwright-core` | `1.61.1` | Apache-2.0 | Browser automation core required by `playwright`. |

The public static runtime has no third-party browser script dependency. Review
new direct dependencies, their licenses, exact lockfile entries, and their
public-output impact before adding them to the release path.
