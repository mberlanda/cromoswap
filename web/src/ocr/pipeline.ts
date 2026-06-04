import type { RgbaImage, RelativeRect } from './image';
import type { OcrAdapter } from './ocr-adapter';
import type { RankedCode } from '../domain/types';
import { cropRoi } from './roi-cropper';
import { toGrayscaleThreshold } from './preprocessor';
import { rotate90 } from './rotate';
import { parseCandidates } from '../domain/parser';
import { rankCandidates } from '../domain/ranker';

export interface PipelineOptions {
  ocr: OcrAdapter;
  roi: RelativeRect;
  threshold: number;
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
export async function runPipeline(
  frame: RgbaImage,
  { ocr, roi, threshold }: PipelineOptions,
): Promise<RankedCode[]> {
  const cropped = cropRoi(frame, roi);
  const preprocessed = toGrayscaleThreshold(cropped, threshold);
  const { text, confidence } = await ocr.recognize(preprocessed);
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
  { ocr, roi, threshold, rotations = [0, 1, 2, 3] }: MultiOrientationOptions,
): Promise<RankedCode[]> {
  const best = new Map<string, RankedCode>();
  for (const turns of rotations) {
    const rotated = rotate90(frame, turns);
    const ranked = await runPipeline(rotated, { ocr, roi, threshold });
    for (const candidate of ranked) {
      const existing = best.get(candidate.code.canonical);
      if (!existing || candidate.confidence > existing.confidence) {
        best.set(candidate.code.canonical, candidate);
      }
    }
  }
  return [...best.values()].sort((a, b) => b.confidence - a.confidence);
}
