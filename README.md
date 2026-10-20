# Sats in the Sun

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
- Responsive list/map switch, keyboard controls, and explicit network/location error states.

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

`npm run check` verifies JavaScript syntax and merchant count, uniqueness, coordinates, categories, cities, and source provenance. The UI has also been checked in the browser for both themes, desktop/mobile layouts, search, combined city/category filters, saved-place persistence, business details, navigation URLs, and trail routing.

Hosting configuration is in `.openai/hosting.json`. Sources can also be hosted independently; this is a buildless static application.
