# OCR findings from real sticker backs

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
   so the ROI clips or includes fabric. A real `Localizer` (contour detect + rectify,
   the ADR-0003 Level-2 seam) would isolate the pill far better than a static ROI.
2. **Stylized bold digits.** `1`/`7`/`0` in the pill font misread. Options: a
   Tesseract model fine-tuned on the pill font, or a small classifier trained on the
   corpus (ADR-0003 Level-3).
3. **Capture quality.** Live capture (sticker filling the frame, steady focus) should
   beat these incidental background photos; worth re-measuring with in-app captures.

The harness (`web/scripts/validate-ocr.ts`) stays as the tuning/regression tool — drop
more annotated backs into the fixtures folder and re-run.
