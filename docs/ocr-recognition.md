# OCR recognition approach

> Geometry (guide, cover-crop, ROI rectangles, live targeting) is documented in
> [`ocr-scanning-geometry.md`](ocr-scanning-geometry.md); empirical history in
> [`ocr-findings.md`](ocr-findings.md); the pipeline seams in
> [ADR-0003](adr/0003-ocr-pipeline.md).

Date: 2026-06-11. This describes how a camera frame becomes a recognized
sticker code after the accuracy rework, and *why* each stage exists. The
guiding principle: **the fixture harness runs the exact shipped pipeline**, so
every claim here is measurable with `cd web && npm run validate:ocr`
(currently 4/4 fixtures; the previous fixed-recipe pipeline recognized 0).

## The recognition chain

```
camera frame (quality preset)            composition.scanOnce
  └─ guide crop (user framing)           cropRoi(framedRegion)
       └─ × 4 rotations                  runPipelineMultiOrientation
            └─ sticker localization      BrightnessLocalizer.locate
                 └─ code-pill ROI        composeRect(sticker, mask ROI)
                      └─ preprocess      toNormalizedGrayscale (invert + stretch + upscale)
                           └─ pill crop  BrightnessLocalizer on the inverted crop
                                └─ OCR   Tesseract (per-attempt {scale, psm})
                                     └─ parse + rank   parseCandidates / rankCandidates
```

### 1. Capture resolution is a named, user-facing setting

`getUserMedia` used to run with no resolution constraints, and many phones
default to 640×480 — the code pill (roughly 32% × 11% *of the sticker*) ends
up a few dozen pixels tall, below what any OCR can read. The scan view now has
a **camera quality** preset (`SD` 640×480, `HD` 1280×720, `Full HD` 1920×1080,
default Full HD), requested as `ideal` constraints so weaker cameras fall back
instead of failing. The choice persists in `localStorage` and the stream
restarts on change (`src/ui/camera-permission.ts`, `CameraQualitySelect`).

### 2. Adaptive preprocessing instead of a fixed threshold

The old pipeline binarized with a hard luminance threshold of 128, which
breaks under glare/shadow. `toNormalizedGrayscale` (in `src/ocr/preprocessor.ts`)
now mirrors the recipe the harness validated: luminance → invert (the code is
light-on-dark) → linear stretch of the 1st..99th percentiles to 0..255 →
nearest-neighbor upscale. It adapts to whatever lighting the crop actually
has. The threshold path remains available behind the `threshold` option.

### 3. Second-stage pill crop

The decisive fix, found by dumping intermediate crops: the ROI crop usually
*contains a human-readable code*, but the sticker's white edge inverts to a
big black band, and Tesseract's block/line segmentation (PSM 6/7) returns
**empty text** on such images. After inverted normalization the pill is the
dominant *bright* region, so a second `BrightnessLocalizer` pass crops down to
it (+8% margin) before OCR. With the band gone, the same crops read at useful
confidence.

### 4. Attempt matrix instead of one fixed recipe

Single-shot OCR on these images is unstable; different photos need different
upscales and segmentation modes. `ocr-profile.json` defines the shared attempt
matrix (`{scale, psm}` pairs, currently scale 2–4 × PSM 6/7, proven order
first). The live `scanOnce` cycles **one attempt per call**, so the existing
hold-loop (300 ms ticks, 5 s budget) and auto-collect loop (850 ms ticks)
sweep the whole matrix over a few ticks without making any single tick
slower. The harness sweeps the same list sequentially.

### 5. Whitelist includes the space

The parser extracts candidates with word-boundary regexes; if Tesseract may
only emit `[A-Z0-9]`, neighbouring noise glues onto the code and the boundary
never matches. The whitelist passed to Tesseract is the profile alphabet plus
`' '`.

## Harness parity (why fixture results predict app behavior)

`web/scripts/validate-ocr.ts` imports the live modules — `BrightnessLocalizer`,
`cropRoi`, `expandRect`, `runPipelineMultiOrientation`, profile, mask config —
and swaps only the I/O:

| Live | Harness |
| --- | --- |
| camera frame at the quality preset | photo file, EXIF-rotated, downscaled to 1080 px (≈ Full HD) |
| user frames the sticker in the guide | `BrightnessLocalizer` bbox + 8% margin |
| canvas → `TesseractAdapter` | sharp PNG → `NodeOcrAdapter` (same engine, same parameters) |

Both Tesseract adapters share the profile (whitelist + space, per-attempt
PSM switching), so a tuning change is measured in the same code path it ships
in. Drop more annotated photos into `web/fixtures/stickers/` (see its README)
to extend the regression set.

## Limits and future work

- **Stylized digits** still misread occasionally (`1`/`7`/`0` in the pill
  font); the constrained post-corrector and font-tuned model ideas live in
  [`plans/01-tesseract-fine-tuning.md`](plans/01-tesseract-fine-tuning.md).
- The fixtures are stills; live frames add motion blur and autofocus hunting.
  The confirm/correct UX remains the safety net — OCR is a hint, not truth.
- Auto-collect pauses after each detection until confirmed (by design); with
  recognition actually firing now, revisit whether a hands-free confirm flow
  is worth it.
