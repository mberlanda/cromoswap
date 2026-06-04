# Cromoswap Design System

Status: draft v0.1  
Branch: `codex/cromoswap-design-system`

Cromoswap is the product name for the WC 2026 duplicate sticker scanner and future swap
matcher.

This package is intentionally static and dependency-light:

- `index.html` is the design-system and user-story viewer.
- `styles.css` contains visual tokens, components, and responsive layout rules.
- `app.js` powers the story switcher and small UI state examples.
- `assets/` contains the Cromoswap logo and mark.
- `mockups/jpg/` contains generated JPEG screen mockups.
- `mockups/svg/` contains the SVG sources used to generate the JPEGs.

## Open Locally

Open this file in a browser:

```text
design-system/index.html
```

No dev server is required.

## Regenerate Mockups

The generator writes SVG sources and exports JPEGs with ImageMagick:

```sh
node design-system/scripts/generate-mockups.js
```

If ImageMagick is unavailable, the script still writes the SVG mockup sources.

## Included User Stories

- Start or resume a named sticker session.
- Grant camera access or continue manually.
- Scan the top-right sticker code region.
- Confirm or correct a detected code.
- Correct or manually enter a code.
- Manage saved duplicate scans.
- Export text or JSON for future swapping.

## Self-Review Notes

- Mobile-first phone frames use a 390 x 844 target.
- Primary actions stay in the lower third of scanning and confirmation screens.
- The scan overlay highlights the top-right ROI explicitly.
- The palette uses green, blue, amber, coral, and violet accents rather than one hue.
- The logo remains readable as both full wordmark and compact mark.
