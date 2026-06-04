# OCR validation fixtures

Real Panini WC 2026 sticker-back photos used to validate the OCR pipeline against actual
pixels (not just geometry). The **image files are gitignored** (Panini artwork is
copyrighted); only `manifest.json` is committed.

## Add the images

Place the four photos here, named to match `manifest.json`:

| File        | Expected code | Orientation |
|-------------|---------------|-------------|
| `cro20.jpg` | `CRO20`       | portrait    |
| `gha01.jpg` | `GHA01`       | portrait    |
| `gha07.jpg` | `GHA07`       | portrait    |
| `fwc17.jpg` | `FWC17`       | landscape   |

Each photo should show the full sticker back; the code pill is read from the top-right
ROI defined in `assets/mask-config.json`.

## Run the validation harness

Once the images are present (and after the harness lands):

```bash
cd web
npm run validate:ocr
```

It crops each image to the orientation's ROI, runs the real Tesseract pipeline, and
reports recognized vs expected codes.
