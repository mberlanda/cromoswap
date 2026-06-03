import type { RgbaImage, RelativeRect } from './image';
import type { OcrAdapter } from './ocr-adapter';
import type { RankedCode } from '../domain/types';
import { cropRoi } from './roi-cropper';
import { toGrayscaleThreshold } from './preprocessor';
import { parseCandidates } from '../domain/parser';
import { rankCandidates } from '../domain/ranker';

export interface PipelineOptions {
  ocr: OcrAdapter;
  roi: RelativeRect;
  threshold: number;
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
