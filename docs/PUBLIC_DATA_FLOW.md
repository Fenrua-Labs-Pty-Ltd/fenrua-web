# Public Data Flow

## Scope

This is a source-bound inventory of the public website flows implemented in
this repository. It is not a privacy notice, legal-role determination,
retention schedule, or statement about provider configuration beyond the
source-controlled implementation. Unknowns remain explicit until an owner and,
where needed, legal review supplies approved evidence.

## Normal Page Request

| Field | Current source-bound statement |
| --- | --- |
| Data | A browser request can carry a path, method, time, HTTP headers, network address, and query string. Public pages themselves contain static public content. |
| Purpose | Deliver a requested public static route or asset. |
| Processor/controller boundary | Visitor browser -> approved hosting/CDN platform -> Fenrua Labs public website operation. This is a technical boundary, not a legal-role classification. |
| Storage | Static public artifacts are deployed through the configured static output. Provider request-log handling is not defined by this repository. |
| Retention state | Static artifacts are retained only through the active release and rollback process; provider log retention is not documented here. |
| Exposure | Public page content is visible to a requester. Provider and owner-authorised operational access to request metadata requires separate provider and owner evidence. |
| User action | Open a public route. Do not put secrets, private evidence, or vulnerability details in a URL or query string. |
| Source/evidence | [Vercel configuration](../vercel.json), [public output staging](../scripts/public-output-lib.mjs), and [external artifact policy](EXTERNAL_ARTIFACT_POLICY.md). |
| Unknowns needing owner/legal review | Provider log fields, retention, access controls, jurisdictional handling, and legal-role disclosures. |

## CDN and Hosting Metadata

| Field | Current source-bound statement |
| --- | --- |
| Data | Delivery metadata may include network address, requested path, time, user-agent, referer, headers, and cache-related headers. Exact provider log fields are not asserted. |
| Purpose | Route, cache, protect, and deliver public static content. |
| Processor/controller boundary | Visitor browser -> hosting/CDN service configured for the public site -> Fenrua Labs public operation. No private topology is disclosed. |
| Storage | The repository defines cache headers for public artifacts; provider cache and log storage details are not represented as public facts. |
| Retention state | Cache directives are source-controlled; provider metadata retention is not documented here. |
| Exposure | Public assets are public. Metadata access is limited by the hosting provider and owner-approved operational controls, which require external evidence. |
| User action | Request a public route or asset. |
| Source/evidence | [Vercel configuration](../vercel.json) and [route lifecycle register](../data/route-lifecycle.json). |
| Unknowns needing owner/legal review | Provider retention, log access, support access, cross-border handling, and legal-role disclosures. |

## Signed Observation Endpoint and Abuse Control

| Field | Current source-bound statement |
| --- | --- |
| Data | `/api/chain-progress` reads a request address from forwarding, real-IP, or socket headers only to derive a salted SHA-256 in-memory abuse-control key. It does not return that address. Bounded observation responses contain only the allowlisted public fields. |
| Purpose | Enforce a per-instance request limit before serving a signed, read-only observation result or a fail-closed unavailable state. |
| Processor/controller boundary | Browser -> public observation adapter -> server-only signed-observation gateway and continuity store. The browser is never forwarded to JSON-RPC or private mesh transport. |
| Storage | The adapter retains a salted in-memory rate-limit entry for a 60-second window and caps the map at 10,000 entries. Durable continuity state is server-only and its provider configuration is not public. |
| Retention state | The in-memory abuse-control key expires after its configured 60-second window; durable continuity-store retention is not documented in public source. |
| Exposure | The adapter exposes only bounded public observation data and public verification metadata. It does not expose gateway URLs, read tokens, peer details, raw address values, or signing keys. |
| User action | Request the public status surface. A failed signature, stale state, replay, equivocation, or unavailable configuration must not produce a current live claim. |
| Source/evidence | [Observation adapter](../api/chain-progress.js), [continuity control](../server/observation-continuity.js), and [public observation gateway boundary](PUBLIC_OBSERVATION_GATEWAY.md). |
| Unknowns needing owner/legal review | Hosting logs, durable-store retention, configured gateway operator, incident handling, and legal-role disclosures. |

