import { describe, it, expect } from 'vitest';
import { runPipeline } from '../src/ocr/pipeline';
import { MockOcrAdapter } from '../src/ocr/mock-ocr-adapter';
import type { RgbaImage } from '../src/ocr/image';

const frame: RgbaImage = { width: 2, height: 2, data: new Uint8ClampedArray(2 * 2 * 4) };
const roi = { x: 0, y: 0, w: 1, h: 1 };

describe('runPipeline', () => {
  it('returns ranked valid codes parsed from the OCR text', async () => {
    const ocr = new MockOcrAdapter({ text: 'noise USA13', confidence: 0.77 });
    const result = await runPipeline(frame, { ocr, roi, threshold: 128 });
    expect(result.map((r) => r.code.canonical)).toEqual(['USA13']);
    expect(result[0].confidence).toBe(0.77);
  });

  it('returns [] when OCR yields no valid code', async () => {
    const ocr = new MockOcrAdapter({ text: 'no codes', confidence: 0.5 });
    const result = await runPipeline(frame, { ocr, roi, threshold: 128 });
    expect(result).toEqual([]);
  });

  it('takes the ROI relative to a located sticker when a localizer is given', async () => {
    const ocr = new MockOcrAdapter({ text: 'ARG01', confidence: 0.6 });
    const localizer = { locate: () => ({ x: 0, y: 0, w: 1, h: 1 }) };
    const result = await runPipeline(frame, { ocr, roi, threshold: 128, localizer });
    expect(result[0].code.canonical).toBe('ARG01');
  });

  it('falls back to the raw ROI when the localizer finds nothing', async () => {
    const ocr = new MockOcrAdapter({ text: 'USA13', confidence: 0.6 });
    const localizer = { locate: () => null };
    const result = await runPipeline(frame, { ocr, roi, threshold: 128, localizer });
    expect(result[0].code.canonical).toBe('USA13');
  });

  it('crops to the ROI before running OCR', async () => {
    // A tiny ROI must still produce a non-empty image for the adapter.
    const ocr = new MockOcrAdapter({ text: 'ARG01', confidence: 0.6 });
    const result = await runPipeline(frame, { ocr, roi: { x: 0, y: 0, w: 0.5, h: 0.5 }, threshold: 128 });
    expect(result[0].code.canonical).toBe('ARG01');
    expect(ocr.calls).toBe(1);
  });

  it('upscales the preprocessed ROI before OCR', async () => {
    let recognized: RgbaImage | null = null;
    const ocr = {
      async recognize(image: RgbaImage) {
        recognized = image;
        return { text: 'ARG01', confidence: 0.6 };
      },
    };

    await runPipeline(frame, { ocr, roi, threshold: 128, preprocessScale: 4 });

    expect(recognized?.width).toBe(8);
    expect(recognized?.height).toBe(8);
  });
});

describe('runPipeline preprocessing modes and per-attempt options', () => {
  it('normalizes (contrast-stretch) instead of binarizing when no threshold is given', async () => {
    // Three gray levels: a hard threshold can only emit 0/255, while the
    // normalize path keeps the middle level as an intermediate gray.
    const grays: RgbaImage = {
      width: 3,
      height: 1,
      data: new Uint8ClampedArray([
        100, 100, 100, 255,
        120, 120, 120, 255,
        140, 140, 140, 255,
      ]),
    };
    let recognized: RgbaImage | null = null;
    const ocr = {
      async recognize(image: RgbaImage) {
        recognized = image;
        return { text: 'ARG01', confidence: 0.6 };
      },
    };

    await runPipeline(grays, { ocr, roi, invert: false, preprocessScale: 1 });

    expect(recognized).not.toBeNull();
    const middle = recognized!.data[4];
    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(255);
  });

  it('forwards the requested page-segmentation mode to the OCR adapter', async () => {
    const ocr = new MockOcrAdapter({ text: 'ARG01', confidence: 0.6 });
    await runPipeline(frame, { ocr, roi, psm: 6 });
    expect(ocr.lastOptions?.psm).toBe(6);
  });
});
