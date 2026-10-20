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

Two address coordinates use the [US Census Geocoding Service](https://geocoding.geo.census.gov/):
Simply Divine Massage and See Ash Go Dog Training. These overrides and their
provenance are recorded in `scripts/coordinate-overrides.json`.

The application code's MIT license does not replace the database's ODbL terms.
Preserve attribution and applicable database share-alike obligations when
redistributing or adapting the database. The base map tiles are served by
OpenStreetMap and are not bundled in this repository.
