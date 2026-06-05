import { describe, it, expect } from 'vitest';
import { runPipelineMultiOrientation } from '../src/ocr/pipeline';
import type { RgbaImage } from '../src/ocr/image';
import type { OcrAdapter, OcrResult } from '../src/ocr/ocr-adapter';

const frame: RgbaImage = { width: 2, height: 3, data: new Uint8ClampedArray(2 * 3 * 4) };
const roi = { x: 0, y: 0, w: 1, h: 1 };

/** Returns scripted OCR results in call order. */
class SequencedOcrAdapter implements OcrAdapter {
  calls = 0;
  constructor(private readonly results: OcrResult[]) {}
  async recognize(): Promise<OcrResult> {
    return this.results[this.calls++] ?? { text: '', confidence: 0 };
  }
}

describe('runPipelineMultiOrientation', () => {
  it('tries all four orientations and returns the valid code found in one of them', async () => {
    const ocr = new SequencedOcrAdapter([
      { text: 'noise', confidence: 0.3 },
      { text: 'ZZZ01', confidence: 0.9 },
      { text: 'USA13', confidence: 0.8 },
      { text: 'garbage', confidence: 0.1 },
    ]);
    const result = await runPipelineMultiOrientation(frame, { ocr, roi, threshold: 128 });
    expect(ocr.calls).toBe(4);
    expect(result[0].code.canonical).toBe('USA13');
  });

  it('keeps the highest-confidence reading when a code appears in multiple orientations', async () => {
    const ocr = new SequencedOcrAdapter([
      { text: 'ARG01', confidence: 0.5 },
      { text: 'ARG01', confidence: 0.95 },
      { text: '', confidence: 0 },
      { text: '', confidence: 0 },
    ]);
    const result = await runPipelineMultiOrientation(frame, { ocr, roi, threshold: 128 });
    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe(0.95);
  });

  it('honors a custom rotation list', async () => {
    const ocr = new SequencedOcrAdapter([{ text: 'USA13', confidence: 0.7 }]);
    const result = await runPipelineMultiOrientation(frame, {
      ocr,
      roi,
      threshold: 128,
      rotations: [0],
    });
    expect(ocr.calls).toBe(1);
    expect(result[0].code.canonical).toBe('USA13');
  });

  it('applies the ROI relative to the located sticker before OCR', async () => {
    const localizedFrame: RgbaImage = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4),
    };
    const ocr = new SequencedOcrAdapter([{ text: 'USA13', confidence: 0.7 }]);
    const seenImages: Array<{ width: number; height: number }> = [];
    ocr.recognize = async (image: RgbaImage): Promise<OcrResult> => {
      seenImages.push({ width: image.width, height: image.height });
      ocr.calls++;
      return { text: 'USA13', confidence: 0.7 };
    };

    const result = await runPipelineMultiOrientation(localizedFrame, {
      ocr,
      roi,
      threshold: 128,
      preprocessScale: 1,
      localizer: { locate: () => ({ x: 0, y: 0, w: 0.5, h: 0.5 }) },
      rotations: [0],
    });

    expect(result[0].code.canonical).toBe('USA13');
    expect(seenImages).toEqual([{ width: 5, height: 5 }]);
  });

  it('returns [] when no orientation yields a valid code', async () => {
    const ocr = new SequencedOcrAdapter([{ text: 'nope', confidence: 1 }]);
    const result = await runPipelineMultiOrientation(frame, {
      ocr,
      roi,
      threshold: 128,
      rotations: [0],
    });
    expect(result).toEqual([]);
  });
});
