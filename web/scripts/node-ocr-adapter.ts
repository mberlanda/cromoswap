/**
 * Node implementation of the live OcrAdapter for the fixture harness: same
 * Tesseract engine and parameters as src/ocr/tesseract-adapter.ts, but the
 * RgbaImage goes in as a sharp-encoded PNG instead of a browser canvas. Keeps
 * validate-ocr.ts running the real pipeline with only the I/O swapped.
 */
import { createWorker, type PSM, type Worker } from 'tesseract.js';
import sharp from 'sharp';
import ocrProfile from '../src/assets/ocr-profile.json';
import type { RgbaImage } from '../src/ocr/image';
import type { OcrAdapter, OcrResult, RecognizeOptions } from '../src/ocr/ocr-adapter';

export class NodeOcrAdapter implements OcrAdapter {
  private worker: Worker | null = null;
  private currentPsm: number = ocrProfile.psm;

  private async getWorker(): Promise<Worker> {
    if (this.worker) return this.worker;
    const worker = await createWorker('eng');
    await worker.setParameters({
      tessedit_char_whitelist: ocrProfile.whitelist + ' ',
      tessedit_pageseg_mode: String(ocrProfile.psm) as unknown as PSM,
    });
    this.worker = worker;
    return worker;
  }

  async recognize(image: RgbaImage, options?: RecognizeOptions): Promise<OcrResult> {
    const worker = await this.getWorker();
    const psm = options?.psm ?? ocrProfile.psm;
    if (psm !== this.currentPsm) {
      await worker.setParameters({ tessedit_pageseg_mode: String(psm) as unknown as PSM });
      this.currentPsm = psm;
    }
    const png = await sharp(Buffer.from(image.data.buffer, image.data.byteOffset, image.data.byteLength), {
      raw: { width: image.width, height: image.height, channels: 4 },
    })
      .png()
      .toBuffer();
    const { data } = await worker.recognize(png);
    return { text: data.text, confidence: data.confidence / 100 };
  }

  async dispose(): Promise<void> {
    await this.worker?.terminate();
    this.worker = null;
  }
}
