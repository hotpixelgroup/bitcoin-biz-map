# Responsive viewport audit

The audit covered fresh root visits, full-list mode, selected business details, and the state directory. The browser was the Codex in-app Chromium browser with CSS viewport overrides. These checks are evidence for the tested layouts, not physical-device Safari/Firefox certification or a complete WCAG audit.

| Viewport | Default map and list | Selected pin clear of details | Directory and expanded rows | Horizontal page overflow |
|---|---|---|---|---|
| 320 × 568 | Pass | Pass | Pass | 0 px |
| 360 × 640 | Pass | Pass | Pass | 0 px |
| 375 × 667 | Pass | Pass | Pass | 0 px |
| 390 × 844 | Pass | Pass | Pass | 0 px |
| 430 × 932 | Pass | Pass | Pass | 0 px |
| 568 × 320 | Pass | Pass | Pass | 0 px |
| 667 × 375 | Pass | Pass | Pass | 0 px |
| 844 × 390 | Pass | Pass | Pass | 0 px |
| 760 × 900 | Pass | Pass | Pass | 0 px |
| 761 × 900 | Pass | Pass | Pass | 0 px |
| 768 × 1024 | Pass | Pass | Pass | 0 px |
| 820 × 1180 | Pass | Pass | Pass | 0 px |
| 1023 × 768 | Pass | Pass | Pass | 0 px |
| 1024 × 768 | Pass | Pass | Pass | 0 px |
| 1280 × 720 | Pass | Pass | Pass | 0 px |
| 1440 × 900 | Pass | Pass | Pass | 0 px |
| 1920 × 1080 | Pass | Pass | Pass | 0 px |
| 2560 × 1440 | Pass | Pass | Pass | 0 px |

For each compact size, switching to the full list removes the map from painting and hit testing. Business details stay inside the map region, and a separate selected-pin layer remains visible outside the details panel. Default map buttons had no intersecting rectangles after the fixes. The directory test expanded Alabama's 128 rows at every size.

Additional browser checks:

- Four-stop shared trails, including the catalog's longest business name, fit without row or page overflow in light and dark mode at 320 × 568, 390 × 844, 568 × 320, 820 × 1180, 1024 × 768, and 2560 × 1440.
- Location dialogs and suggestion forms fit at 320 × 568, 568 × 320, 820 × 1180, and 1440 × 900. ZIP lookup returns the expected Scottsdale area; dialogs scroll when their contents exceed the available height.
- A three-stop route previews successfully (19.6 miles) at 640 × 450, the CSS reflow width/height corresponding to 200% on a 1280 × 900 viewport. The orange route survives resizing to tablet size without console errors. This was a reflow-equivalent check, not a physical browser zoom certification.
- A selected business survives live resizing between 390 × 844, 844 × 390, 820 × 1180, and 1024 × 768, with its pin still clear of the panel and no page overflow.
- Arrow Down collapses the places panel and resets the filter toggle. Escape closes details and restores focus to the view switch; Escape closes location choices and restores focus to their trigger.
- Map attribution moves above compact panels. Native form controls use 16 px text in compact layouts to avoid iOS input zoom.

Primary text contrast checks (sRGB): muted light text `#62695f` on `#f7f7f2`: 5.27:1; on white: 5.67:1. Muted dark text `#a0aa9e` on `#202620`: 6.43:1. Orange-button text `#30200b` on `#f7931a`: 6.84:1. This is a targeted check of primary text colors, not a claim that every possible overlay/interaction has received a WCAG certification.

## Repeat before releasing layout changes

1. Serve `dist/` and use the viewport list above. Start at the root URL with no hash or state filter.
2. Confirm tiles, orange pins, and places render; inspect map controls for intersections. Switch to the full list and select a business. Verify the selected pin is visible above/beside the detail panel.
3. Check directory headers, expanded rows, long-name trails, both themes, and dialogs at narrow, short landscape, tablet, and desktop sizes.
4. Resize while details and a route are open. Check keyboard collapse/Escape and restored focus.
5. Run `npm run check`; keep `BitcoinExplorer.COMPACT_WIDTH` and the CSS media queries aligned. Review the screenshots and verify the deployed root URL after Pages finishes.

## Safari follow-up — 2026-10-20

Tested the installed macOS Safari 27.0.1 in Responsive Design Mode at 390 × 844, 844 × 390, and 320 × 568 (3× pixel ratio). This exercises Safari's WebKit rendering at phone dimensions; it does not reproduce an iPhone's browser chrome, software keyboard, safe areas, or physical touch input. No simulator or additional browser was installed.

- Portrait map tiles, orange markers, map/list switching, search, selected details, and ZIP suggestions worked. Choosing the Scottsdale ZIP result set the approximate starting area.
- Dark landscape kept the selected Echo Coffee marker above the scrollable detail panel. The narrow dark layout and Alabama's expanded 128-row directory fit without visible horizontal clipping.
- Correction, suggestion, and payment-report forms opened in short landscape. Contents scrolled, the close control stayed reachable, the native date picker opened, and submitting an empty suggestion stopped at the required business-name field. No fabricated reports were submitted.
- Found and fixed a focus regression: Safari pointer clicks do not focus the opening link, so native dialog focus restoration returned to the page. The submission dialog now remembers its actual triggering link and restores focus without scrolling. Verified both Escape and the close button in the local Safari build at 320 × 568.
- Release checks: `npm run check` passed (52 tests, national-data validation, and Pages smoke check).

## Map-area regression — 2026-10-20

Reproduced the failure on the public map: choosing Scottsdale limited the map to 27 listings; zooming out four times and pressing Search this area still kept the Scottsdale filter and those same 27 listings.

User-driven dragging, wheel zoom, zoom buttons, keyboard map movement, cluster zoom, and pinch gestures now replace prior geographic restrictions with the current viewport. Explicit Search this area uses the same policy. City/state/ZIP text searches are released when exploring elsewhere; business keywords, category, payment, evidence, saved-place selection, starting location, and trails are retained. Programmatic framing for filters, selected places, routes, and resizing does not activate exploration.

Browser checks used in-app Chromium at 1280 × 720 and 390 × 844: desktop zoom expanded 27 to 329 listings; explicit area search cleared both Arizona and Scottsdale; a 5-mile nearby selection expanded from 20 to 106 listings with its radius cleared; dragging and wheel zoom refreshed the viewport results; a coffee keyword stayed active. On the phone viewport, four zoom-outs expanded 27 to 1,655 listings across the Southwest, and Search this area returned the same current-area count. No horizontal page overflow or console errors were observed. These are browser-emulation checks, not physical-device touch certification.

`npm run check` passed with 54 tests, including regressions for replacing old geographic restrictions and retaining business-keyword filters. The obsolete ChatGPT-hosted Arizona prototype forwards to the maintained public map; its forwarding checks preserve old listing links while dropping arbitrary query/authentication data.
