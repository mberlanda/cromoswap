# Cromoswap Design System

Status: draft v0.3
Branch: `codex/cx-design-system`

Cromoswap is the product name for the WC 2026 duplicate sticker scanner and future swap
matcher.

This package is intentionally static and dependency-light:

- `index.html` is the design-system and user-story viewer.
- `styles.css` contains visual tokens, components, and responsive layout rules.
- `app.js` powers the story switcher and small UI state examples.
- `assets/` contains the Cromoswap logo, mark, color-scheme tokens, and CX reference SVGs.
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

- Start, resume, or import a named sticker session.
- Import text lists or JSON backups without overwriting existing sessions.
- Scan with a centered, aspect-ratio sticker frame and nested top-right ROI.
- Fill or clear a full album team in one tap.
- Count duplicate stickers through the My Reps grid and tap-mode control.
- Manage saved duplicate scans from the row-based collection list.
- Export text lists and JSON backups that can be imported later.

## Implementation Assets

- `assets/cromoswap-theme-tokens.css` exposes Cobalt Mint, Grounded Green,
  Sticker Pop, and Night Pitch schemes as CSS custom properties.
- `assets/cromoswap-theme-tokens.json` exposes the same values plus component mappings
  for code generation or Rails/React configuration.
- `assets/album-batch-control.svg`, `assets/reps-counter-grid.svg`,
  `assets/centered-sticker-frame.svg`, and `assets/import-restore.svg` are compact CX
  reference assets for implementation tickets and docs.

## Self-Review Notes

- Mobile-first phone frames use a 390 x 844 target.
- Primary actions stay in the lower third of scanning and import screens.
- The scan overlay uses a centered sticker frame, with the ROI nested in the top-right.
- Album and reps grids share chip geometry while preserving binary vs counter semantics.
- Cobalt Mint is the default brand direction: navy and cobalt add app presence while
  mint remains the scanner, targeted-frame, and ownership anchor.
- Token assets are simple CSS and JSON so the web service can consume them directly.
