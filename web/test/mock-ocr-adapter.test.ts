import { describe, it, expect } from 'vitest';
import { MockOcrAdapter } from '../src/ocr/mock-ocr-adapter';
import type { RgbaImage } from '../src/ocr/image';

const blankImage: RgbaImage = { width: 1, height: 1, data: new Uint8ClampedArray(4) };

describe('MockOcrAdapter', () => {
  it('returns the scripted result', async () => {
    const adapter = new MockOcrAdapter({ text: 'ARG 01', confidence: 0.9 });
    await expect(adapter.recognize(blankImage)).resolves.toEqual({
      text: 'ARG 01',
      confidence: 0.9,
    });
  });

  it('records how many times recognize was called', async () => {
    const adapter = new MockOcrAdapter({ text: 'USA13', confidence: 0.5 });
    await adapter.recognize(blankImage);
    await adapter.recognize(blankImage);
    expect(adapter.calls).toBe(2);
  });
});
