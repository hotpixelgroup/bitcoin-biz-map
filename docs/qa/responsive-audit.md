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
