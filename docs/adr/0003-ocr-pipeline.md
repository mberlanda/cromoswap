# ADR-0003: OCR pipeline, scan mask, and corpus

Status: accepted · Date: 2026-06-04

## Context

OCR is an unreliable input. Sticker codes (`<PREFIX><NN>`) sit near the **top-right
corner** of the sticker back, in a fairly consistent position, with a known aspect ratio
(portrait default, some landscape). We want maximum accuracy from a browser OCR engine
(Tesseract.js) while keeping the pipeline deterministic and testable without a camera, and
we want a clean path to more robust detection later.

The owner asked to explore an **ID/passport-style scan mask**: a guide overlay plus a
known field zone, OCR'd in isolation — and a **corpus** of sticker images used to derive
those assets, with TypeScript generating the assets.

## Decision

### Pipeline (injectable modules)

```
CameraSource → MaskOverlay (UI) → RoiCropper (top-right, from mask-config)
→ Preprocessor (grayscale/threshold/scale) → OcrAdapter [interface]
→ CodeParser (normalize) → CodeValidator (prefix∈dict, 01–20)
→ CandidateRanker → ScanController (debounce, confirm/correct/skip/rescan)
```

Each stage is a separable, independently testable unit communicating through typed
interfaces. The biggest accuracy lever is OCR-ing only the small, predictable top-right
ROI instead of the full noisy frame.

### Scan mask — Level 1 (MVP)

- A guide overlay matching the sticker aspect ratio (portrait default; landscape toggle)
  with an emphasized top-right ROI target box.
- `RoiCropper` crops the fixed ROI rectangle from the frame using `mask-config.json`.
- No contour detection or perspective rectification in the MVP.

### Corpus → generated assets

A build-time TypeScript tool (`/tools/asset-gen`) ingests an annotated corpus (sticker-
back photos + code bounding boxes) and emits versioned static assets consumed by `/web`:

- `mask-config.json` — canonical aspect ratio(s) + relative top-right ROI rectangle
  (e.g. `x: 62–96%, y: 2–18%`), per orientation.
- `prefixes.json` — the 49 valid prefixes.
- `ocr-profile.json` — Tesseract char whitelist (`A–Z0–9`) + page-segmentation hints.

The runtime reads these deterministically, so the pipeline is fully testable with fixtures
and a `MockOcrAdapter`.

### Designed extension seams (not built in MVP)

- `OrientationStrategy`: implemented as `runPipelineMultiOrientation`, which tries
  `0/90/180/270°` and keeps the highest-confidence reading per code before asking the user
  to correct.
- `Localizer`: MVP uses the static ROI; later adds contour detection + perspective
  rectify (Level 2, e.g. OpenCV.js), then optionally a corpus-trained detector (Level 3).
- `OcrAdapter`: `TesseractAdapter` (runtime) and `MockOcrAdapter` (tests) implement one
  interface; swapping engines does not touch consumers.

## Alternatives considered

- **Full-frame OCR, no mask** — simplest, but poor accuracy and slow on noisy frames.
- **Level 1+2 (contour rectify) in the MVP** — more robust to angle/distance, but adds a
  CV dependency and heavier tests. Deferred behind the `Localizer` seam.
- **Trained detector now** — highest robustness, far too heavy for the MVP; the corpus and
  asset format are designed so it can plug in later.

## Consequences

- High accuracy with no CV dependency in the MVP; the confirm/correct loop covers misses.
- Generated assets are versioned and diffable; regenerating from a larger corpus is a
  pure build step with no runtime change.
- Adding orientation handling or contour rectification later is additive, not a rewrite.
