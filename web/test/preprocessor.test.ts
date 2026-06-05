import { describe, it, expect } from 'vitest';
import { toGrayscaleThreshold } from '../src/ocr/preprocessor';
import type { RgbaImage } from '../src/ocr/image';

function pixel(r: number, g: number, b: number): RgbaImage {
  return { width: 1, height: 1, data: new Uint8ClampedArray([r, g, b, 255]) };
}

describe('toGrayscaleThreshold', () => {
  it('turns a bright pixel white', () => {
    const out = toGrayscaleThreshold(pixel(255, 255, 255), 128);
    expect([out.data[0], out.data[1], out.data[2]]).toEqual([255, 255, 255]);
  });

  it('turns a dark pixel black', () => {
    const out = toGrayscaleThreshold(pixel(10, 10, 10), 128);
    expect([out.data[0], out.data[1], out.data[2]]).toEqual([0, 0, 0]);
  });

  it('thresholds by luminance, not by a single channel', () => {
    // Pure blue has low luminance (0.114) => should be black at threshold 128.
    const out = toGrayscaleThreshold(pixel(0, 0, 255), 128);
    expect(out.data[0]).toBe(0);
  });

  it('preserves alpha', () => {
    const out = toGrayscaleThreshold(pixel(255, 255, 255), 128);
    expect(out.data[3]).toBe(255);
  });

  it('inverts output for light-on-dark sources (e.g. the code pill)', () => {
    // Bright pixel with invert => black (dark text on light for Tesseract).
    const bright = toGrayscaleThreshold(pixel(255, 255, 255), 128, true);
    expect([bright.data[0], bright.data[1], bright.data[2]]).toEqual([0, 0, 0]);
    // Dark pixel with invert => white (background).
    const dark = toGrayscaleThreshold(pixel(10, 10, 10), 128, true);
    expect([dark.data[0], dark.data[1], dark.data[2]]).toEqual([255, 255, 255]);
  });

  it('can upscale tiny OCR crops while thresholding', () => {
    const image: RgbaImage = {
      width: 2,
      height: 1,
      data: new Uint8ClampedArray([
        10, 10, 10, 255,
        255, 255, 255, 255,
      ]),
    };

    const out = toGrayscaleThreshold(image, 128, true, 3);

    expect(out.width).toBe(6);
    expect(out.height).toBe(3);
    expect([out.data[0], out.data[1], out.data[2]]).toEqual([255, 255, 255]);
    const firstBrightPixel = (0 * out.width + 3) * 4;
    expect([out.data[firstBrightPixel], out.data[firstBrightPixel + 1], out.data[firstBrightPixel + 2]]).toEqual([0, 0, 0]);
  });
});
