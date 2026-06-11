# OCR findings from real sticker backs

> Framing and crop geometry (centered guide, aspect ratios, ROI, live targeting) is
> documented in [`ocr-scanning-geometry.md`](ocr-scanning-geometry.md).


Date: 2026-06-04. Source: four real Panini WC 2026 backs (`CRO 20`, `GHA 1`, `GHA 7`,
`FWC 17`) under `web/fixtures/stickers/` (gitignored). Measured with
`npm run validate:ocr`.

## Setup

The fixtures are full phone photos (a sticker on dark fabric), so the harness:

1. **Auto-detects the sticker** as the largest bright connected component on the dark
   background (a stand-in for the future `Localizer` / the user filling the frame).
2. Applies the same orientation **ROI** from `assets/mask-config.json` within that bbox.
3. **Inverts + upscales** the crop (the code is light text on a dark pill) and OCRs it,
   trying a few scale/PSM combos — mirroring the live hold-while-focused loop.

## Results

- **~1/4 reliably read** (`CRO 20` → `CRO20`). The others land *close* but misread:
  `GHA 1` → "GHAL", `FWC 17` partially, etc.
- Recognition is **unstable**: which fixture passes flips with small scale/PSM/crop
  changes — single-shot OCR on these images is not dependable.

## What this confirms / changed

- **Confirm-correct is the right product design** (per the spec). OCR is a hint, not a
  source of truth; the fast correction UX + the multi-attempt, multi-orientation,
  5s-timeout loop carry the experience.
- **Inversion is required** and was missing: the pill is light-on-dark, so the
  preprocessor produced white-on-black (unreadable by Tesseract). `toGrayscaleThreshold`
  now takes an `invert` flag (default on in the pipeline). This is the one concrete bug
  the real images surfaced.

## Main blockers for higher accuracy (future work)

1. **Precise pill localization.** The bbox auto-detect can run high (glare/stack edges),
   so the ROI clips or includes fabric. A `BrightnessLocalizer` (ADR-0003 Level-2 bbox
   seam) is now **shipped** and the pipeline takes the ROI relative to the detected
   sticker; perspective-rectify (deskew) is the remaining step.
2. **Stylized bold digits.** `1`/`7`/`0` in the pill font misread. Plan to fix via a
   font-tuned Tesseract model (+ a cheap constrained post-corrector first):
   see [`docs/plans/01-tesseract-fine-tuning.md`](plans/01-tesseract-fine-tuning.md).
3. **Capture quality.** Live capture (sticker filling the frame, steady focus) should
   beat these incidental background photos; worth re-measuring with in-app captures.

The harness (`web/scripts/validate-ocr.ts`) stays as the tuning/regression tool — drop
more annotated backs into the fixtures folder and re-run.

## Follow-up (2026-06-11): live pipeline rework — 4/4 fixtures

The blockers above were largely addressed in the OCR accuracy rework
(documented in [`ocr-recognition.md`](ocr-recognition.md)):

- The harness now runs the **shipped pipeline** (it previously ran its own
  sharp recipe, so tuning didn't transfer to the app).
- Fixed threshold-128 binarization → **percentile contrast stretch**.
- New **second-stage pill crop**: the inverted sticker edge produced a black
  band that made PSM 6/7 return empty text; cropping to the bright pill fixed
  `CRO 20`, `GHA 1`, and `GHA 7` outright.
- The live loop sweeps the shared **{scale, psm} attempt matrix** (one
  attempt per tick) instead of repeating one recipe.
- **Camera quality presets** (default Full HD) replace unconstrained
  `getUserMedia`.

Result: **4/4 fixtures recognized** (`npm run validate:ocr`), three of them on
the first attempt (scale 3, PSM 6). Stylized-digit confusion remains the next
accuracy frontier (see plan 01).
