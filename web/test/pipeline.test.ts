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

  it('crops to the ROI before running OCR', async () => {
    // A tiny ROI must still produce a non-empty image for the adapter.
    const ocr = new MockOcrAdapter({ text: 'ARG01', confidence: 0.6 });
    const result = await runPipeline(frame, { ocr, roi: { x: 0, y: 0, w: 0.5, h: 0.5 }, threshold: 128 });
    expect(result[0].code.canonical).toBe('ARG01');
    expect(ocr.calls).toBe(1);
  });
});
