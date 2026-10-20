# Sats in the Sun

[Open the public map](https://hotpixelgroup.github.io/bitcoin-biz-map/) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

[![Site checks and Pages](https://github.com/hotpixelgroup/bitcoin-biz-map/actions/workflows/site.yml/badge.svg)](https://github.com/hotpixelgroup/bitcoin-biz-map/actions/workflows/site.yml)

A responsive, map-first guide to the 219 Arizona businesses in [Bitcoin Magazine’s October 19, 2026 article](https://bitcoinmagazine.com/culture/pita-cafe-arizona-bitcoin).

## Run locally

```sh
npm run dev
```

Open http://localhost:5173 (choose another port if occupied). No build, installation, API key, or backend is needed. Serve `dist/` with any static host. Map tiles, fonts, and routing require internet access.

## Features

- Light and dark themes, following the system preference initially and remembering manual choices.
- Orange bitcoin markers, clustering, and separate selection of businesses sharing an address.
- Full-text search, city/category filters, alphabetic and location-based sorting.
- Browser-local saved places and direct links to individual merchants.
- Optional geolocation, public OSRM driving route previews in Bitcoin orange, and Google Maps navigation links.
- A three-stop Scottsdale trail inspired by the article, plus random merchant discovery.
- New-business suggestions and listing corrections through public GitHub issues, with the selected business prefilled in reports.
- Responsive list/map switch, keyboard controls, and explicit network/location error states.

## Suggest a business or report a listing

Use **Suggest a business** below the map or **Report incorrect listing** in a business's details. The on-site form needs no GitHub account and prefills the selected business's name and address. Submissions are intended for public GitHub review, so the form asks for business details and public-sharing consent, rather than personal contact information.

The anonymous intake integration is prepared in a draft until a Cloudflare **Workers Free** account is connected and the endpoint is deployed. The map remains on GitHub Pages. The free Worker and D1 queue enforce bounded inputs, durable quotas, and deduplication. GitHub Actions in this public repository converts accepted records into issues with `needs-review`, assigns them to `hotpixelgroup`, and does not expose a personal GitHub token. Publication may take several minutes or longer if GitHub delays a scheduled run.

Only free services are permitted: do not enable a paid Workers plan, paid add-ons, or larger paid Actions runners. Exhausting the free backend allowance pauses submissions rather than authorizing charges. See [backend setup and controls](backend/README.md). Keep the form unpublished until the real integration has been verified.

The original GitHub issue templates remain available for contributors who prefer them. Reviewed issues never edit map data automatically; update the directory through a checked pull request after verifying a suggestion.

## Data and services

`dist/merchants.json` contains all 219 article listings. The directory is a snapshot imported October 20, 2026; it does not claim current verification of acceptance or opening hours. 217 coordinates and available phone, website, and payment metadata are matched to BTC Map / OpenStreetMap. Two address coordinates use the US Census geocoder and are recorded in `scripts/coordinate-overrides.json`. Gover Property Management has a BTC Map location but no article street address. Its city is derived from that location. Lightning badges appear only when BTC Map explicitly marks Lightning support.

To refresh the dataset, obtain the source article HTML and the public BTC Map v2 elements JSON, then run:

```sh
python3 scripts/import-merchants.py /path/to/article.html /path/to/btcmap-elements.json
npm run check
```

Review matching results before publication. Importing does not contact merchants or update external records.

The map uses vendored Leaflet 1.9.4 and Leaflet.markercluster 1.5.3; base tiles are © OpenStreetMap contributors (ODbL). Theme filters affect only base tiles, keeping merchant pins and routes orange. OSRM’s public demo endpoint supplies road geometry and non-traffic estimates; for larger production traffic, configure a managed or self-hosted routing service and an appropriate tile provider. Saved places are device-local. Route previews send the requested coordinates to OSRM only after the visitor requests the route. Navigation opens Google Maps.

## Validation

`npm run check` tests GitHub issue URL generation, correct branch identification for every merchant, and query parameter encoding, then verifies JavaScript syntax and merchant count, uniqueness, coordinates, categories, cities, and source provenance. It also serves the bundle at the GitHub Pages project subpath and checks that the home page, local assets, license notices, and directory load successfully. The UI has also been checked in the browser for both themes, desktop/mobile layouts, search, combined city/category filters, saved-place persistence, business details, navigation URLs, and trail routing.

## Public deployment and project management

The public website is hosted at **https://hotpixelgroup.github.io/bitcoin-biz-map/**. Anyone can use it without an account or ChatGPT sign-in. GitHub Pages publishes only `dist/`.

`.github/workflows/site.yml` validates every PR and every push to `main`. Deployment runs only after validation succeeds on `main`, using the `github-pages` environment and the built-in GitHub token. No deployment secrets or external build service are required. Workflows are pinned to exact action commits; Dependabot checks for action updates weekly.

`main` requires pull requests, passing and up-to-date **Validate site** checks, resolved discussions, and linear history; force pushes and deletion are blocked. The single-maintainer setup allows the owner to merge their own PR once checks pass. See [CONTRIBUTING.md](CONTRIBUTING.md) for the maintenance, review, and rollback workflow.

## License

Original app code is [MIT licensed](LICENSE). The merchant database retains [ODbL attribution and terms](DATA_LICENSE.md). Vendored libraries keep their original licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
