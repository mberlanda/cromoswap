/**
 * OCR validation harness: runs the real Tesseract engine against the local
 * sticker-back fixtures and reports recognized vs expected codes. Not part of
 * the unit-test gate (slow, downloads language data, needs local images).
 *
 *   cd web && npm run validate:ocr
 *
 * The fixtures are full photos (sticker on a background), so the harness first
 * auto-detects the sticker (the large bright region on the dark fabric — a
 * stand-in for the future Localizer / the user filling the camera frame), then
 * applies the same orientation ROI from mask-config.json before OCR. This
 * mirrors the live camera flow and keeps the ROI proportion.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorker, PSM } from 'tesseract.js';
import sharp from 'sharp';
import maskConfig from '../src/assets/mask-config.json';
import ocrProfile from '../src/assets/ocr-profile.json';
import { parseCandidates } from '../src/domain/parser';
import { rankCandidates } from '../src/domain/ranker';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
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

/** Detect the sticker as the largest bright connected component on dark fabric. */
async function detectStickerBbox(path: string): Promise<Rect> {
  const targetW = 200;
  const { data, info } = await sharp(path)
    .resize({ width: targetW })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const threshold = 110;
  const bright = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) bright[i] = data[i] > threshold ? 1 : 0;

  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  let best = { area: 0, minx: 0, miny: 0, maxx: 0, maxy: 0 };
  for (let start = 0; start < w * h; start++) {
    if (!bright[start] || seen[start]) continue;
    let area = 0;
    let minx = w;
    let miny = h;
    let maxx = 0;
    let maxy = 0;
    stack.length = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % w;
      const y = (p / w) | 0;
      area++;
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
      if (x > 0 && bright[p - 1] && !seen[p - 1]) {
        seen[p - 1] = 1;
        stack.push(p - 1);
      }
      if (x < w - 1 && bright[p + 1] && !seen[p + 1]) {
        seen[p + 1] = 1;
        stack.push(p + 1);
      }
      if (y > 0 && bright[p - w] && !seen[p - w]) {
        seen[p - w] = 1;
        stack.push(p - w);
      }
      if (y < h - 1 && bright[p + w] && !seen[p + w]) {
        seen[p + w] = 1;
        stack.push(p + w);
      }
    }
    if (area > best.area) best = { area, minx, miny, maxx, maxy };
  }
  return {
    x: best.minx / w,
    y: best.miny / h,
    w: (best.maxx - best.minx) / w,
    h: (best.maxy - best.miny) / h,
  };
}

/**
 * Compose the orientation ROI (relative to the sticker) onto the photo, with
 * extra vertical slack: sticker auto-detection can run a little high (glare or
 * stacked edges), so the pill may sit lower than the nominal ROI.
 */
function composeRoi(bbox: Rect, roi: Rect): Rect {
  const slack = roi.h * bbox.h * 0.6;
  return {
    x: bbox.x + roi.x * bbox.w,
    y: bbox.y + roi.y * bbox.h,
    w: roi.w * bbox.w,
    h: roi.h * bbox.h + slack,
  };
}

async function main() {
  const present = manifest.samples.filter((s) => existsSync(resolve(fixturesDir, s.file)));
  if (present.length === 0) {
    console.log('No fixture images found in web/fixtures/stickers/. See its README.');
    return;
  }

  const worker = await createWorker('eng');
  await worker.setParameters({ tessedit_char_whitelist: ocrProfile.whitelist + ' ' });

  // Single-shot OCR on these hard photos is unstable, so — like the live
  // hold-while-focused loop — try a few scale/PSM combos and accept the first
  // that reads the expected code.
  const combos: { scale: number; psm: PSM }[] = [
    { scale: 3, psm: PSM.SINGLE_LINE },
    { scale: 4, psm: PSM.SINGLE_LINE },
    { scale: 2, psm: PSM.SINGLE_LINE },
    { scale: 3, psm: PSM.SINGLE_BLOCK },
    { scale: 4, psm: PSM.SPARSE_TEXT },
  ];

  let passed = 0;
  for (const sample of present) {
    const path = resolve(fixturesDir, sample.file);
    const { width = 0, height = 0 } = await sharp(path).metadata();
    const bbox = await detectStickerBbox(path);
    const roi = composeRoi(bbox, maskConfig.orientations[sample.orientation].roi as Rect);
    const rectangle = {
      left: Math.round(roi.x * width),
      top: Math.round(roi.y * height),
      width: Math.round(roi.w * width),
      height: Math.round(roi.h * height),
    };

    let found: string[] = [];
    let winner = '';
    for (const combo of combos) {
      // The code is light text on a dark pill; invert for Tesseract.
      const processed = await sharp(path)
        .extract(rectangle)
        .resize({ width: rectangle.width * combo.scale })
        .greyscale()
        .negate()
        .normalise()
        .png()
        .toBuffer();
      await worker.setParameters({ tessedit_pageseg_mode: combo.psm });
      const { data } = await worker.recognize(processed);
      found = rankCandidates(
        parseCandidates(data.text).map((raw) => ({ raw, confidence: data.confidence / 100 })),
      ).map((r) => r.code.canonical);
      if (found.includes(sample.expectedCode)) {
        winner = `scale=${combo.scale} psm=${combo.psm}`;
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

  await worker.terminate();
  console.log(`\n${passed}/${present.length} fixtures recognized.`);
  if (passed < present.length) process.exitCode = 1;
}

void main();
