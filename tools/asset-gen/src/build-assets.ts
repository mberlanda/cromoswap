import type { CodeBox, CorpusAnnotation, Orientation } from './corpus';
import { deriveRoi } from './derive-roi';

export interface OrientationMask {
  /** Nominal aspect ratio (width / height) of the sticker in this orientation. */
  aspectRatio: number;
  /** Region of interest where the code lives, relative to the sticker (0..1). */
  roi: CodeBox;
}

export interface MaskConfig {
  orientations: Partial<Record<Orientation, OrientationMask>>;
}

export interface OcrProfile {
  whitelist: string;
  /** Tesseract page segmentation mode (7 = single text line). */
  psm: number;
}

export const OCR_PROFILE: OcrProfile = {
  whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  psm: 7,
};

// Panini WC 2026 backs measure ~3:4 (width:height). See
// docs/ocr-scanning-geometry.md.
const ASPECT_RATIO: Record<Orientation, number> = {
  portrait: 3 / 4, // 0.75
  landscape: 4 / 3, // 1.333
};

/**
 * Build the runtime mask config from an annotated corpus: one ROI per
 * orientation that appears in the corpus, padded and clamped.
 */
export function buildMaskConfig(corpus: CorpusAnnotation[], pad: number): MaskConfig {
  const byOrientation = new Map<Orientation, CodeBox[]>();
  for (const entry of corpus) {
    const boxes = byOrientation.get(entry.orientation) ?? [];
    boxes.push(entry.box);
    byOrientation.set(entry.orientation, boxes);
  }

  const orientations: Partial<Record<Orientation, OrientationMask>> = {};
  for (const [orientation, boxes] of byOrientation) {
    orientations[orientation] = {
      aspectRatio: ASPECT_RATIO[orientation],
      roi: deriveRoi(boxes, pad),
    };
  }
  return { orientations };
}
