import type { RgbaImage, RelativeRect } from './image';
import type { OcrAdapter } from './ocr-adapter';
import type { RankedCode } from '../domain/types';
import { cropRoi } from './roi-cropper';
import { toGrayscaleThreshold, toNormalizedGrayscale } from './preprocessor';
import { rotate90 } from './rotate';
import { composeRect, BrightnessLocalizer, type Localizer } from './localizer';
import { expandRect } from './geometry';
import { parseCandidates } from '../domain/parser';
import { rankCandidates } from '../domain/ranker';

export interface PipelineOptions {
  ocr: OcrAdapter;
  roi: RelativeRect;
  /**
   * When set, binarize with this fixed luminance threshold (legacy mode).
   * When omitted, preprocessing contrast-stretches instead (the default —
   * adapts to the crop's lighting; see docs/ocr-recognition.md).
   */
  threshold?: number;
  /** Invert preprocessing for light-on-dark code pills. Defaults to true. */
  invert?: boolean;
  /** Upscale the tiny code-pill crop before OCR. Defaults to 4x. */
  preprocessScale?: number;
  /** Tesseract page-segmentation mode for this attempt, forwarded to the adapter. */
  psm?: number;
  /** Optional sticker localizer; the ROI is taken relative to what it finds. */
  localizer?: Localizer;
}

export interface MultiOrientationOptions extends PipelineOptions {
  /** Clockwise 90-degree turns to try, in order. Defaults to all four. */
  rotations?: number[];
}

/**
 * Run a single captured frame through the recognition pipeline:
 * crop ROI -> preprocess -> OCR -> parse candidates -> rank valid codes.
 *
 * Extension seams (not implemented): an OrientationStrategy could call this
 * for 0/90/180/270deg, and a Localizer could replace the static ROI crop.
 */
// Second-stage localizer for the code pill itself: after inverted
// normalization the pill is the dominant bright region of the ROI crop, while
// the sticker edge inverts to a black band that breaks Tesseract's block/line
// segmentation. Cropping to the pill removes that band (docs/ocr-recognition.md).
const PILL_LOCALIZER = new BrightnessLocalizer({ threshold: 160, minAreaFraction: 0.05 });
const PILL_MARGIN = 0.08;

export async function runPipeline(
  frame: RgbaImage,
  { ocr, roi, threshold, invert = true, preprocessScale = 4, psm, localizer }: PipelineOptions,
): Promise<RankedCode[]> {
  const sticker = localizer?.locate(frame) ?? null;
  const region = sticker ? composeRect(sticker, roi) : roi;
  const cropped = cropRoi(frame, region);
  let preprocessed =
    threshold === undefined
      ? toNormalizedGrayscale(cropped, invert, preprocessScale)
      : toGrayscaleThreshold(cropped, threshold, invert, preprocessScale);
  if (threshold === undefined) {
    const pill = PILL_LOCALIZER.locate(preprocessed);
    // Crop whenever the pill is smaller than the crop in either dimension —
    // trimming just one axis still removes the inverted-black band. Only a
    // full-image result (nothing to trim) is skipped.
    if (pill && (pill.w < 1 || pill.h < 1)) {
      preprocessed = cropRoi(preprocessed, expandRect(pill, PILL_MARGIN));
    }
  }
  const { text, confidence } = await ocr.recognize(preprocessed, { psm });
  const candidates = parseCandidates(text).map((raw) => ({ raw, confidence }));
  return rankCandidates(candidates);
}

/**
 * Run the pipeline across several orientations (rotating the frame), then keep
 * the highest-confidence reading per code. Lets the scanner recognize rotated
 * stickers (e.g. landscape team stickers) before asking the user to correct.
 */
export async function runPipelineMultiOrientation(
  frame: RgbaImage,
  {
    ocr,
    roi,
    threshold,
    invert,
    preprocessScale,
    psm,
    localizer,
    rotations = [0, 1, 2, 3],
  }: MultiOrientationOptions,
): Promise<RankedCode[]> {
  const best = new Map<string, RankedCode>();
  for (const turns of rotations) {
    const rotated = rotate90(frame, turns);
    const ranked = await runPipeline(rotated, {
      ocr,
      roi,
      threshold,
      invert,
      preprocessScale,
      psm,
      localizer,
    });
    for (const candidate of ranked) {
      const existing = best.get(candidate.code.canonical);
      if (!existing || candidate.confidence > existing.confidence) {
        best.set(candidate.code.canonical, candidate);
      }
    }
  }
  return [...best.values()].sort((a, b) => b.confidence - a.confidence);
}
