import { createWorker, PSM, type Worker } from 'tesseract.js';
import ocrProfile from '../assets/ocr-profile.json';
import type { RgbaImage } from './image';
import type { OcrAdapter, OcrResult } from './ocr-adapter';

/**
 * Runtime OCR adapter backed by tesseract.js. Thin I/O wrapper around the
 * tested pipeline units; excluded from coverage. Converts an RgbaImage to a
 * canvas before recognition and constrains the engine to the code alphabet.
 */
export class TesseractAdapter implements OcrAdapter {
  private worker: Worker | null = null;

  private async getWorker(): Promise<Worker> {
    if (this.worker) return this.worker;
    const worker = await createWorker('eng');
    await worker.setParameters({
      tessedit_char_whitelist: ocrProfile.whitelist,
      tessedit_pageseg_mode: String(ocrProfile.psm) as unknown as PSM,
    });
    this.worker = worker;
    return worker;
  }

  async recognize(image: RgbaImage): Promise<OcrResult> {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d canvas context unavailable');
    const imageData = ctx.createImageData(image.width, image.height);
    imageData.data.set(image.data);
    ctx.putImageData(imageData, 0, 0);

    const worker = await this.getWorker();
    const { data } = await worker.recognize(canvas);
    return { text: data.text, confidence: data.confidence / 100 };
  }

  async dispose(): Promise<void> {
    await this.worker?.terminate();
    this.worker = null;
  }
}
