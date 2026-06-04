# Plan — Font-tuned Tesseract model for sticker codes

Status: proposed · Date: 2026-06-04

## Goal

Improve recognition of the sticker code pill (`<PREFIX><NN>`, e.g. `CRO 20`, `FWC 17`)
which is rendered in a **bold, condensed display font, light-on-dark**. Stock `eng`
misreads it (see [`docs/ocr-findings.md`](../ocr-findings.md): ~1/4 on real photos, digits
like `1`/`7`/`0` confused). We will fine-tune a Tesseract 5 LSTM model on this font and
ship it to the browser via tesseract.js.

This complements, and is sequenced after, two cheaper wins already in place or planned:

1. **Inversion + Localizer** (shipped): the pipeline inverts the light-on-dark pill and
   crops relative to the detected sticker.
2. **Constrained post-correction** (recommended first — see "Cheaper alternative"): the
   code space is tiny and known, so snapping OCR output to the nearest valid code yields a
   large accuracy gain for almost no cost. Do this before/alongside model training.

## Approach

Fine-tune (not train-from-scratch) a Tesseract **5 LSTM** model starting from the
`eng` model in `tessdata_best`, using the **tesstrain** Python/make workflow. Fine-tuning
from a strong base is the right tool when the target is "close to existing training data
but different in a subtle way, like an unusual font" — exactly our case — and needs far
less data than training from scratch. (The base `eng` model was trained on ~400,000 text
lines across ~4,500 fonts; we need a tiny fraction of that to adapt one font.)

### Charset

Codes use only `A–Z` and `0–9` plus a space. We keep `eng`'s unicharset (fine-tuning
preserves it); the OCR-profile whitelist (`assets/ocr-profile.json`) already restricts
inference to that alphabet, which we keep applying at runtime.

## Corpus strategy & size

Two sources, combined:

### Synthetic (bulk of the training set)

Render line images of codes in the pill font (and near-matches) with realistic
augmentation. The code space is small and fully enumerable:

- 49 prefixes × numbers 01–20 = **980 unique codes** (plus the `<PREFIX> N` un-padded form
  seen on stickers, e.g. `CRO 20`, `GHA 1`).
- For each code, generate several variants: rotation (±8°), perspective/skew, gaussian
  blur, JPEG noise, brightness/contrast, and both `PREFIX NN` and `PREFIX N` spacings.

**Target: ~2,000–5,000 synthetic line images.** Rationale: enough to cover every glyph in
many contexts and augmentations while staying a small fine-tune; for a single font this is
ample and trains in minutes–hours on CPU. Generation options:

- `text2image` (ships with Tesseract training tools) driving the pill font, or
- a small Node/canvas renderer (we already render to canvas) emitting `name.png` +
  `name.gt.txt` pairs — preferred, since it reuses our stack and augmentation is trivial.

The font: identify the exact Panini pill typeface if possible; otherwise approximate with a
close bold-condensed font (e.g. a DIN/Antonio/Oswald-style face). Mismatch is the main risk
(see Risks); real samples mitigate it.

### Real (validation + a slice of training)

Annotated line crops of actual pills from app captures and photos (reuse the
`web/fixtures/stickers/` pipeline + the Localizer to auto-crop).

- **Target: 200–500 real line crops.** Split **90/10 train/eval** (`RATIO_TRAIN=0.90`), and
  hold out a separate **~50-image test set** never seen in training for the final metric.
- Even a few hundred real lines meaningfully anchor the synthetic set to real capture
  conditions (lighting, fabric, focus, the actual font).

## Ground-truth format & layout

tesstrain expects **per-line image + transcription** pairs (no character boxes):

```
data/stickers-ground-truth/
  cro20_001.png        # one text line (the pill, cropped + inverted to dark-on-light)
  cro20_001.gt.txt     # contains exactly: CRO 20
  fwc17_017.png
  fwc17_017.gt.txt
  ...
```

Line images may be `.png`/`.tif`/`.bin.png`/`.nrm.png`. Preprocess each crop the same way
the app does (grayscale, invert, normalize) so training matches inference.

## Training workflow (tesstrain)

```bash
# one-time: clone tesstrain, get the best base models
git clone https://github.com/tesseract-ocr/tesstrain
#   download eng.traineddata into ./tessdata_best (from tessdata_best repo)

# fine-tune from eng
make training \
  MODEL_NAME=stickers \
  START_MODEL=eng \
  TESSDATA=~/tessdata_best \
  GROUND_TRUTH_DIR=data/stickers-ground-truth \
  MAX_ITERATIONS=5000 \
  RATIO_TRAIN=0.90 \
  PSM=7            # single text line
```

