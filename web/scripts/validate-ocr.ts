/**
 * OCR validation harness: runs the *live* recognition pipeline (the exact
 * functions the app ships — localizer, ROI, preprocessing, attempt matrix,
 * parser, ranker) against the local sticker-back fixtures, so fixture results
 * predict app behavior. Only the I/O differs from the phone: frames come from
 * photo files instead of the camera, and OCR goes through a sharp-PNG node
 * adapter instead of a canvas (see node-ocr-adapter.ts). The approach is
 * documented in docs/ocr-recognition.md.
 *
 *   cd web && npm run validate:ocr
 *
 * The fixtures are full photos (sticker on a background). The harness stands
 * in for the user's framing by locating the sticker (BrightnessLocalizer, the
 * same detector the app uses) and cropping to it with guide-like margin, then
 * — exactly like the hold/auto-collect loops — sweeps the shared {scale, psm}
 * attempt matrix until a valid code is recognized.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import maskConfig from '../src/assets/mask-config.json';
import ocrProfile from '../src/assets/ocr-profile.json';
import { BrightnessLocalizer } from '../src/ocr/localizer';
import { cropRoi } from '../src/ocr/roi-cropper';
import { expandRect } from '../src/ocr/geometry';
import { runPipelineMultiOrientation } from '../src/ocr/pipeline';
import type { RgbaImage } from '../src/ocr/image';
import { NodeOcrAdapter } from './node-ocr-adapter';

type Orientation = keyof typeof maskConfig.orientations;
interface Sample {
  file: string;
  expectedCode: string;
  orientation: Orientation;
}

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(here, '../fixtures/stickers');
const manifest = JSON.parse(readFileSync(resolve(fixturesDir, 'manifest.json'), 'utf8')) as {
  samples: Sample[];
};

/** Photos are downscaled to this width — roughly what a Full HD capture gives. */
const FRAME_WIDTH = 1080;
/** Guide-like breathing room kept around the located sticker. */
const GUIDE_MARGIN = 0.08;

/** Load a photo as the RgbaImage the live pipeline consumes (EXIF-rotated). */
async function loadFrame(path: string): Promise<RgbaImage> {
  const { data, info } = await sharp(path)
    .rotate()
    .resize({ width: FRAME_WIDTH, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8ClampedArray(data) };
}

async function main() {
  const present = manifest.samples.filter((s) => existsSync(resolve(fixturesDir, s.file)));
  if (present.length === 0) {
    console.log('No fixture images found in web/fixtures/stickers/. See its README.');
    return;
  }

  const ocr = new NodeOcrAdapter();
  const localizer = new BrightnessLocalizer();

  let passed = 0;
  for (const sample of present) {
    const frame = await loadFrame(resolve(fixturesDir, sample.file));

    // Stand-in for the user's framing: crop to the located sticker plus
    // guide-like margin. The pipeline then re-locates within the crop, just
    // like the live scan does inside the guide region.
    const sticker = localizer.locate(frame);
    const guide = sticker ? cropRoi(frame, expandRect(sticker, GUIDE_MARGIN)) : frame;
    const roi = maskConfig.orientations[sample.orientation].roi;

    let found: string[] = [];
    let winner = '';
    for (const attempt of ocrProfile.attempts) {
      const ranked = await runPipelineMultiOrientation(guide, {
        ocr,
        roi,
        localizer,
        preprocessScale: attempt.scale,
        psm: attempt.psm,
      });
      found = ranked.map((r) => r.code.canonical);
      if (found.includes(sample.expectedCode)) {
        winner = `scale=${attempt.scale} psm=${attempt.psm}`;
        break;
      }
    }

    const ok = found.includes(sample.expectedCode);
    if (ok) passed += 1;
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${sample.file}  expected=${sample.expectedCode}  ` +
        `found=[${found.join(', ') || '—'}]${ok ? `  via ${winner}` : ''}`,
    );
  }

  await ocr.dispose();
  console.log(`\n${passed}/${present.length} fixtures recognized.`);
  if (passed < present.length) process.exitCode = 1;
}

void main();
