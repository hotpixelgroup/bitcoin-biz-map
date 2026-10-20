# US Bitcoin business research

Research snapshot: October 20, 2026. Three parallel researchers completed eight regional passes covering all 50 states and Washington, DC, plus an official chain census and a final conflict check. Regional files are evidence leads, not automatic approvals; the importer applies additional recency, geographic, duplicate, and overriding-source checks.

[Open the full public directory](https://hotpixelgroup.github.io/bitcoin-biz-map/directory.html). Expand any state for every mapped business, its address, source, evidence date and notes. Use that page for current per-state or full-directory CSV exports; approved changes update those exports automatically. The counts below describe this research snapshot rather than future live changes.

## Results and limits

- 9,452 mapped locations, including 9,233 additions to the original 219 Arizona records. All original IDs, saved-place links, and applied-review ledger entries are preserved.
- 446 locations have direct merchant statements, direct owner/staff interviews, or an explicit chain policy combined with current official branch evidence. Of these, 383 are Steak ’n Shake branches after the Rolla replacement exclusion; 63 are other locations. This classification is not a test payment at every branch.
- 8,992 have dated BTC Map / OpenStreetMap community verification meeting the new-import policy. These are clearly labeled **Dated community**, not merchant confirmation by this project.
- 14 original Arizona article records lack newer qualifying evidence and remain labeled **Original article**. Their preservation is an explicit historical exception to new-import rules.
- 844 separate research leads are withheld from new verified additions because of stale or incomplete evidence, missing pins, conflicts, physical-access questions, or exclusions. A candidate file may reference a location already on the map through independent qualifying evidence; it records the specific unresolved claim rather than publishing it as confirmation.

This is the full catalog sourced by this research, not a census of every Bitcoin business in existence. Merchant coverage varies, and some states have no independent merchant-source discoveries from this pass despite having community-dated map records. No absence should be read as proof that Bitcoin businesses do not exist there. Confirm payment with the business before visiting. Bitcoin-only names, generic cryptocurrency acceptance, ATMs, payment kiosks, donations and online-only businesses are insufficient evidence for a new physical merchant pin. Appointment requirements, payment limits and rail uncertainty remain in the notes.

## Import policy

1. Read the public BTC Map v4 places snapshot, excluding deleted records by API default. Classify coordinates with US Census 2025 state polygons, including Alaska, Hawaii and DC. Hold records whose claimed state conflicts with the coordinates. Coarse coastline boundaries may omit a valid waterfront location; a missing record is a research gap, not a negative acceptance claim.
2. Require explicit `currency:XBT=yes`, a real name, a full street number/street/city, and a valid `verified_at` no more than 365 days before import and no future date. Being a Square merchant alone never qualifies a business. Payment flags are reported capabilities, not guarantees or evidence that an unsupported rail is refused.
3. Exclude ATM/exchange/payment-terminal/non-merchant entries, unnamed entries, stale or undated community claims, incomplete addresses and overriding negative evidence. New merchant-source additions require a specific physical address and sourced coordinates. Historical announcements without fresher support stay in review; standing merchant policy pages show source age where known.
4. Corroborate missed merchants through the regional primary records. Six Palm Valley Pediatric Dentistry offices and Live To Smile supply seven direct-source Arizona additions. Two additional Arizona businesses qualify through dated community evidence.
5. Match OSM identity first, then business name or business-specific website, normalized exact address, and/or close coordinates. Exact address identifiers take precedence over differing approximate locator pins. Preserve matched OSM building points; they are not independently proven rooftop coordinates. Separate named businesses sharing a building remain separate records.
6. Apply curated conflicts last. The former Rolla Steak ’n Shake is now Freddy’s, supported by Freddy’s own December 2025 announcement. Do not transfer inherited Bitcoin tags to the replacement. The East 74th Butcher Block branch, closed HIFI Donuts location and closed-booking White Raven venue are also held out where present. The statewide raw research documents other negative leads even when none matched the current feed.
7. Preserve original IDs and human-reviewed catalog records and the `appliedReviews` ledger. Generate source-imported national IDs deterministically. Refreshes require a reviewed PR; there is no automatic daily import overwriting community work.

## Reproduce this snapshot

The exact public upstream response is archived under `snapshots/btcmap-v4-2026-10-20.json.gz` (ODbL). Its decompressed SHA-256 is:

`f202e7ace77bb61b8f724c46eeef576dae3718124cef9dfbcbb456d755c03a73`

```sh
python3 scripts/national-directory.py research/snapshots/btcmap-v4-2026-10-20.json.gz --as-of 2026-10-20
npm run check
```

Run with `--geocode` only when newly researched public addresses need free US Census address-range estimates. Cached matches are in `geocoded-addresses.json`. RJ Orthodontics uses its own published JSON-LD `GeoCoordinates`; this is explicitly identified in that file. Source-generated import results should be reviewed against newer human changes before merging. Source check dates are recorded separately from acceptance dates; fetching a page today does not reset its historical announcement date.

For a fresh upstream sync, request `https://api.btcmap.org/v4/places` with these `fields`:

```text
id,lat,lon,name,address,icon,verified_at,osm_id,website,phone,payment_provider,osm:addr:city,osm:addr:state,osm:addr:country,osm:addr:street,osm:addr:housenumber,osm:addr:postcode,osm:currency:XBT,osm:payment:lightning,osm:payment:onchain,osm:amenity,osm:shop,osm:tourism,osm:office,osm:craft,description
```

[BTC Map's official API documentation](https://github.com/teambtcmap/btcmap-api/blob/master/docs/rest/v4/places.md) defines `verified_at` and encourages cached snapshots. [Census 2025 cartographic boundaries](https://www.census.gov/geographies/mapping-files/2025/geo/carto-boundary-file.html) supply geographic classification. `scripts/data/us-states.geojson` derives from `cb_2025_us_state_20m.kml`: state code/name and polygon rings, six-decimal coordinates, excluding Puerto Rico for this 50-state/DC scope. Its public source URL is included in the file. `dist/geography.js` uses padded component bounds as a lightweight UI/backend sanity check; final data validation uses the polygons. Read [database attribution](../DATA_LICENSE.md) before reusing the combined database.

See each region's `*-notes.md` and `*-primary.json` for search coverage and links. See `chains-notes.md` for official locator extraction, payment policy, held campus/airport locations, and overriding findings. `chain-conflicts.json` resolves the stale Rolla tenant and Iowa duplicate-coordinate conflicts. Raw regional classifications can be superseded by the final import policy. `national-audit.json` records counts, digest, withheld reasons and state totals. No merchant outreach or test purchases were performed.

## State coverage

| State | All mapped | Merchant source | Dated community | Original article |
| --- | ---: | ---: | ---: | ---: |
| Alabama | 128 | 4 | 124 | 0 |
| Alaska | 42 | 0 | 42 | 0 |
| Arizona | 228 | 7 | 207 | 14 |
| Arkansas | 81 | 4 | 77 | 0 |
| California | 1,265 | 6 | 1,259 | 0 |
| Colorado | 271 | 2 | 269 | 0 |
| Connecticut | 91 | 0 | 91 | 0 |
| Delaware | 13 | 0 | 13 | 0 |
| District of Columbia | 42 | 2 | 40 | 0 |
| Florida | 998 | 78 | 920 | 0 |
| Georgia | 333 | 31 | 302 | 0 |
| Hawaii | 99 | 0 | 99 | 0 |
| Idaho | 73 | 0 | 73 | 0 |
| Illinois | 321 | 58 | 263 | 0 |
| Indiana | 206 | 53 | 153 | 0 |
| Iowa | 59 | 4 | 55 | 0 |
| Kansas | 66 | 0 | 66 | 0 |
| Kentucky | 102 | 16 | 86 | 0 |
| Louisiana | 135 | 0 | 135 | 0 |
| Maine | 40 | 0 | 40 | 0 |
| Maryland | 139 | 0 | 139 | 0 |
| Massachusetts | 149 | 0 | 149 | 0 |
| Michigan | 260 | 16 | 244 | 0 |
| Minnesota | 79 | 1 | 78 | 0 |
| Mississippi | 87 | 4 | 83 | 0 |
| Missouri | 207 | 41 | 166 | 0 |
| Montana | 46 | 0 | 46 | 0 |
| Nebraska | 40 | 0 | 40 | 0 |
| Nevada | 109 | 4 | 105 | 0 |
| New Hampshire | 43 | 1 | 42 | 0 |
| New Jersey | 203 | 3 | 200 | 0 |
| New Mexico | 81 | 1 | 80 | 0 |
| New York | 22 | 3 | 19 | 0 |
| North Carolina | 366 | 8 | 358 | 0 |
| North Dakota | 18 | 1 | 17 | 0 |
| Ohio | 275 | 45 | 230 | 0 |
| Oklahoma | 95 | 2 | 93 | 0 |
| Oregon | 199 | 1 | 198 | 0 |
| Pennsylvania | 321 | 4 | 317 | 0 |
| Rhode Island | 33 | 0 | 33 | 0 |
| South Carolina | 152 | 4 | 148 | 0 |
| South Dakota | 21 | 0 | 21 | 0 |
| Tennessee | 182 | 13 | 169 | 0 |
| Texas | 965 | 19 | 946 | 0 |
| Utah | 103 | 1 | 102 | 0 |
| Vermont | 15 | 0 | 15 | 0 |
| Virginia | 196 | 2 | 194 | 0 |
| Washington | 250 | 2 | 248 | 0 |
| West Virginia | 60 | 2 | 58 | 0 |
| Wisconsin | 118 | 1 | 117 | 0 |
| Wyoming | 25 | 2 | 23 | 0 |
