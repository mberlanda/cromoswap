import { describe, it, expect } from 'vitest';
import { cropRoi } from '../src/ocr/roi-cropper';
import type { RgbaImage } from '../src/ocr/image';

function makeImage(width: number, height: number): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4);
  // Encode each pixel's red channel as its linear index so we can identify it.
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = i;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

describe('cropRoi', () => {
  it('returns a sub-image sized from the relative ROI', () => {
    const img = makeImage(4, 4);
    const out = cropRoi(img, { x: 0.5, y: 0, w: 0.5, h: 0.5 });
    expect(out.width).toBe(2);
    expect(out.height).toBe(2);
  });

  it('copies the correct pixels from the source region', () => {
    const img = makeImage(4, 4);
    const out = cropRoi(img, { x: 0.5, y: 0, w: 0.5, h: 0.5 });
    // Top-left of crop is source pixel (col 2, row 0) => linear index 2.
    expect(out.data[0]).toBe(2);
    // Next pixel in crop row is source (col 3, row 0) => index 3.
    expect(out.data[4]).toBe(3);
  });

  it('clamps a ROI that exceeds the image bounds', () => {
    const img = makeImage(4, 4);
    const out = cropRoi(img, { x: 0.75, y: 0.75, w: 0.5, h: 0.5 });
    expect(out.width).toBe(1);
    expect(out.height).toBe(1);
  });
});
