# Official chain census and payment evidence

Checked October 20, 2026. This file documents one shared payment-policy finding rather than repeating policy prose across hundreds of records. `chains-primary.json` is the complete 392-row response from the current public Steak 'n Shake locator, classified into 384 `merchant-confirmed` records, seven `needs-review` rows and one excluded duplicate. It is a census of the official locator response, not a guarantee that every restaurant in existence appears in that response or that a payment was performed at each one.

## Steak 'n Shake

### Shared payment-policy evidence

- [Current merchant terms](https://www.steaknshake.com/terms-of-use/), section 8, last modified June 3, 2025, permits BTC for certain in-store/drive-through orders using a wallet and QR payment. Terms remain live when checked today. BTC payments are final; discretionary refunds use dollars. The merchant does not add a BTC fee; wallet/network charges may apply. Do not infer all online/app orders support Bitcoin from this policy.
- [Official payment partner Speed's nationwide rollout account](https://www.tryspeed.com/blog/steak-n-shake-now-accept-bitcoin-with-speed), May 23, 2025, explicitly says Lightning was integrated at all 393 US locations. [Speed's case study](https://www.tryspeed.com/steaknshake) independently documents the all-US launch from May 16, 2025. These are primary sources from the integration provider. The historical count 393 is not used as today's branch count.
- Classification combines that explicit nationwide payment rollout with the merchant's still-live BTC terms and its current official restaurant locator. This is chainwide primary corroboration, not separate local payment testing. A later closure, local refusal or missing checkout option must override it. No on-chain capability was inferred; `onchain` is false because the supported retail rail established here is Lightning.

### Exact official location-data source

1. [Official locator](https://www.steaknshake.com/locations/).
2. Its [public JavaScript loader](https://www.steaknshake.com/wp-content/themes/steaknshake/js/common.js) calls the WordPress public AJAX action `get_location_data_from_plugin`.
3. [Direct public JSON URL](https://www.steaknshake.com/wp-admin/admin-ajax.php?action=get_location_data_from_plugin) returns the same 392-row result as the loader's read-only POST request (`action=get_location_data_from_plugin`). No login, credentials, private endpoints or merchant outreach used. Browser search parser cannot render this JSON; it was retrieved with a standard HTTP client.
4. Coordinates come directly from each response row's `address.loc` array: longitude first, latitude second. They were parsed as numbers without geocoding, centroid substitution or guesses. All 388 supplied pairs fall within contiguous-US bounds. Four rows supply empty coordinate strings; those records omit `lat`/`lon` entirely.
5. Each `evidenceUrl`/`website` is the official branch page generated from the returned slug. `sourceId` preserves that slug, and `chainLocationId` preserves the merchant's own branch identifier. `paymentEvidenceUrls` points to the shared payment sources above.

### Detail-page verification and classification

Every one of the 392 official detail URLs was requested, using at most two concurrent read-only requests. There were 388 successful HTTP 200 detail pages and four HTTP 500 responses, all associated with the four coordinate-less university rows. Address text on every successfully retrieved page matched its locator street/venue text after removing markup and punctuation. Twenty Chicago-area pages use the merchant's newer Elementor template; they are real detail pages, not missing locations. They were checked by their actual visible address text rather than by an old CSS class.

Visible page text, excluding script templates/comments, contained no explicit permanent/temporary closure or coming-soon notice. The JSON response's `status` field was empty on all 392 rows, and no row had a `closed_reason`. These are limited to source observations, not claims of physical observation. A `12am - 12am` hours string was not treated as a closure; hours were deliberately not normalized into public opening-hour claims.

- **384 confirmed candidates:** current official locator records, functioning branch pages, full physical street addresses and original supplied coordinates, combined with shared explicit nationwide Lightning evidence.
- **Seven review-only rows:** campus/airport records for which the official locator supplies a venue rather than an exact street address. These must not be pinned speculatively. Four also lack coordinates and return HTTP 500: South Texas College (McAllen), Florida Atlantic University (Boca Raton), East Carolina University (Greenville), VCU Student Commons (Richmond). Three have coordinates but still need premises/access details: Georgia State University (Atlanta), Western Kentucky University (Bowling Green), Fort Lauderdale-Hollywood International Airport.
- **One excluded duplicate:** Bradenton “106 Cortez Road West” and “106 Cortez Road East” share official branch ID 84, ordering ID 84, identical phone and identical coordinates. Both detail pages exist. Retain the East record once and exclude the West duplicate; do not count or map two restaurants at the same premises. If an existing BTC Map record uses West spelling, match by coordinates and branch identity before adding a new East record.

Four casino-hosted Nevada branches originally had venue-only addresses. They were resolved with the hosts' current official restaurant and contact pages, while retaining the original locator coordinate pair:

| Branch | Current host source | Exact address source |
| --- | --- | --- |
| Fremont | [Restaurant](https://fremont.boydgaming.com/dine/steak-n-shake-fr) | [200 Fremont Street](https://fremont.boydgaming.com/explore/directions) |
| Cannery | [Restaurant](https://cannery.boydgaming.com/dine/steak-n-shake-cn) | [2121 East Craig Road, North Las Vegas](https://cannery.boydgaming.com/explore/directions) |
| OYO | [Dining](https://www.oyolasvegas.com/dining/index.html) | [115 East Tropicana Avenue](https://www.oyolasvegas.com/contact/index.html) |
| South Point | [Restaurant](https://southpointcasino.com/dining/steak-n-shake) | [9777 Las Vegas Blvd South](https://southpointcasino.com/) |

The map point is for the restaurant, not Bitcoin acceptance by the casino/hotel itself. Hosts may impose venue access rules, and their nonparticipation in some corporate specials does not establish Bitcoin refusal.

### Coverage counts

The raw official response covers 22 states plus DC. Confirmed candidates cover 21 states plus DC; Virginia's sole returned university entry remains held for review.

| Region | Confirmed records |
| --- | ---: |
| AL | 4 |
| AR | 3 |
| CA | 2 |
| CO | 1 |
| DC | 1 |
| FL | 77 |
| GA | 29 |
| IA | 4 |
| IL | 56 |
| IN | 52 |
| KY | 15 |
| MI | 13 |
| MO | 38 |
| MS | 4 |
| NC | 6 |
| NV | 4 |
| OH | 43 |
| OK | 2 |
| SC | 3 |
| TN | 12 |
| TX | 13 |
| WV | 2 |
| **Total** | **384** |

Deduplicate against the national BTC Map import by exact address and proximity before adding. This chain file may be useful for filling incomplete BTC Map addresses even when the restaurant is already mapped. Preserve BTC Map identity when confidently matching, and preserve the distinct primary source provenance.

## REEDS Jewelers: no verified chain census added

The [current corporate homepage](https://www.reeds.com/) places Bitcoin in a shopping/payment paragraph that also discusses in-store and online service. The [Bitcoin in-store gift-card product](https://www.reeds.com/bitcoin-instore-purchase.html) is another current merchant-owned clue. Neither establishes an explicit current all-branches direct BTC acceptance policy or exact transaction procedure sufficiently for this task's chainwide standard. No new confirmed REEDS branches were generated. Previously collected AL/MS leads remain `needs-review`; a fresh explicit policy or branch-specific confirmation is required before promoting them.

No assumptions were made that all merchants using Square or any payment provider automatically enable Bitcoin. No outreach, account changes, purchases or publication occurred during this research.

## Follow-up conflicts: this overrides the initial classifications

Apply `chain-conflicts.json` after this census. Freddy's [official December 16, 2025 opening announcement](https://www.freddys.com/blog/freddys-rolla-opens-tuesday) establishes a replacement tenant at 2004 N. Bishop Avenue, Rolla. Exclude the former Steak 'n Shake despite its still-live locator/detail page. Do not transfer its Bitcoin claim to Freddy's. This reduces the initial 384 chain candidates by one before national deduplication.

The Davenport and Coralville Iowa matches are the same businesses in both sources: exact addresses, branch URLs and phones agree. Their official locator pins differ from BTC Map's address-tagged building points by about 176 and 227 metres. Merge provenance into the existing BTC Map records and preserve their building points. Census address checks confirm the address strings but return interpolated street-range coordinates, so they do not independently establish a better rooftop location.