## Business Enquiries

| Field | Current source-bound statement |
| --- | --- |
| Data | A message sent to `partnerships@fenrua.ai` can include sender contact details, message content, attachments, and transport metadata. |
| Purpose | Handle business and collaboration enquiries within the published public service boundary. |
| Processor/controller boundary | Sender mail client -> email service used for the published inbox -> Fenrua Labs recipients. This document does not assign legal roles. |
| Storage | The mail service and authorised recipients may handle the message; mailbox implementation and storage location are not public facts in this repository. |
| Retention state | Not documented in the approved public source. |
| Exposure | Intended recipients and the mail service can process the message. Do not send private keys, credentials, raw witness material, or sensitive vulnerability details. |
| User action | Send a business enquiry or use the [support boundary](../support). |
| Source/evidence | [Company identity record](../data/company-identity.json) and [support route generator](../scripts/generate-static-routes.mjs). |
| Unknowns needing owner/legal review | Mailbox provider, recipient access, retention, attachment handling, and legal-role disclosures. |

## Vulnerability Reporting

| Field | Current source-bound statement |
| --- | --- |
| Data | A reporter can provide affected revision, reproduction steps, observed impact, and minimum validating evidence through a private GitHub security advisory flow. |
| Purpose | Receive potentially exploitable findings without exposing users, protected systems, or private material in public channels. |
| Processor/controller boundary | Reporter -> GitHub private security advisory flow -> repository security recipients. This document does not assign legal roles. |
| Storage | GitHub's private advisory mechanism is the published channel; exact recipient membership and retention are not declared here. |
| Retention state | Not documented in the approved public source. |
| Exposure | Intended for configured private security recipients and GitHub handling. Public issue forms are not for exploit material. |
| User action | Use the [website private vulnerability report](https://github.com/Fenrua-Labs-Pty-Ltd/fenrua-web/security/advisories/new) for website or observation-gateway findings. |
| Source/evidence | [Security reporting route](../security/index.html) and [security.txt](../.well-known/security.txt). |
| Unknowns needing owner/legal review | Recipient membership, notification, storage, retention, coordinated disclosure process, and legal-role disclosures. |

## GitHub Contribution Channels

| Field | Current source-bound statement |
| --- | --- |
| Data | Public issue and contribution channels can receive submitted text, revision references, reproduction steps, environment details, and public-safe evidence. |
| Purpose | Support reproducible bug reports, feature discussion, documentation improvements, and public-safe technical collaboration. |
| Processor/controller boundary | Contributor -> GitHub repository service -> repository maintainers. This document does not assign legal roles. |
| Storage | Public issue and repository content are handled by GitHub according to repository settings; exact retention is not stated here. |
| Retention state | Not documented in the approved public source. |
| Exposure | Public repository content may be publicly visible. Sensitive vulnerability details, credentials, and private topology must use the private reporting path instead. |
| User action | Use the published repository and choose a public-safe channel appropriate to the contribution. |
| Source/evidence | [Fenrua Labs GitHub profile](https://github.com/fenrualabs) and the [repository contribution guidance](../README.md). |
| Unknowns needing owner/legal review | Moderation, maintainer access, notification, retention, search indexing, and legal-role disclosures. |

## Social Profile Links

| Field | Current source-bound statement |
| --- | --- |
| Data | Following a profile link can send ordinary navigation metadata from the browser to the destination service. The public site does not load those services as runtime scripts. |
| Purpose | Link to the verified public GitHub, X, and LinkedIn profiles listed in the company identity record. |
| Processor/controller boundary | Visitor browser -> external social service selected by the visitor. Fenrua Labs public pages do not proxy those requests. |
| Storage | Destination-service storage and retention are outside this repository's evidence boundary. |
| Retention state | Not documented in the approved public source. |
| Exposure | The destination service can receive navigation metadata under its own controls. |
| User action | Select a visible profile link and review the destination service before interacting there. |
| Source/evidence | [Company identity record](../data/company-identity.json). |
| Unknowns needing owner/legal review | Destination-service data handling, account access, tracking, retention, and legal-role disclosures. |

## Browser Storage

| Field | Current source-bound statement |
| --- | --- |
| Data | The tracked public scripts do not use cookies, localStorage, sessionStorage, IndexedDB, or browser database APIs for the current public estate. |
| Purpose | No browser-storage feature is required for the current static routes or bounded observation monitor. |
| Processor/controller boundary | No browser-storage service boundary is implemented by the current public source. |
| Storage | No application-controlled browser storage is identified in the tracked public scripts. This does not make a claim about browser, extension, or hosting-provider behaviour. |
| Retention state | No application-controlled browser-storage retention is defined. |
| Exposure | No application-controlled browser-storage reader is implemented in the tracked public scripts. |
| User action | No consent or storage-setting action is required by the current public code. |
| Source/evidence | [Technical data script](../technical-data.js), [status monitor](../status-monitor.js), and [observation script](../kernel-status.js). |
| Unknowns needing owner/legal review | Provider cookies, browser features, future keys, user controls, and any legal disclosure requirement. |

## Future Local File Handling

| Field | Current source-bound statement |
| --- | --- |
| Data | The planned Local Trust Gate has no public implementation, CLI, SDK, API, hosted interface, or release artifact in this repository. No current website file-upload or local-file workflow is exposed. |
| Purpose | A future separate product may define a local workflow, but its exact file handling cannot be inferred from this public website. |
| Processor/controller boundary | No current file-selection, upload, or local-processing boundary is implemented here. |
| Storage | No current website file storage or temporary processing is implemented. |
| Retention state | No current website file-retention behaviour is defined. |
| Exposure | No current website upload or file-sharing interface exists. |
| User action | Do not treat a schema, example, or planned capability record as a file-processing service. |
| Source/evidence | [Capability register](../data/capability-register.json) and [claim register](../data/claim-register.json). |
| Unknowns needing owner/legal review | Future product repository, file types, local versus remote processing, storage, deletion, and legal disclosures. |

## Hosted API Boundary

| Field | Current source-bound statement |
| --- | --- |
| Data | The only public dynamic endpoints in this repository are the bounded observation adapter and public verification-key metadata endpoints. They do not accept user uploads, transactions, public RPC forwarding, or administrative commands. |
| Purpose | Serve a bounded signed observation result and matching public verification metadata under fail-closed checks. |
| Processor/controller boundary | Browser -> public API route -> server-only configuration and bounded gateway/continuity dependencies. |
| Storage | Request abuse-control entries are temporary in-memory data; continuity storage is server-only. No general-purpose public API datastore is claimed. |
| Retention state | Observation adapter in-memory rate-limit entries use the configured 60-second window; other provider and continuity retention is not documented here. |
| Exposure | Responses are allowlisted public fields or fail-closed error states. Credentials, private endpoints, and signing material are never returned. |
| User action | Use only documented `GET` observation and verification-key routes through the public website status surfaces. |
| Source/evidence | [API route configuration](../vercel.json), [observation adapter](../api/chain-progress.js), and [key endpoint](../api/chain-observation-key.js). |
| Unknowns needing owner/legal review | Provider logs, durable continuity retention, availability commitments, abuse incident process, and legal-role disclosures. |

## Change Control

Before a new form, mailbox, social integration, browser-storage feature, file
handler, or public API is released, update this inventory from source evidence,
run the public data-flow test, and obtain the relevant owner and legal review.
Do not turn an unverified future capability into a privacy, security, or service
assurance claim.
