import type { RgbaImage } from './image';
import type { OcrAdapter, OcrResult } from './ocr-adapter';

/** Deterministic OCR adapter for tests: returns a scripted result and counts calls. */
export class MockOcrAdapter implements OcrAdapter {
  calls = 0;
  private readonly result: OcrResult;

  constructor(result: OcrResult) {
    this.result = result;
  }

  async recognize(_image: RgbaImage): Promise<OcrResult> {
    void _image;
    this.calls += 1;
    return this.result;
  }
}
