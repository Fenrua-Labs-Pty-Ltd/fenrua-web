# MIP-S0.6 Protected Canary Output-Path Coverage

**Status:** CI-tested synthetic canary coverage

This record defines the S0.6 test corpus for protected public-output classes.
It contains no real confidential value, endpoint, credential, key, provider
detail, topology, treasury mapping, activation value, recovery fact, or
Document 3 value.

## Test invariant

Every canary is a unique, deliberately invalid, plainly synthetic test marker.
It is not a credential format and is marked as unsafe for use. The corpus lives
in a test-only script and must never occur in a release-bound public artifact.

`npm run check:protected-canaries` proves that each corpus category is rejected
by each bounded dynamic response contract and is detected when introduced into a
synthetic static-output candidate. The same check verifies that no marker occurs
in the current release-bound static artifact inputs.

## Covered protected categories

- credentials, API tokens, private keys, signing keys, and recovery keys;
- private endpoints, provider/control-plane details, node topology, peers,
  validators, private-chain wiring, private routes, and private mesh details;
- checkpoint values, activation profiles, treasury mappings, and settlement
  routes;
- sensitive legal records, Document 3 values, private-operations metadata,
  visual baselines, external audit reports, and private captures;
- stack traces, raw exceptions, and private operator source paths.

## Output-path coverage

| Output family | S0.6 test boundary |
| --- | --- |
| Static HTML and metadata | Synthetic marker scan and release-bound artifact-input scan |
| Static documents | Synthetic marker scan and release-bound artifact-input scan |
| Public JSON records | Synthetic marker scan and release-bound artifact-input scan |
| Well-known records | Synthetic marker scan and release-bound artifact-input scan |
| Public static assets | Synthetic marker scan and release-bound artifact-input scan |
| Chain-progress API | Public disclosure-contract rejection test |
| Public observation-key API | Public disclosure-contract rejection test |
| Public N521 observation-key API | Public disclosure-contract rejection test |
| Stable public error payload | Public disclosure-contract rejection test |

## Boundary

A successful canary test shows only that the reviewed CI checks reject the
synthetic protected corpus. It is evidence-input-only: it does not assert Stage
0 PASS, production readiness, certification, tenant availability, or protected
infrastructure health.
