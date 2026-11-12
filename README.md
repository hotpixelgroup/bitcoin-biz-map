# Sats in the Sun

[Open the public map](https://hotpixelgroup.github.io/bitcoin-biz-map/) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

[![Site checks and Pages](https://github.com/hotpixelgroup/bitcoin-biz-map/actions/workflows/site.yml/badge.svg)](https://github.com/hotpixelgroup/bitcoin-biz-map/actions/workflows/site.yml)

A responsive, sourced directory of Bitcoin businesses across all 50 states and Washington, DC. It started with the 219 Arizona listings in [Bitcoin Magazine’s October 19, 2026 article](https://bitcoinmagazine.com/culture/pita-cafe-arizona-bitcoin).

## Run locally

```sh
npm run dev
```

Open http://localhost:5173 (choose another port if occupied). Node 24+ and Python 3 are required. The dependency-free packaging step generates `.publish/`; no frontend dependency installation, API key, or local backend is needed. Serve `.publish/` with any static host. `dist/` remains the editable source. Map tiles, fonts, and routing require internet access.

## Features

- Light and dark themes, following the system preference initially and remembering manual choices.
- Orange bitcoin markers, clustering, and separate selection of businesses sharing an address.
- Accent-insensitive intent search such as “coffee Chicago,” state-qualified city/category/evidence filters, alphabetic and location-based sorting, and shareable public filters. Saved ignores exploration restrictions; Back restores in-session context.
- A full state-by-state directory with evidence notes, individual state CSV downloads, and a full-directory CSV export. Counts and exports always read the current catalog.
- Browser-local saved places, undo, validated collection export/import, and generated public pages for individual merchants and cities.
- Optional geolocation, public OSRM driving route previews in Bitcoin orange, and Google Maps navigation links.
- Personal Bitcoin trails with up to four reorderable stops, orange road previews, Google Maps navigation, and share links that contain business IDs only. A Scottsdale preset and random merchant discovery are also available.
- Short payment reports, new-business suggestions, and listing corrections with in-session draft recovery. An opaque 30-day receipt shows processing, human review, and confirmed deployment separately.
- Search the visible map area, synchronized card/pin highlighting, and a draggable mobile places sheet with keyboard controls.
- Lightning/on-chain filters, payment conditions, and anonymous visitor payment reports approved through GitHub before their dated results appear on the map.
- Device location with transient-failure retries and city/ZIP or map-point fallback, plus distance filters and nearest-first results.

## Suggest a business or report a listing

Use **Suggest a business** below the map or **Report incorrect listing** in a business's details. The on-site form needs no GitHub account and prefills the selected business's name and address. Submissions are intended for public GitHub review, so the form asks for business details and public-sharing consent, rather than personal contact information.

The map remains on GitHub Pages. The deployed Cloudflare **Workers Free** API and private D1 queue enforce bounded inputs, durable quotas, and deduplication. GitHub Actions in this public repository converts accepted records into issues with `needs-review`, assigns them to `hotpixelgroup`, and does not expose a personal GitHub token. Publication may take several minutes or longer if GitHub delays a scheduled run.

Only free services are permitted: do not enable a paid Workers plan, paid add-ons, or larger paid Actions runners. Exhausting the free backend allowance pauses submissions rather than authorizing charges. See [backend setup and controls](backend/README.md).

The original GitHub issue templates remain available for contributors who prefer them. To approve a submission, review or edit its prepared **Map update** JSON and add **approved**. The bot creates a data-only PR, validates it, merges it through the protected branch, deploys Pages, and closes the issue after publication. See the [maintainer approval guide](CONTRIBUTING.md#approve-a-community-submission). Corrections require explicit field changes; closures and withdrawn bitcoin acceptance use a reviewed removal.

## Location and trail privacy

**Use my location** requests a device fix. An already-granted permission can provide nearby results automatically; new visitors explicitly choose the action before a browser prompt. A quick coarse/cached fix is tried first, with one fresh high-accuracy retry for temporary failures. Permission denial is respected. Browser/OS settings and embedded-browser support can still prevent GPS access; the map always offers a starting-point picker instead of a dead-end error.

City/state/ZIP suggestions are approximate centers of matching directory listings, computed locally without an external geocoder. They are limited to areas represented in the catalog. A map crosshair provides an exact chosen point anywhere. Changing location updates nearest-first results and navigation links. Origins and GPS accuracy stay in memory for the visit, never in browser storage or copied trail links. Previewing a route sends its coordinates to OSRM; opening navigation passes its selected origin/stops to Google Maps. Trail stops and favorites use local browser storage, with no account required. Trails preserve the chosen order rather than optimizing it, and the four-stop limit keeps navigation compatible with mobile Google Maps URLs.

Visitors can report **I paid here** or **Payment didn’t work** from a listing. Reports require a visit date, payment network (including “Not sure”), details, and public-sharing consent. GitHub review and the **approved** label are required before the map shows a reviewed visitor payment date, caution, or conditions. This does not imply a purchase by the maintainer. See the [payment review guide](CONTRIBUTING.md#review-visitor-payment-reports).

## Data and services

The canonical schema-v2 `dist/merchants.json` retains the original 219 article IDs and the applied community-review ledger. The national research snapshot adds explicit Bitcoin-tagged BTC Map records with a community verification date within 365 days of import, usable street addresses/cities, and coordinates within US Census state boundaries. ATM-only, exchange-only, unnamed, stale, undated, incomplete, conflicting, and explicitly rejected leads are withheld. Being a Square merchant is never enough on its own.

Every listing identifies its evidence as **Merchant source**, **Dated community**, **Maintainer reviewed**, or **Original article**. Merchant statements and firsthand owner interviews have notes describing conditions and source age; a source check is not a test purchase. Original Arizona article listings without newer evidence remain clearly labeled. This is the full sourced catalog, not a claim to identify every Bitcoin business or guarantee current acceptance.

See [research methodology and state counts](research/README.md), [machine-readable audit](research/national-audit.json), and [public state directory](https://hotpixelgroup.github.io/bitcoin-biz-map/directory.html). Review-only research leads are downloadable separately and are not new verified map additions.

To refresh the national snapshot, download the public BTC Map v4 fields documented in `research/README.md`, then run:

```sh
python3 scripts/national-directory.py /path/to/btcmap-v4.json --dry-run
# Review the candidate changes before writing:
python3 scripts/national-directory.py /path/to/btcmap-v4.json --geocode
npm run check
```

The optional geocoder contacts the free US Census service only for unmatched merchant-confirmed public addresses. The national importer preserves original IDs and maintainer-reviewed records, keeps per-field overrides, removal tombstones and source observation history, and regenerates source-imported national records deterministically. Research and negative evidence are committed for review. Changes require a PR and passing checks. The old article importer is for initial historical reconstruction and refuses to overwrite community reviews.

The map uses vendored Leaflet 1.9.4 and Leaflet.markercluster 1.5.3; base tiles are © OpenStreetMap contributors (ODbL). Theme filters affect only base tiles, keeping merchant pins and routes orange. OSRM’s public demo endpoint supplies road geometry and non-traffic estimates; for larger production traffic, configure a managed or self-hosted routing service and an appropriate tile provider. Saved places are device-local. Route previews send the requested coordinates to OSRM only after the visitor requests the route. Navigation opens Google Maps.

## Offline and packaging

The packager derives a revisioned discovery index, state detail shards, merchant/city HTML, sitemap, and the legacy full catalog from the same canonical data. Detail shards load only when needed; map or tile failure leaves the list usable. CI checks ID/detail consistency, the Pages subpath, and a 650 KiB gzip budget for the initial first-party application assets plus index (external fonts/tiles are excluded).

In Saved, **Keep offline** explicitly stores the shell, discovery index, and public detail shards for saved places' states. It never downloads map tiles for offline use. **Remove offline copy** clears those caches without deleting favorites. The UI identifies an offline catalog by its date; it cannot guarantee current acceptance or routing without connectivity. Location and form drafts are not included. Updates retain one earlier cache for rollback, and a subsequent explicit save refreshes the copy.

Cards, details, exports, and the directory share evidence rules: reviewed visitor success within 90 days, caution for a same-day/newer failed report, and a recheck label for community evidence older than 365 days. False or absent rail flags mean unknown, not confirmed refusal. Source checks and metadata corrections are not purchases. No visitor success was invented for this release.

## Responsive layouts

Phones and tablets through 1023 CSS pixels use a full-width map and bottom places panel; larger screens use the side-by-side list and map. Map framing accounts for open panels, and a selected business has its own pin layer so clustering cannot hide it. A resize observer updates map dimensions and framing when the viewport changes. The narrowest headers, short landscape screens, dialog scrolling, keyboard focus, and long business names are included in the [viewport audit](docs/qa/responsive-audit.md).

## Validation

`npm run check` tests anonymous intake validation, durable quotas, D1 SQL, issue delivery deduplication, GitHub issue URL generation, correct branch identification for every merchant, and query parameter encoding, then verifies JavaScript syntax and merchant count, uniqueness, coordinates, categories, cities, and source provenance. It also serves the bundle at the GitHub Pages project subpath and checks that the home page, local assets, license notices, and directory load successfully. National regression tests cover US state validation, national listing IDs, stale/future verification dates, incomplete addresses, CSV formula escaping, and Git blob reads for catalogs exceeding the Contents API inline size limit. The UI has also been checked in the browser for both themes, desktop/mobile layouts, search, combined city/category filters, saved-place persistence, business details, navigation URLs, and trail routing.

## Public deployment and project management

The public website is hosted at **https://hotpixelgroup.github.io/bitcoin-biz-map/**. Anyone can use it without an account or ChatGPT sign-in. GitHub Pages publishes only the generated `.publish/` bundle.

`.github/workflows/site.yml` validates every PR and every push to `main`. Deployment runs only after validation succeeds on `main`, using the `github-pages` environment and the built-in GitHub token. No deployment secrets or external build service are required. Workflows are pinned to exact action commits; Dependabot checks for action updates weekly.

`main` requires pull requests, passing and up-to-date **Validate site** checks, resolved discussions, and linear history; force pushes and deletion are blocked. The single-maintainer setup allows the owner to merge their own PR once checks pass. See [CONTRIBUTING.md](CONTRIBUTING.md) for the maintenance, review, and rollback workflow.

## License

Original app code is [MIT licensed](LICENSE). The merchant database retains [ODbL attribution and terms](DATA_LICENSE.md). Vendored libraries keep their original licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
