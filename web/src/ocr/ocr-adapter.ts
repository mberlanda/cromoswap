import type { RgbaImage } from './image';

export interface OcrResult {
  text: string;
  confidence: number;
}

/** Per-call recognition options (see docs/ocr-recognition.md). */
export interface RecognizeOptions {
  /** Tesseract page-segmentation mode for this call (e.g. 6 block, 7 line). */
  psm?: number;
}

/** An OCR engine behind a swappable interface (real Tesseract or a test mock). */
export interface OcrAdapter {
  recognize(image: RgbaImage, options?: RecognizeOptions): Promise<OcrResult>;
}
