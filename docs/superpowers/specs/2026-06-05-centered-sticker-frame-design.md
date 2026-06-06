# Centered aspect-ratio sticker frame + live targeting

Date: 2026-06-05. Status: ✅ Implemented (#29).

## Problem

The scanner overlay only draws the top-right OCR ROI box. There is no centered guide
that reflects the sticker's physical shape, so users have no feedback about whether the
sticker is framed well, and OCR relies entirely on `BrightnessLocalizer` finding the
sticker anywhere in the full captured frame.

Panini WC 2026 backs have a consistent physical aspect ratio of ~3:4:

- Portrait: W/H ≈ 0.75
- Landscape: W/H ≈ 1.333
- equivalently `max(w,h) / min(w,h) ≈ 1.33`

The code label (`GHA 1`, `FWC 17`, …) sits in a rounded pill in the top-right corner.
Portrait OCR ROI (normalized inside the sticker): `left 0.64, top 0.02, right 0.96,
bottom 0.13` → `{x: 0.64, y: 0.02, w: 0.32, h: 0.11}`.

## Goals

1. Draw a **centered** guide rectangle locked to the sticker aspect ratio per orientation.
2. A **size slider** (initial-phase tuning control) to grow/shrink the guide.
3. **Flip the guide border green** when a sticker is well targeted (live feedback).
4. Take the **OCR ROI relative to the centered guide**, not the whole frame.
5. Document the geometry/algorithm and link it from the README.

Landscape math is best-effort and meant to be iterated; all tunable numbers live in
`assets/mask-config.json` so they can be adjusted without code changes.

## Coordinate spaces

The preview `<video>` is `object-fit: cover` into a fixed portrait box, so the displayed
pixels are a center-crop of the camera frame. Two spaces:

- **Display space** — 0–1 within the preview box (what the overlay/CSS uses).
- **Frame space** — 0–1 within the captured `videoWidth × videoHeight` frame (what crop +
  OCR use).

The preview box stays a fixed portrait shape. A landscape sticker shows a *wide* guide
inside the same portrait preview (we do not rotate the preview).

## Components

### `web/src/ocr/geometry.ts` (pure, unit-tested)

- `centeredRect(orientation, size, boxAspect): RelativeRect` — guide in **display** space.
  Locks W/H to the orientation aspect (portrait 0.75, landscape 1.333), centers it, scales
  the longer side to `size`. `boxAspect = boxW/boxH` of the preview (3/4 = 0.75).
  - portrait (Rs<1, taller): `nh = size`, `nw = size * (Rs / boxAspect)`
  - landscape (Rs>1, wider): `nw = size`, `nh = size * (boxAspect / Rs)`
  - then `x = (1-nw)/2`, `y = (1-nh)/2`. Clamp nw/nh ≤ 1.
- `coverMapRect(displayRect, frameW, frameH, boxAspect): RelativeRect` — maps a display
  rect into **frame** space, accounting for the cover center-crop. Compute the visible
  sub-rect of the frame for the cover fit, then place `displayRect` inside it.

### `MaskOverlay.tsx`

Props: `orientation`, `size`, `targeted`. Renders:

- the centered **frame** (`centeredRect`, display %), border amber→green via `targeted`;
- the **OCR ROI box** nested inside the frame, from `maskConfig.orientations[o].roi`
  (relative to the frame, via existing `composeRect` math applied as nested CSS %).

### `SizeSlider.tsx`

Range input 0.40–0.95 (step 0.01), labeled, accessible. Lives in `scan-bottom`.

### Live targeting loop (`App.tsx` + composition)

`deps.detectTargeted(orientation, size): Promise<boolean>`. While Reps tab + camera
granted and not `scanning`, an interval (~350ms) grabs a downscaled frame, maps the
centered rect via `coverMapRect`, crops, runs `BrightnessLocalizer`, and returns true when
the bright region fills most of the crop (area fraction ≥ ~0.55) and its aspect ratio is
within tolerance of 1.33 (`max/min` in [1.15, 1.55]). Drives `targeted` state → green.

### Capture (`scanOnce(orientation, size)`)

Crop the captured frame to `coverMapRect(centeredRect(...))`, then run the existing
`runPipelineMultiOrientation` (BrightnessLocalizer refinement + OCR ROI) on that crop.

### `mask-config.json`

Update `aspectRatio` to 0.75 / 1.333 and portrait `roi` to `{0.64, 0.02, 0.32, 0.11}`.
Re-derive landscape `roi` analogously (tunable).

## Testing

- `geometry.test.ts`: aspect ratios, centering, size scaling, clamp, cover mapping
  (square vs wide frame, identity when frame aspect == boxAspect).
- Overlay test: renders frame + ROI; green class toggles with `targeted`.
- Slider test: change fires callback with clamped value.
- Capture: existing pipeline tests stay; add a crop-region assertion.

## Docs

`docs/ocr-scanning-geometry.md` — aspect model, two coordinate spaces, ROI normalization,
targeting heuristic. Linked from `README.md`; cross-linked with `docs/ocr-findings.md`.

## Build order

geometry (TDD) → overlay + CSS → slider → capture crop → live loop → mask-config → docs.
