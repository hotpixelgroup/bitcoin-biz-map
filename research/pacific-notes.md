# Pacific and Northern Rockies primary research

Checked 2026-10-20. States searched: California, Oregon, Washington, Alaska, Hawaii, Idaho, Montana. This is a primary-evidence corroboration sample, not an exhaustive merchant census. National BTC Map coverage is being collected separately. No merchant was contacted and no payment was attempted. Reading a currently published merchant statement confirms that statement; it does not establish that a cashier will successfully take payment today.

`pacific-primary.json` contains 14 records: 8 merchant-confirmed, 5 needs-review, and 1 excluded. Boolean false payment rails mean unconfirmed, not a claim that the rail is unavailable. Coordinates are deliberately omitted rather than guessed. Match confirmed addresses against BTC Map/OSM or geocode with an attributed source before publishing.

## State results

| State | Result |
| --- | --- |
| CA | Five merchant-confirmed candidates: Sonia Boyajian, Noun Coffee + Wine, Motorhelmets, Robotic Hair Restoration Center, CV Coins & Collectables. Conditions matter: appointments, phone arrangements, purchase limits and processing fees are preserved in JSON. |
| OR | Hevel Massage confirmed directly. Prime Vital Health is a needs-review lead because the merchant preparation page could only be read in the search index, direct fetch failed, and old pandemic text remains. |
| WA | Briz Loan & Guitar and Riolo Orthodontics confirmed directly; Briz supports BTC/LN/Liquid and offers a discount on purchases, while pawn pickups require cash. Riolo limits BTC to part of the treatment fee. |
| AK | No current merchant-owned acceptance statement meeting the location standard was verified in this pass. Historical Alaska Robotics reports (2014) were not treated as current. Thai Alaska Kitchen appears in recent BTC Map mirrors but no direct merchant statement was found. No conclusion that Alaska has no Bitcoin merchants should be drawn. |
| HI | Drip Studio HNL has a 2024 local news owner interview about Bitcoin and a current merchant menu/address, but is retained as needs-review rather than claiming current merchant-owned confirmation. Many Honolulu/Sunrise Shack results simply repeat OSM. |
| ID | Malad Valley Marathon organizer confirms on-chain BTC and explicitly says no Lightning, but this is an annual event. TOURA has a 2026 merchant newspaper advertisement accepting BTC but no confirmed visitable office. Both need different treatment from permanent storefronts. |
| MT | Helena Express directly confirms BTC for shipment pickups; kiosks are not proven to accept BTC. White Raven Venue & Retreat must be excluded because official FAQ says no new bookings. Do not confuse with White Raven Winery in Columbia Falls, for which only a community comment was found. |

## Exclusions and caveats found while checking

- **White Raven Venue & Retreat, Montana:** [Official FAQ](https://www.whiteravenmontana.com/faq) says no new bookings, despite its retained Bitcoin offer. Existing reservations only. Saved as `excluded` per root request so a broad data import can block it.
- **Prometheus Exotics, California:** [Official homepage](https://prometheusexotics.com/) confirms BTC through BitPay but labels its Irvine address as virtual and withholds the vehicle pickup address until booking. Do not pin the virtual office. Not included in candidate JSON because a visitable address is lacking.
- **Sea Life Park Hawaii:** [Official FAQ](https://www.sealifeparkhawaii.com/plan-your-visit/faqs/) explicitly says cryptocurrencies are not accepted. Exclude if it appears in broad results.
- **Charity donation pages:** DoveLewis, Pride Northwest, Alaska Diocese and others accept BTC donations, but donation-only acceptance does not establish payment for goods or services; excluded from this business research.
- **Exchange/ATM listings:** All excluded. Hosting a Bitcoin ATM is not proof a shop accepts Bitcoin for its own products.
- **Seeds Here Now, 707 Seedbank, WW2 Helmets, VIP Produce:** Some direct BTC statements found, but no clear public visitable retail location was established. They were not promoted onto a physical map.
- **Marty's Place at Strawbridge Farm:** Indexed official BTC statement was over a decade old and returned an `ww1` host. Not trusted as current evidence.
- **Lake Missoula Tea Company:** A [2015 University of Montana thesis](https://scholarworks.umt.edu/utpp/22/) records a student helping implement Bitcoin, but the age makes it insufficient evidence of current merchant acceptance.
- **Prime Vital Health:** [Indexed preparation page](https://primevitalhealth.squarespace.com/prepare) has BTC offer; [merchant contact page](https://primevitalhealth.squarespace.com/contact) supplies address. Retain needs-review until direct current page/merchant confirmation.

## Method

Searched combinations of each state/city, Bitcoin, merchant names, acceptance/payment terms, then checked official merchant pages. Directory mirrors (Bitcoin Cities, Mapping Bitcoin, Coinmap, SatSpots, Cryptwerk) supplied leads only and were not independently promoted to merchant-confirmed. Noun's evidence is an August 2026 primary interview by its actual payments processor quoting both owners, paired with an address from Noun's own website. All summaries are paraphrased; exact URLs and conditions are recorded for review.
