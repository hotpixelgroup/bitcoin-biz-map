# Merchant data

The merchant database in `dist/merchants.json` includes data derived from
[OpenStreetMap](https://www.openstreetmap.org/copyright) via
[BTC Map](https://btcmap.org/). It is distributed under the
[Open Data Commons Open Database License 1.0 (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/).
Database attribution: © OpenStreetMap contributors, via BTC Map.

The directory's business names, addresses, and category groupings were compiled
from the factual merchant appendix in [Bitcoin Magazine's October 19, 2026
article](https://bitcoinmagazine.com/culture/pita-cafe-arizona-bitcoin), which
identifies BTC Map as its source. The article's prose and images are not included
or licensed by this project.

Original address overrides and additional researched address coordinates use the [US Census Geocoding Service](https://geocoding.geo.census.gov/):
Original overrides are recorded in `scripts/coordinate-overrides.json`; national address matches and public-source coordinates are recorded in `research/geocoded-addresses.json` and the merchant records. The US Census 2025 cartographic state boundaries in `scripts/data/us-states.geojson` are public-domain federal geographic data, derived from the official 20m KML.

The application code's MIT license does not replace the database's ODbL terms.
Preserve attribution and applicable database share-alike obligations when
redistributing or adapting the database. The base map tiles are served by
OpenStreetMap and are not bundled in this repository.

National research adds factual business details from merchant-owned pages, public location directories, payment-provider announcements, and dated firsthand merchant interviews. Each mapped record links to its acceptance evidence; conditions are summarized in our own words. No source article text, merchant logos, photos, or API implementation code is copied. The combined merchant and candidate databases retain ODbL terms; research citations identify the underlying sources.
