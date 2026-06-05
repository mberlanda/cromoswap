# OCR scanning geometry

How the live scanner frames a sticker and crops the region the OCR reads. Implemented in
[`web/src/ocr/geometry.ts`](../web/src/ocr/geometry.ts); the recognition that runs on the
crop is described in [`docs/adr/0003-ocr-pipeline.md`](adr/0003-ocr-pipeline.md) and the
real-world accuracy notes in [`docs/ocr-findings.md`](ocr-findings.md).

## Sticker aspect ratio

Panini WC 2026 backs are consistently ~3:4 (width:height). Measured from sample backs:

| Orientation | W/H       |
| ----------- | --------- |
| Portrait    | 0.75      |
| Landscape   | 1.333     |

Equivalently `max(w, h) / min(w, h) ≈ 1.33`. These are the `aspectRatio` values in
`assets/mask-config.json` (`portrait = 3/4`, `landscape = 4/3`) and `STICKER_ASPECT` in
`geometry.ts`.

## The centered guide

The scanner draws a single rectangle, **centered** in the camera preview and locked to the
sticker aspect ratio for the selected orientation. A size slider scales it (longer side
from 40% to 95% of the matching preview dimension); the aspect ratio never changes. The
border turns **green** when a sticker is well aligned (see *Live targeting*).

`centeredRect(orientation, size, boxAspect)` returns the guide in **display space** (0–1 of
the preview box). The preview box itself stays a fixed portrait shape, so a landscape
sticker shows a *wide* guide inside the same portrait preview — we never rotate the preview.

## Two coordinate spaces

The preview `<video>` uses `object-fit: cover`, so the pixels shown are a center-crop of
the raw camera frame. Two normalized spaces, both 0–1:

- **Display space** — within the preview box. Used by the CSS overlay.
- **Frame space** — within the captured `videoWidth × videoHeight` image. Used for cropping
  and OCR.

`coverMapRect(displayRect, frameW, frameH, boxAspect)` maps a display rect into frame space,
accounting for the cover center-crop:

- frame wider than the box → the sides are cropped; map into the visible center column.
- frame taller than the box → the top/bottom are cropped; map into the visible center band.
- equal aspect → identity.

## OCR region of interest (ROI)

The code (`GHA 1`, `FWC 17`, …) sits in a rounded pill in the **top-right** of the sticker.
Normalized inside the sticker (portrait):

```
left = 0.64   top = 0.02   right = 0.96   bottom = 0.13
=> roi { x: 0.64, y: 0.02, w: 0.32, h: 0.11 }
```

Visually (`#` = OCR area):

```
+----------------------------------+
|                         ######## |
|                         ######## |
|                                  |
|                                  |
+----------------------------------+
```

These come from `assets/mask-config.json`, derived from an annotated corpus by
`tools/asset-gen` (`deriveRoi` = union of code boxes + padding). Landscape has its own ROI;
its numbers are best-effort and meant to be iterated by adding annotations and regenerating.
Edit the seed corpus in `tools/asset-gen/src/generate.ts`, run `npm run generate`, and the
config is rewritten — no runtime code change.

## Capture pipeline

1. Capture the full camera frame.
2. Crop to the framed region: `coverMapRect(centeredRect(orientation, size, boxAspect))`.
3. Run `runPipelineMultiOrientation` on the crop — `BrightnessLocalizer` refines the sticker
   bbox inside the crop, then the ROI is taken relative to it, preprocessed (invert +
   upscale), and OCR'd across orientations.
4. Rank valid codes; the top candidate is offered for confirm/correct.

The on-screen guide *is* the localization: the user aligns the sticker, and only that region
is read — far more robust than OCR-ing the whole frame.

## Live targeting

While the scanner is open and idle, a poll (~350 ms) crops the framed region from a live
frame, runs `BrightnessLocalizer`, and calls `isWellTargeted(bbox, cropAspect)`:

- the bright region fills at least ~50% of the crop, **and**
- its pixel aspect ratio is within `[1.15, 1.55]` of 1.33.

When both hold the guide border flips green, giving "you're aligned" feedback before the
user taps **Scan**. The loop pauses during an explicit capture.

## Fine-tuning the ROI (portrait and landscape)

The ROI is the single biggest lever on OCR accuracy: too tight and it clips a digit, too
loose and it feeds the pill plus surrounding artwork. Both orientations are tuned the same
way — only the measured numbers differ.

### 1. Re-measure from a real back

Open a representative back (portrait or landscape) at full resolution and read off the pill
corners **relative to the sticker** (not the whole photo):

```
x = (pixel distance from the sticker's left edge) / sticker width
y = (pixel distance from the sticker's top edge)  / sticker height
```

Take a few samples per orientation — lighting, print drift, and hand angle move the pill a
little. The ROI you want is the box that contains the pill in *all* of them.

### 2. Add them to the corpus and regenerate

Annotations live in [`tools/asset-gen/src/generate.ts`](../tools/asset-gen/src/generate.ts)
as `{ orientation, box: { x, y, w, h } }`. The build derives one ROI per orientation:

```
deriveRoi = union(all boxes for that orientation) expanded by PAD on every side
```

So adding annotations only ever *grows* the ROI to keep covering new pill positions — it
never shrinks below what you've seen. Workflow:

```bash
cd tools/asset-gen
npm run test:run      # deriveRoi / buildMaskConfig stay green
npm run generate      # rewrites assets/ and web/src/assets/ mask-config.json
```

No runtime code changes; the app imports the regenerated `mask-config.json`.

### 3. Knobs, from coarse to fine

| Knob | Where | Effect |
| ---- | ----- | ------ |
| Corpus annotations | `generate.ts` `SEED_CORPUS` | Primary control. More/tighter boxes reshape the ROI. |
| `PAD` | `generate.ts` (currently `0.02`) | Uniform safety margin around the union. Raise if the pill is sometimes clipped; lower if fabric/artwork leaks in. |
| `aspectRatio` | `build-assets.ts` `ASPECT_RATIO` | Nominal sticker shape per orientation (drives the guide via `STICKER_ASPECT`). |
| Guide `size` | `SizeSlider` (40–95%) | Live, per-scan. Shrink to exclude background, grow to fit a sticker held further away. |
| Targeting tolerance | `geometry.ts` `MIN_FILL_FRACTION`, `MIN/MAX_ASPECT_RATIO` | When the green cue triggers. Loosen if it rarely turns green, tighten if it greens on non-stickers. |

### 4. Validate the change

Drop annotated backs into `web/fixtures/stickers/` (gitignored) and run the regression
harness — it applies the same ROI + preprocessing and OCRs the crop:

```bash
cd web && npm run validate:ocr
```

Compare read accuracy before/after. See [`ocr-findings.md`](ocr-findings.md) for how the
fixtures are set up and the known failure modes (stylized digits, inversion).

### Landscape note

Landscape backs are the same physical sticker rotated 90°, so the pill is in the top-right
of the *reading* orientation but proportionally taller relative to the shorter side. Its ROI
is seeded from fewer samples than portrait and is the most likely to need another annotation
pass — follow steps 1–4 with landscape backs specifically.
