**Sats in the Sun — repository review and end-to-end experience plan**

Reviewed November 11, 2026 · America/Phoenix

**Recommendation:** Make this the easiest way to choose a nearby Bitcoin business with a clear understanding of payment acceptance, reach it, and help the next visitor. Prioritize successful outings, trustworthy information, and continuity between screens. Preserve the warm visual identity and the account-free experience.

The ten enhancements below are the recommended product backlog, in priority order. The ordering is a judgment based on observed friction, data integrity, reach, and implementation dependencies. User-preference ranking and competitive advantage still need validation through the release gates below.

**Scope and evidence**

The review covered the repository's 99 tracked files as an inventory, all first-party application modules, markup and styles, backend intake and storage, import/review scripts, tests, deployment workflows, contribution policies, research methodology, and data structures. Every catalog record went through the existing structural/geographic validation. The archived upstream snapshot's digest matches the documented digest.

The browser review used the local app in Chromium at 1280 × 720, 390 × 844, and 320 × 568, with light and dark themes. Journeys exercised included search, category filters, location selection without GPS, saved places, listing details, report-form presentation, a three-stop trail and route preview, and the state directory. These are selected browser checks, not physical-device or screen-reader certification. No actual merchant purchases, exhaustive source-link rechecks, or production submissions were performed. Vendored library internals and generated geographic/snapshot data were inventoried rather than independently audited line by line.

The local checkout is be891b0f89f09485bf5fec6e9e7cb76527bd5885. Remote main was also checked: c3e9d78b1c6cb0bd96d19f24d5b5de1a99e5b21e is one commit ahead and changes only Node version pins in three workflows. Its application and catalog match the reviewed checkout. Implementation should start from the current remote main. An open dependency-update PR was found; no open experience implementation PR was found.

The 54 Node tests, Python national-policy checks, and validation of all 9,452 merchants passed. The initial combined check could not bind its loopback HTTP server inside the sandbox; the same Pages subpath smoke check passed when rerun with loopback binding permitted. Worker deployment and live moderation were not exercised.

Machine-readable measurements and limitations are in [the baseline](../../docs/ux/2026-11-11-baseline.json).

**What to retain**

- The recognizable ivory, forest, and Bitcoin-orange palette, useful map/list pairing, selected-pin handling, and responsive sheet.
- Free browsing without an account, permission-aware location fallback, local favorites, stable merchant IDs, and origin-free shared trails.
- Honest source links, distinctions between merchant statements and visitor claims, and explicit limitations on acceptance.
- Durable anonymous intake, bounded inputs, quotas, deduplication, human approval, protected data-only PRs, and deployment checks.
- The static hosting model, small vanilla JavaScript application, and open-data attribution. A framework or map-engine replacement is not justified by this review.

**Observed issues that drive the priorities**