- `START_MODEL=eng` + `TESSDATA` pointing at `tessdata_best` makes `lstmtraining` run with
  `--continue_from` the base checkpoint (fine-tune, not scratch).
- Start with `MAX_ITERATIONS=3000–10000`; stop earlier on a target error rate
  (`--target_error_rate`, default 0.01) or when eval CER plateaus.

## Evaluation

- **During training:** `make evaluation` / `lstmeval` reports **character error rate (CER)**
  on the eval split; watch `char_train`/`char_error` in checkpoint names.
- **App-level gate (authoritative):** run the held-out set through our existing harness,
  `cd web && npm run validate:ocr`, after pointing tesseract.js at the new model. Track the
  fixtures pass-rate and compare against the current baseline (~1/4).
- **Targets:** eval CER < ~2–3%; harness pass-rate ≥ 90% on the held-out real test set.

## Packaging & deployment to the browser

```bash
# extract a deployable recognition model from the best checkpoint
lstmtraining --stop_training \
  --continue_from data/stickers/checkpoints/stickers_<best>.checkpoint \
  --traineddata data/stickers/stickers.traineddata \
  --model_output stickers.traineddata
```

Ship `stickers.traineddata` and load it in tesseract.js by hosting it and pointing the
worker at it:

```ts
// TesseractAdapter
const worker = await createWorker('stickers', undefined, {
  langPath: '/models',          // serve stickers.traineddata from here
  cacheMethod: 'none',
});
```

Keep the model out of git (it is a binary build artifact; `*.traineddata` is already
gitignored). Serve it as a static asset (same-origin Rails `public/` or a CDN) and version
it alongside the app.

## Cheaper alternative / complement: constrained post-correction

Because valid codes are a known, tiny set, snap raw OCR to the nearest valid code before
(or instead of) model training:

- Build the candidate set (49 prefixes × 01–20). For an OCR read, compute edit distance to
  each candidate **with a confusion-aware cost** (e.g. `0↔O`, `1↔I/L`, `5↔S`, `8↔B`,
  `2↔Z`) and accept the best within a small threshold; otherwise fall back to manual.
- This alone likely turns near-misses like `GHAL1`→`GHA01`, `GRO 20`→`CRO20` into hits, at
  ~zero training cost, and stacks with the fine-tuned model. **Do this first.**

## Milestones

1. **M1 — Post-correction (cheap win):** confusion-aware nearest-valid-code matcher in the
   domain layer (TDD), wired after `rankCandidates`. Re-run `validate:ocr` to measure gain.
2. **M2 — Synthetic generator:** a Node/canvas tool emitting `*.png` + `*.gt.txt` for all
   codes × augmentations into `data/stickers-ground-truth/`.
3. **M3 — Real corpus:** script to auto-crop + invert real pills (via the Localizer) into
   ground-truth pairs; collect 200–500 lines; reserve a 50-image held-out test set.
4. **M4 — Fine-tune:** run tesstrain from `eng`; iterate `MAX_ITERATIONS`/data until eval
   CER target; package `stickers.traineddata`.
5. **M5 — Ship + measure:** load in tesseract.js, serve the model, gate on the harness
   pass-rate; document results in `docs/ocr-findings.md`.

## Risks & notes

- **Font mismatch** is the top risk; prioritize obtaining the real face or enough real
  samples so the model learns the actual glyphs.
- **Bundle/runtime cost:** a custom `.traineddata` is a few MB and downloads once; acceptable
  for a one-time cache. The model is not needed for the manual-entry path.
- **Don't over-fit to clean synthetics** — augmentation + the real slice are what make it
  generalize to fabric/lighting/angle.

## References

- Tesseract 5 LSTM training (official): <https://tesseract-ocr.github.io/tessdoc/tess5/TrainingTesseract-5.html>
- tesstrain (make/Python workflow, ground-truth layout): <https://github.com/tesseract-ocr/tesstrain>
- Best base models (`tessdata_best`): <https://github.com/tesseract-ocr/tessdata_best>
- `text2image` (synthetic line generation): <https://tesseract-ocr.github.io/tessdoc/tess4/TrainingTesseract-4.00.html#text2image>
- Fonts for training: <https://tesseract-ocr.github.io/tessdoc/Fonts.html>
- tesseract.js custom `langPath`/models: <https://github.com/naptha/tesseract.js/blob/master/docs/api.md>
