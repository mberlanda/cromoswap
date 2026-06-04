import type { RgbaImage } from './image';

export interface OcrResult {
  text: string;
  confidence: number;
}

/** An OCR engine behind a swappable interface (real Tesseract or a test mock). */
export interface OcrAdapter {
  recognize(image: RgbaImage): Promise<OcrResult>;
}