| Evidence | What was observed | User consequence |
| --- | --- | --- |
| Discovery UI | Mobile map mode hides the search field inside Filters. Desktop puts six selects, category controls, a large introduction, and the location banner before useful card content. | The most common task starts with finding the interface. |
| Search experiment | Typing “coffee Chicago” returned one place; searching “Chicago” and selecting Coffee returned seven. Search is one substring over concatenated fields. | Equivalent intent produces very different results. |
| State directory | Searching Chicago retained all 51 state/DC sections, including 47 empty sections labelled as coverage gaps. The Illinois section correctly showed 69 matching records. | Relevant results are buried, and a filtered mismatch is confused with missing geographic coverage. |
| Geography | The global city dropdown contains 3,055 city names; 333 occur in multiple states. Springfield spans seven states. | A city name alone is ambiguous, and a long native dropdown is hard to scan. |
| Default relevance | The national root still favors named Scottsdale businesses; its only preset trail is Scottsdale. | The first impression is local to Arizona despite national positioning. |
| Saved places | After saving one Chicago business and retaining other geographic/search filters, Saved places showed a count of one but zero results and a generic reset. | A saved place appears lost. Reset also exits the saved-only mode. |
| Navigation/state | Selection uses replaceState; filters, DOM controls, URL, map bounds, selection, and panel mode are updated separately. A previous ?state=AZ survived reset and a subsequent Chicago nearby flow in the browser. | Reload, sharing context, Back, and changing views cannot be assumed to describe the same state. |
| Keyboard continuity | After a saved-place toggle rebuilt the cards, document focus was BODY in the browser observation. | Keyboard users can lose their place after a routine action. |
| Merchant decisions | At 390 px, the selected detail panel was about 394 px tall with 792 px of scroll content. Route preview is primary; the evidence date and reporting controls are lower down. | The action hierarchy emphasizes a preview before payment readiness. |
| Catalog | 8,992 of 9,452 listings are community-dated; 446 use merchant-source evidence and 14 retain original-article evidence. As of this review, 177 community dates are over 365 days old. | Import-time freshness ages without a visible freshness policy. This does not mean those merchants stopped accepting Bitcoin. |
| Payment feedback | There are zero published lastPayment, latestPaymentReport, or paymentNotes fields in the current catalog. | The feedback feature exists, but recent successful-spend evidence is not yet populated. Other source summaries do contain conditions. |
| Richness | 6,623 listings have websites, 7,527 have phone numbers, and the catalog has no opening-hours field. | “Open now,” call-ahead, and payment instructions cannot be promised uniformly. |
| Import fixture | In an isolated temporary fixture, a removed listing reappeared on import while its removal ledger entry remained. | A reviewed closure or withdrawn-acceptance decision can be undone by a later refresh. This was a fixture reproduction, not an observed live resurrection. |
| Provenance fixture | A second isolated fixture changed maintainer-reviewed provenance to merchant-confirmed when matching primary research was imported. | Human review history and acceptance evidence need explicit ownership and precedence. |
| Contribution operations | [Issue #16](https://github.com/hotpixelgroup/bitcoin-biz-map/issues/16) remained open with needs-review and no comments. Its suggestion was received October 20; prepared JSON has a street fragment in city and an empty category. | Form-to-review translation still requires manual repair. One issue is evidence of this case, not a measured queue-wide SLA. |
| Payload | merchants.json is 7,585,064 bytes; local gzip estimation is 900,221 bytes. Both pages fetch the full catalog. | A large shared dependency gates discovery. These are file measurements, not production transfer or mobile latency measurements. |
| Accessibility | The light hero's orange text, #f7931a on #f7f7f2, has a calculated contrast of 2.14:1. | It misses the 3:1 requirement for large text. Small 8–12 px metadata also needs usability review, though small size alone is not a WCAG failure. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). |

Key implementation evidence: [filtering and rendering](../../dist/app.js#L19), [details and state transitions](../../dist/app.js#L85), [bootstrap and filtering events](../../dist/app.js#L121), [mobile sheet rules](../../dist/styles.css#L25), [submission lifecycle](../../dist/community.js#L51), [national merging](../../scripts/national-directory.py#L100), and [review application](../../scripts/map-review.mjs#L103).

**Competitive direction**

These are current first-party capability references checked on November 11, not an exhaustive hands-on competitor benchmark. A missing feature on a public page does not prove its absence.

| Reference product | Documented strength | Implication for this roadmap |
| --- | --- | --- |
| BTC Map | Open merchant data and apps; its October update describes place photos, personal map notes, and continuing verification work. | Reusing the same source and adding pins is insufficient differentiation. Focus on converting evidence into useful visit decisions. [BTC Map](https://btcmap.org/), [October update](https://blog.btcmap.org/posts/2026-10/). |
| Mapping Bitcoin | Merchant ownership verification, Nostr reviews, ratings, photos, and payment/category filters; contributions use a Nostr identity. | Reviews and verification badges already exist elsewhere. Explain exactly what ours establish, and make a useful report possible without an identity setup. [Product and FAQ](https://mappingbitcoin.com/). |
| BitLocal | Rich merchant details, city alerts, category search, sharing, and a privacy-focused native experience. | Attractive design, nearby discovery, and privacy are expected quality, not unique claims. Browser accessibility and low-friction recovery can strengthen our combined experience. [BitLocal](https://www.bitlocal.app/). |
| Cash App Bitcoin Map | Nearby merchant discovery and directions integrated with its payment experience. | Do not attempt to build another wallet. Make wallet-independent payment preparation and navigation excellent. [Cash App announcement](https://cash.app/press/cash-unlocks-bitcoin-everyday-stablecoins). |
| Cryptwerk Coinmap | Broad cryptocurrency discovery with physical locations and country directories. | Stay precise about Bitcoin payment methods and concrete local outings. [Coinmap](https://cryptwerk.com/coinmap). |

The proposed distinction is the complete experience: fast discovery, explicit payment evidence, practical instructions, a pleasant outing, and a visible contribution outcome. Treat superiority as a hypothesis to validate through task success and volunteered payment outcomes.

**The definitive priority list**

Effort is preliminary engineering effort including feature-specific tests, assuming one developer familiar with this repository. Design, research recruitment, and ongoing evidence review require additional participation. Ranges are planning estimates, not delivery commitments.

| Rank / ID | Enhancement | Main outcome | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| 1 / E01 | Payment confidence people can understand | Fewer avoidable wasted trips | 5–8 days | E02 schema/precedence for full rollout |
| 2 / E02 | Preserve reviewed data through every refresh | Corrections remain correct | 7–12 days | None; foundational |
| 3 / E03 | One obvious search and location flow | A relevant shortlist in seconds | 5–8 days | E04 state contract; E10 controls |
| 4 / E04 | Predictable map, list, Saved, and Back behavior | Users never lose context | 4–7 days | None; foundational |
| 5 / E05 | Visit-ready merchant details | Know what to do before leaving | 5–9 days | E01, E04 |
| 6 / E06 | Fast, resilient browsing with offline saved information | Useful even on weak connections | 6–10 days | E02 catalog contract |
| 7 / E07 | Short reports with a trackable outcome | Contributions feel worthwhile | 8–12 days | E02, E08 status contract |
| 8 / E08 | A practical review and freshness workbench | Good information reaches users sooner | 5–8 days | E02; status portion precedes E07 |
| 9 / E09 | Better saved outings and shareable place pages | A reason to return and invite others | 10–15 days | E04, E05, E06 |
| 10 / E10 | An accessible, coherent design system | Calm, legible, dependable interaction | 6–9 days | Starts immediately; applies to all |

Business priority and implementation order differ: E02, E04, and the first slice of E10 should land before the larger interface changes that depend on them. The total is roughly 61–98 engineering days before an integration/research contingency. A single-engineer plan should allow roughly 15–24 working weeks including contingency, rather than promising a complete transformation in a short sprint.

**E01 — Payment confidence people can understand**

**Experience.** A result card answers “What is the evidence, how old is it, and is there a reason to check first?” Opening the listing shows the payment method, the latest reviewed outcome when one exists, and the supporting source. Use plain wording such as “Visitor reported paying 12 days ago,” “Merchant policy checked Oct 20,” or “Needs a fresh check.” Keep source type available in a disclosure instead of requiring users to understand “Dated community” before searching.

**Implementation and data.** Add a shared evidence-summary function used by cards, details, directory, exports, and future place pages. Separate acceptance evidence from edits to a phone number/address and from the date a source was fetched. Preserve multiple evidence entries with source URL, evidence kind, date precision, observed date when known, review date, and branch/chain scope. A month-only source date must remain month precision. Do not turn missing dates into today's date.

Define the initial policy explicitly: a reviewed visitor success within 90 days can receive the recent-payment presentation; a same-day or newer reviewed failure takes visual precedence as a caution. Older successes remain visible as dated history. Community evidence older than 365 days receives a recheck label. These are editorial freshness rules, not guarantees of acceptance. A single failed report does not automatically remove a business or switch off a rail. A generic maintainer correction does not refresh acceptance.

**States and acceptance.** Test success, failure, same-day conflict, missing dates, old article evidence, chain-wide policies, source-only evidence, and no payment reports. The current catalog must launch with zero invented payment successes. All 177 currently aged community records must receive the appropriate current-date treatment. In usability sessions, at least 8 of 10 participants should distinguish a source check from a reported purchase without explanation.

**Delivery.** Owner: product/content plus data engineer. Ship labels and dates first, then richer event summaries after E02. Compare old/new summaries in a generated audit before enabling them. Preserve old fields during migration; roll back the presentation independently of evidence storage. Touch app.js, directory-tools.js, directory.js, the catalog schema, import/review scripts, and national/payment tests.

**E02 — Preserve reviewed data through every refresh**

**Experience.** A corrected address stays corrected. A removed listing stays removed. Old shared links explain a removal or replacement rather than silently selecting another branch.

**Implementation and data.** Keep one canonical catalog and the current Git-reviewed publication boundary. Extend its versioned contract to include source identities, field-level reviewed overrides, durable removal records, and reviewed payment/evidence events. Keep appliedReviews for idempotent application. A removal must record the stable listing ID and its upstream aliases; the ledger entry alone is not a suppression rule.

The merge order becomes deterministic: validate upstream and primary sources; resolve identities; apply explicit exclusions/removals; apply reviewed field overrides; append evidence events; derive public summaries; validate. An upstream conflict creates a review candidate, not an overwrite. A later human reactivation explicitly supersedes a removal. Never deduplicate different businesses merely because they share coordinates.

Migrate from current records and reviewed diffs before changing importer behavior. Existing ledger entries do not contain full historical values, so resolve old removals and changed fields from their approved proposal/Git history. Quarantine ambiguous identity mappings for review. Preserve all legacy IDs and known public links. Convert false payment flags to unknown unless explicit negative evidence establishes non-support.

Use a shared JSON contract and cross-language fixtures for the Python importer and JavaScript approval code. Add a dry-run report of additions, changed fields, removals, evidence changes, and conflicts; require a reviewed PR for publication. Improve maintainability by formatting touched functions and isolating normalization/merge policy, without requiring a framework rewrite.

**Acceptance.** The two reproduced import fixtures must pass: removed records cannot reappear and reviewed provenance cannot be replaced. Also test metadata-only corrections, source deletions, renamed/moved merchants, same-address branches, same-day reports, duplicate retries, deterministic imports with a fixed as-of date, and legacy URL resolution. Re-importing the same snapshot and policy date must produce no semantic changes.

**Delivery.** Owner: data/backend engineer with maintainer review. First ship the preservation fixes and regression tests; then migrate evidence fields through a compatibility adapter. Export a rollback snapshot before migration. Continue allowing only the canonical data path in automated data PRs until a separately reviewed workflow change is necessary. Touch national-directory.py, map-review.mjs, review-submission.mjs, validate-data.py, merchants.json, and the corresponding tests.

**E03 — One obvious search and location flow**

**Experience.** The initial screen has a short identity line, an always-visible search field, “Near me” and “Choose an area,” a small set of useful category choices, and results. On phones, searching is available in both map and list views. Evidence, distance, and payment controls live under “Filters · N,” with visible removable chips describing active constraints.

A user enters “coffee in Chicago,” chooses Chicago, IL if needed, sees matching coffee businesses, checks payment evidence, and opens a place. Region and category are explicit choices, not a lucky substring match. Keep search usable without location permission. Location denial leads directly to city/ZIP or map-point choices.

**Implementation and data.** Build a local normalized index once per catalog revision: accent/case normalization, token matching across fields, category aliases, and separately typed place/city/state/ZIP suggestions. Use stable city-plus-state keys; never combine Springfields across states into one choice. Start with deterministic intent parsing and suggestions, not an AI service. Preserve specific categories from source tags where defensible; replace the ambiguous More chip with named categories under All categories.

With an origin, default to distance and describe it as approximate straight-line distance until a route is requested. With no origin, invite area selection; remove the hard-coded Arizona featured boost from nationwide ranking. An Arizona trail can remain discoverable in its relevant area. Unknown-area and sparse-coverage states offer nearby alternatives and an add-business action without implying that no merchants exist.

In the state directory, move search ahead of research/export material, summarize the total matches, and show matching states first. Hide empty state sections during an active query, with an explicit option to see all states. Distinguish “No matches for these filters” from a catalog coverage gap, and carry compatible public filters when switching to the map.

**Acceptance.** The Chicago coffee intent and the equivalent category-plus-city selection must resolve to the same set. Test misspellings with suggestions, accented names, ambiguous cities, ZIP/street-number confusion, keyboard selection, empty results, directory-to-map continuity, and denied GPS. Users should produce a relevant shortlist within 20 seconds in the defined usability tasks. Search must remain visible at 320 px; the first usable result should be reachable without scrolling through a full filter form. A filtered directory search must not label unrelated states as coverage gaps.

**Delivery.** Owner: frontend/design. Prototype with real long names and sparse regions; release the visible search first, then the local index. Keep the existing simple matcher as a rollback path behind the same interface. Touch index.html, directory.html, directory.js, app.js, explorer-core.js, location.js, styles, and search fixtures; no external geocoder is required for the first release.

**E04 — Predictable map, list, Saved, and Back behavior**

**Experience.** Switching map/list changes presentation without discarding search or selection. Opening a merchant and using Back returns to the same results and scroll position. Saved opens the saved collection with a clear scope; returning to Explore restores the previous exploration. Removing the last favorite produces a specific saved-empty state with an obvious way to explore.

**Implementation and data.** Replace scattered state/DOM writes with a small action-driven state module and derived selectors. Keep catalog data, exploration filters, saved/trail IDs, selection, sheet state, and transient origin as explicit concerns. Compute the result set once per relevant change and let list, count, markers, and directory adapters consume the same normalized query semantics.

Use pushState for deliberate view/detail navigation and replaceState for debounced filter refinements. Handle popstate and legacy hash links through the same parser. URLs may contain public listing IDs and selected public area/category filters; exact GPS, chosen point coordinates, and arbitrary typed address text remain out of URLs and storage. Keep private-origin restoration outside the persisted/history contract.

Preserve the existing intent that user-driven map movement explores the new area. Show the resulting area scope and a reversible way to restore prior geographic filters. Programmatic framing must not change filters. A persistent automatic-area mode makes the permanent Search this area button redundant; retain an explicit button only when automatic searching is paused. A selected merchant outside the new result area should remain identified as outside that area, not silently reset every filter.

**Acceptance.** Test filter → detail → Back, Saved → Explore, stale query parameters after Reset/Nearby, refresh of public filters, shared links, orientation changes, route cancellation, and a disappearing listing. Preserve focus and list scroll after save, reorder, and Show more. No exact origin may appear in a copied link, local storage, or serialized navigation state.

**Delivery.** Owner: frontend. First extract state actions without a visual redesign and run parity fixtures; then switch navigation and panels. Roll back via the old view adapter while retaining the data contract. Touch app.js, explorer-core.js, new small state/router modules, and browser journey tests. Do not introduce a second runtime state framework.

**E05 — Visit-ready merchant details**

**Experience.** The first screenful shows name, category, address, payment method/evidence, critical conditions, and one primary “Get directions” action. Website/Call are concise secondary actions. Save and Add to trail remain available; reporting and source history are easy to find through a disclosure. Route preview becomes optional. A newcomer can open a short explanation of Lightning/on-chain without being required to complete a tutorial.

**Implementation and data.** Use structured, sourced fields for payment conditions: ask staff, appointment required, minimum/maximum if explicitly reported, supported in-person channel, branch/chain scope, and access restrictions. Do not infer a condition from a company name or a provider logo. Retain “unknown” as a normal state.

Add opening hours only after obtaining an attributable source, timezone, date, and parser with holiday/exception behavior. The current catalog does not contain hours, so “Open now” is unavailable until that data is present and reliable. First ship Website/Call and “Hours not supplied” as appropriate, without a fabricated open badge.

Keep navigation independent of OSRM availability. Add an explicit walking/driving choice for external navigation; continue labelling the existing OSRM preview as driving unless another supported profile is actually configured. Never show a driving estimate as walking. Label distances from a city centroid as approximate. No wallet integration, payment address collection, or transaction initiation is needed.

**Acceptance.** A participant can identify how to pay and start navigation from the first detail viewport, with a clearly labelled navigation provider. Test missing contact information, unsupported/unknown rails, chain policies, appointment-only venues, expired hours, and route timeouts. A source or photo failure must not remove core details. Verify exact-branch destinations and four-stop URL limits.

**Delivery.** Owner: frontend/content, with data support for hours. Release hierarchy and copy first; add structured conditions next; gate hours on data quality. Revert added enrichments to unknown without removing the core listing. Touch renderDetail, mapsUrl, directory rendering/exports, the schema and import policy, and route/detail fixtures.

**E06 — Fast, resilient browsing with offline saved information**

**Experience.** Text results become useful quickly, even if tiles are slow or unavailable. A returning user can open saved addresses, source dates, and payment notes offline, with an honest “Saved copy from …” label. The user explicitly retries requests; drafts are not silently published later.

**Implementation and data.** Keep merchants.json as the canonical record. Add a deterministic packaging step that generates a compact search/map index, state-grouped detail payloads, and a revision manifest from that record. Do not create a second manually maintained database. A simple field projection measured during this review was 515,758 gzip bytes versus 900,221 for the complete catalog; this is a sizing experiment, not a shipped optimization.

Load detail payloads on selection and the full export only on explicit export. Lazy-initialize map work where appropriate, batch marker updates, reuse marker membership when only sorting changes, and memoize normalized text and distances. Preserve the existing lightweight libraries until measurements justify replacement.

Make the list independent of map initialization. Put explicit timeouts, retry, and last-good data behavior around catalog/detail loading. The current bootstrap throws if Leaflet is unavailable, which prevents the intended list-only recovery. Version caches so a release never mixes an index with incompatible details. Handle missing shards, quota failures, a corrupt cache, and a rollback.

Cache only the site's own shell and permitted public catalog information, with visible remove-offline-data controls. Do not bulk-download OSM tiles: its standard tile service prohibits offline prefetching. [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/). Keep routing and tiles as optional external services; preserve the free-only budget.

**Acceptance.** Provisional app-controlled initial transfer budget: 650 KiB compressed, excluding on-demand tiles and third-party font responses, with those separately reported. Set targets of p75 LCP ≤2.5 s, INP ≤200 ms, and CLS ≤0.1, measured in the field when sufficient traffic exists. [Web Vitals](https://web.dev/articles/vitals). Also measure time to first usable result; a hero-only LCP success is insufficient. Test on a throttled midrange mobile profile and with tiles, route service, catalog, and storage failing independently.

**Delivery.** Owner: frontend/platform. Ship list independence and caching/version safeguards before offline promotion. Generate deployment artifacts from the canonical data in CI, keeping automated data PRs restricted to their intended data source. Update local dev and smoke-check commands together. Roll back the manifest and service worker safely, retaining a valid prior cache until the new release is complete.

**E07 — Short reports with a trackable outcome**

**Experience.** From a known place, “I paid here” asks for date, payment method, a short account of what happened, and public-sharing consent. Business name/address are displayed as context rather than a repeat form to edit. A failure report offers a few useful reason choices and an optional explanation. A new business suggestion remains a separate flow.

After submission, the user gets “Received,” a copyable receipt/status link, the expected next step, and a way to return to the place. Later states distinguish “Awaiting review,” “Published,” “Not added,” and “Delayed.” The interface mentions public review clearly but does not make GitHub terminology the main task.

**Implementation and data.** Introduce an explicit submission type while accepting the current correction/payment envelope during migration. Keep the Worker → private D1 queue → GitHub issue → human approval path. Resolve known listing metadata from the identified record during processing rather than trusting editable duplicated inputs.

Extend the existing receipt storage with an opaque random status token, schema version, received/issue-created/reviewed/deployed timestamps, state, public issue URL once available, and safe outcome text. Expose a rate-limited status endpoint that returns no private queued payload, IP material, or free-form report. The current content hash remains a deduplication key, not an authentication secret. Status updates from Actions must be authenticated and limited to that operation; the Worker still receives no GitHub write token.

Publish success only after the catalog revision is actually deployed. Set a clear retention/expiry policy for receipts and show the public issue link after expiry when available. Reuse the existing free account and cap status polling. Preserve entered text on challenge/network/quota errors, offer an inline retry, and restore a draft after accidental close within the visit. Never background-submit an offline report without the user's explicit send.

**Acceptance.** A known-place report should take a median ≤30 seconds in the research task; suggestion entry has a separate ≤90-second goal. Test challenge expiry, initial challenge failure, offline/timeouts with uncertain POST outcome, duplicate sends, quota exhaustion, closing/reopening, invalid dates, status expiry, and publication failure after merge. Pending claims cannot become public payment confirmations.

**Delivery.** Owner: frontend/backend, with E08 defining truthful status transitions first. Deploy additive status storage/API before enabling client links. Keep current envelope parsing during rollback. Touch community.js, form markup, intake/D1 schema, Worker routing, processor/review workflows, and integration tests. No production form submission is part of this review.

**E08 — A practical review and freshness workbench**

**Experience.** A maintainer sees a concise proposed change, exact branch, source links, before/after fields, map pin, duplicate candidates, and unresolved questions. The next action is clear. Contributors can see whether a report is waiting, needs clarification, was declined, or was published.

**Implementation and data.** Start inside the current GitHub workflow with generated review summaries and a read-only preview artifact; a new admin application is unnecessary. Keep structured JSON available for advanced edits and retain the approved label as the human publication decision. Show missing or uncertain values explicitly.

Parse street, city, state, and ZIP as structured fields with visible confirmation. When Census returns a unique match, use its address components as a suggestion; do not take the penultimate comma fragment as city. Make category selection explicit and flag taxonomy uncertainty. Preserve optimistic concurrency/fingerprints and the exact data-only diff check.

Add a freshness report computed from the catalog and current date: aging evidence, explicit negative evidence, duplicate candidates, stale source checks, and unresolved overrides. A scheduled refresh may prepare a bounded candidate diff and review artifact; it must never silently replace human decisions or auto-publish unreviewed research. Refresh source observations independently from old announcement dates.

Operationally, nominate a primary maintainer and backup, reserve two triage sessions per week, and prioritize closures/payment problems over new additions. Choose an initial internal goal of reviewing routine submissions within seven days only if staffing supports it; measure before promising that publicly. Keep the daily intake cap and free-only policy. Publish queue delays instead of letting the browser imply that “several minutes” means completed human review.

**Acceptance.** Reproduce issue #16's address shape and require a correct or visibly unresolved city, never a street fragment presented as confirmed. Test missing categories, source conflicts, stale prepared fingerprints, approval withdrawal, failed deployment, and retries. A maintainer should assess a straightforward change in ≤2 minutes, excluding evidence investigation. Track oldest pending age, review effort, and reopen rate.

**Delivery.** Owner: maintainer plus backend/data engineer. First improve review preparation and operational visibility, then add bounded freshness proposals. Status callbacks follow the E07 contract. Rollback leaves the previous JSON/label workflow functional and preserves pending records. Touch map-review.mjs, review-submission.mjs, process-submissions.mjs, workflow configuration, CONTRIBUTING.md, and research policy.

**E09 — Better saved outings and shareable place pages**

**Experience.** Saved places always feels like a dependable collection. A visitor can choose two to four saved or nearby stops, understand the order, preview the outing, and share it without their private origin. A recipient opens a useful place or trail immediately. A closed/removed stop is explained, and replacing it is easy.

**Implementation and data.** Improve the existing favorites and four-stop trail rather than introduce accounts or a social feed. Add undo for removal/clear/replace, distinguish viewing a shared trail from replacing a personal draft, and label straight-line distance versus road estimates. Do not silently overwrite the local trail when choosing a preset. Keep manual ordering and the four-stop navigation limit; route optimization is not a first-release requirement.

Make suggested trails relevant to the chosen area and explicit intent: coffee plus lunch, a short outing, or a visitor-selected combination. Initially use transparent deterministic rules and reviewed editorial presets. Require current evidence and sensible geographic proximity; do not combine inaccessible or appointment-only businesses as spontaneous stops. Sparse areas fall back to a single good destination.

Generate public merchant and useful city pages from the same catalog packaging step, with semantic HTML, canonical URLs, source dates, and merchant-specific sharing metadata. Preserve old hash links through a compatibility route. These pages also provide a useful reading experience before JavaScript. Avoid publishing empty city pages or invented reviews, hours, or imagery.

Keep favorite/trail IDs versioned in local storage. Offer explicit export/import of a small user-selected collection, validating IDs and handling removed places. Never export GPS, a chosen private origin, arbitrary form drafts, or tracking identifiers. A browser's Web Share capability can be used when present, with copy-link fallback.

**Acceptance.** Test four stops, same-address businesses, accidental clear, a shared trail with removed IDs, lost storage, very long names, reordering by keyboard, no origin, and external URL limits. A recipient must open the intended place/ordered trail without signup. Static metadata must match the specific merchant and resolve under the Pages project subpath.

**Delivery.** Owner: frontend/content. Ship collection continuity and undo first, then meaningful regional presets, then generated public pages. Gate presets on evidence review capacity. Keep existing hashes and storage readers during migration. Rollback should preserve collections and redirect new page paths to a useful existing map route.

**E10 — An accessible, coherent design system**

**Experience.** The product feels calm and modern because hierarchy, typography, controls, focus, and motion are predictable. The main tasks fit naturally on a phone, large type remains usable, and the map is optional for completing a task.

**Implementation.** Consolidate the layered styles into named tokens and component rules for search, cards, status labels, buttons, sheets, dialogs, and empty/error states. Keep the 1023 px compact breakpoint until a tested change justifies moving it. Use one responsive source of truth and remove superseded rules after visual comparison.

Keep orange for emphasis and map identity; use a darker accessible orange for text on light backgrounds. Increase primary reading text toward 16 px and secondary information toward 14 px, then test actual layouts. Adopt 44 px controls as the product's comfort target; WCAG 2.2 AA's minimum target-size rule is 24 px with exceptions, so do not mislabel the product target as the standard. [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).

Provide skip links and named regions, correctly exposed filter/toggle states, labelled map clusters, visible focus, predictable dialog restoration, and non-drag alternatives for sheet/trail interaction. Patch cards in place or restore focus after a deliberate update instead of rebuilding the focused button without recovery. Announce result updates without reading the whole list. Respect reduced motion and browser text sizing.

Simplify language consistently: “Bitcoin businesses” before unexplained “sats,” “Get directions,” “Payment method,” “Last reported,” and “Report a change.” Move research downloads and detailed methodology below consumer discovery in the directory. Avoid implying live availability with decorative live dots or freshness with a generic total.

**Acceptance.** Check key journeys with keyboard, VoiceOver and NVDA, 200% zoom, 320 CSS px reflow, short landscape, tablet, large desktop, light/dark, and reduced motion. Measure text and control contrast in all states. Test on physical iPhone Safari and Android Chrome, including the software keyboard and browser chrome. Automated accessibility checks supplement these observations; no blanket certification is implied.

**Delivery.** Owner: design/frontend/QA. Begin with contrast, focus continuity, search visibility, and tokens. Apply components incrementally during E03–E09 instead of waiting for a final visual rewrite. Retain before/after screenshots and per-component rollback. Touch index/directory markup, styles.css, responsive.css, rendering functions, and responsive QA documentation.

**The intended data flows**

The current read path is simple: a page fetches the complete catalog, then its own JavaScript filters and renders it. The write path already has useful separation between private intake and public approval. Preserve those boundaries; simplify ownership within them.

~~~mermaid
flowchart LR
  Sources["Upstream snapshot + curated research"] --> Merge["Deterministic normalization and merge"]
  Canonical["Canonical catalog: IDs, overrides, removals, evidence"] --> Merge
  Merge --> Proposal["Reviewable candidate diff"]
  Proposal --> Review["Human review + protected data-only PR"]
  Review --> Canonical
  Canonical --> Package["Validate + deterministic packaging"]
  Package --> Pages["GitHub Pages: index, details, HTML, exports"]
  Pages --> Query["One client query/state contract"]
  Query --> Views["Map, list, details, Saved, trail"]
  Visitor["Visitor report + consent"] --> Queue["Worker + private D1 queue"]
  Queue --> Issue["Public review issue"]
  Issue --> Review
  Pages --> Receipt["Confirmed deployment status"]
  Issue --> Receipt
  Receipt --> Status["Minimal receipt-status view"]
~~~

The diagram's catalog-to-merge edge represents loading prior reviewed decisions, not trusting arbitrary old source values over all new evidence. The schema declares which fields are human overrides and which are replaceable source observations. The displayed receipt state must be confirmed by the workflow; publication is not inferred from issue creation.

| Concern | Owner / source of truth | Persistence and privacy | Simplification |
| --- | --- | --- | --- |
| Merchant identity and source aliases | Canonical catalog | Public, stable IDs | One identity resolver; retain old IDs |
| Acceptance and reviewed outcomes | Dated evidence events in catalog | Public only after review | Derive labels everywhere from the same rules |
| Removals and corrected fields | Reviewed overrides/removal records | Survive every import | Explicit precedence and reactivation |
| Search/filter/selection | One frontend state/query module | Public selections may be serialized; arbitrary text stays transient unless explicitly shared | One result set drives count/list/markers |
| Exact origin and GPS accuracy | In-memory origin object | Never persisted or shared in trail/place links | Services receive coordinates only for requested actions |
| Favorites and trail | Versioned local ID collection | Device-local; explicit export only | Shared storage adapter with failure/undo handling |
| Submission | Private queue record, then public issue | Business details and consent; no new personal fields | Typed envelopes and one normalization path |
| Submission progress | Minimal receipt record | Opaque lookup token, bounded retention; no queued payload exposure | One visible status progression |
| Runtime payloads/CSV/HTML | Generated from catalog revision | Public, revisioned, attributed | Rebuild together; no hand-maintained duplicate datasets |
| Route and tiles | External adapters | Existing disclosed coordinates/viewport requests | Optional; failure cannot block list/navigation |

The deployment packager should write to a temporary publish directory and include a catalog revision manifest. CI validates that index IDs, detail records, static pages, and exports agree before publishing that directory. The canonical data remains the only data file changed by the automated approval PR unless an explicit later workflow revision changes that contract. A small packaging script is sufficient; avoid adding a full application build framework.

**User happiness and release gates**

There is no measured satisfaction, retention, conversion, or real-device performance baseline in this review. Establish one before claiming uplift. Use research to validate the interaction, and operational data to validate the promise.

| Measure | Definition | Initial goal / guardrail |
| --- | --- | --- |
| Find a useful place | Time from task start to a chosen relevant listing | Median ≤20 seconds in the defined usability tasks |
| Interpret payment evidence | Correctly distinguish source check, visitor report, and unknown | At least 8/10 participants without coaching |
| Complete a core task | Find, assess, and open directions without a blocking failure | At least 9/10 participants; repeat with assistive technology |
| Task ease | One optional 1–7 ease question after the task | Median ≥6; baseline first |
| Report effort | Known-place payment report, excluding evidence investigation | Median ≤30 seconds; no loss after recoverable errors |
| Useful real-world outcome | Volunteered successful/failed payment outcomes after navigation | Report counts and response rate; never treat a navigation click as a purchase |
| Review responsiveness | Received → triaged → deployed, with blocked reasons | Internal seven-day routine-review goal only when staffed |
| Data integrity | Removed records resurrected; reviewed fields lost | Zero in regression suite and release diff audit |
| Speed | First useful result, LCP, INP, CLS, controlled payload bytes | E06 budgets; real-device/field evidence before claims |
| Trust guardrails | Unreviewed claims published, private origins leaked, false open status | Zero |

Recruit a small initial group covering first-time Bitcoin spenders, regular local users, travelers, and two maintainers/merchant contributors. Include users of assistive technology and larger text. Use the same five tasks on the current and proposed experience with order counterbalanced: find coffee in another city; assess an old-source listing; use the app after location denial; recover a saved place; submit a report and interpret its status. These sessions find usability failures; they are not a statistically representative market study.

For live measurement, prefer aggregated first-party counters and coarse elapsed-time buckets with no persistent user identifier, raw search text, merchant-level visit history, precise coordinates, wallet data, or form contents. Any optional satisfaction prompt must be dismissible and infrequent. Use in-session funnel steps only; no invasive analytics is needed to establish whether the core tasks work. At low traffic, prioritize observed task failures and interviews over inconclusive A/B percentages.

**Delivery sequence and reviewable release units**

| Release | Concrete scope | Go/no-go evidence |
| --- | --- | --- |
| R0: establish the baseline and prevent trust regressions | Add import preservation fixtures; fix removal/provenance handling; capture current journey timings; fix hero contrast and focus loss; reconcile policy docs | Existing checks plus new import tests pass; no catalog loss or invented evidence |
| R1: simplify discovery | State/actions foundation, always-visible search, public area identity, active-filter chips, Saved/Back continuity, compact introduction | Chicago-equivalence, saved-filter and URL regressions pass; prototype usability reaches the task goals |
| R2: make decisions trustworthy | Unified evidence summaries, detail hierarchy, sourced conditions, navigation modes, no fake hours | Consistent cards/details/CSV; source interpretation test; branch and route-link checks |
| R3: make information improve | Better review preparation, typed short reports, durable status link, queue age visibility, freshness candidates | Local/staging intake-to-deployment failure matrix passes; operator capacity and retention policy documented |
| R4: improve speed and returning visits | Generated payloads/pages, resilient list, explicit offline saved information, undoable collections and relevant trails | Transfer/performance budget, cache rollback, legacy links, offline behavior, and privacy tests pass |

Accessibility and device checks run in every release. E06's basic list/error resilience can ship earlier than its packaging and offline work. The status schema for E07/E08 should be agreed before either side is implemented. Use ordinary descriptive branches and small reviewed PRs; retain the user's prohibition on the codex/ prefix.

For every release, require: relevant Node/Python checks, the Pages-subpath smoke test against the actual publish output, focused browser regression journeys, keyboard checks, and the affected viewport/theme cases. Use mock/local fixtures for intake failures and synthetic catalog states; any live submission test should be clearly labelled and deliberately authorized during implementation. Preserve the current approval-withdrawal, branch-protection, deduplication, and deploy-retry tests.

Roll out a small region/data sample for evidence policy and presets before national expansion; do not present sample coverage as national certainty. Use a simple reversible configuration switch for a changed UI if needed, not a new feature-flag service. Keep the prior deployable artifact and backwards-compatible schemas through each migration. Roll back code through the existing revert-PR process; retain reviewed evidence and repair data forward when reverting would lose valid corrections.

**Decisions to hold until evidence supports them**

Do not add an AI chat layer, wallet connection, accounts, rewards, public star ratings, real-time location tracking, a new paid map/routing provider, or a frontend framework migration to this roadmap's initial scope. None is necessary to fix the observed journeys. Real merchant photos can be useful later with permission, attribution, moderation, and an image budget; fabricated storefronts would undermine the core trust objective. Push alerts and broad localization should follow evidence of returning-user demand and maintenance capacity.

The working assumptions are a US consumer map, a static account-free frontend, free services only, and limited maintainer capacity. Confirm staffing and research recruitment when scheduling implementation. Those uncertainties affect timing and feature breadth, but do not block the recommended preservation, discovery, and clarity improvements.

**Instruction/documentation mismatches**

The review used running code as the description of current behavior, as requested, and did not change application behavior to match an outdated document.

| Mismatch | Evidence | Resolution in the plan |
| --- | --- | --- |
| Geolocation timing | [SECURITY.md](../../SECURITY.md#L9) says location is requested only after a visitor asks. [Startup](../../dist/app.js#L121), README, and the story dialog also allow an automatic attempt when permission was already granted. | Align the security description with the actual permission-aware behavior. Any future change to that behavior is a separate deliberate product choice. |
| Human review preservation | [Research policy](../../research/README.md#L25) says to preserve human-reviewed catalog records. The [research merge](../../scripts/national-directory.py#L187) can replace their provenance; the fixture demonstrated it. | E02 defines reviewed field ownership and additive provenance. |
| Removal preservation is incomplete | The contribution/research process describes reviewed removals and durable review history, but [national import](../../scripts/national-directory.py#L100) retains active reviewed rows without applying old removal decisions. Keeping appliedReviews does not prevent resurrection. | E02 adds durable removals keyed to upstream identities and reactivation rules. |
| Snapshot-location comment | [The importer header](../../scripts/national-directory.py#L4) says raw upstream stays outside the repository, while [research documentation](../../research/README.md#L29) and the tracked gzip snapshot establish an archived input. | Update the stale code comment to describe the documented reproducible snapshot policy. This is comment/documentation drift, not an additional instruction conflict. |

**Recommended first implementation slice:** preserve reviewed removals/provenance, restore focus after card actions, make mobile search visible, eliminate hidden Saved filters, and show evidence dates in the decision path. These changes address demonstrated failures while the broader evidence model, reporting loop, and performance work are built.
