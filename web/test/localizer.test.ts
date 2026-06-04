import { describe, it, expect } from 'vitest';
import { BrightnessLocalizer, composeRect } from '../src/ocr/localizer';
import type { RgbaImage } from '../src/ocr/image';

function darkImage(w: number, h: number): RgbaImage {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) data[i * 4 + 3] = 255;
  return { width: w, height: h, data };
}

function setBlock(img: RgbaImage, x0: number, y0: number, x1: number, y1: number, v: number) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const idx = (y * img.width + x) * 4;
      img.data[idx] = v;
      img.data[idx + 1] = v;
      img.data[idx + 2] = v;
    }
  }
}

describe('BrightnessLocalizer', () => {
  it('locates the bounding box of the bright sticker region', () => {
    const img = darkImage(10, 10);
    setBlock(img, 5, 1, 8, 4, 255); // cols 5..8, rows 1..4 (4x4)
    const rect = new BrightnessLocalizer().locate(img);
    expect(rect).not.toBeNull();
    expect(rect!.x).toBeCloseTo(0.5);
    expect(rect!.y).toBeCloseTo(0.1);
    expect(rect!.w).toBeCloseTo(0.4);
    expect(rect!.h).toBeCloseTo(0.4);
  });

  it('returns null when there is no bright region', () => {
    expect(new BrightnessLocalizer().locate(darkImage(10, 10))).toBeNull();
  });

  it('ignores specks below the minimum area fraction', () => {
    const img = darkImage(10, 10);
    setBlock(img, 0, 0, 0, 0, 255); // single bright pixel
    const rect = new BrightnessLocalizer({ minAreaFraction: 0.05 }).locate(img);
    expect(rect).toBeNull();
  });

  it('picks the largest bright region when several exist', () => {
    const img = darkImage(20, 20);
    setBlock(img, 0, 0, 1, 1, 255); // small 2x2 blob
    setBlock(img, 10, 10, 18, 18, 255); // big 9x9 blob
    const rect = new BrightnessLocalizer().locate(img)!;
    expect(rect.x).toBeCloseTo(0.5);
    expect(rect.w).toBeCloseTo(0.45);
  });
});

describe('composeRect', () => {
  it('maps an inner relative rect into an outer relative rect', () => {
    const outer = { x: 0.4, y: 0.3, w: 0.3, h: 0.2 };
    const inner = { x: 0.5, y: 0.0, w: 0.4, h: 0.5 };
    expect(composeRect(outer, inner)).toEqual({
      x: 0.4 + 0.5 * 0.3,
      y: 0.3 + 0.0 * 0.2,
      w: 0.4 * 0.3,
      h: 0.5 * 0.2,
    });
  });
});
