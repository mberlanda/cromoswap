import { describe, it, expect } from 'vitest';
import { toGrayscaleThreshold, toNormalizedGrayscale } from '../src/ocr/preprocessor';
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

describe('toNormalizedGrayscale', () => {
  it('stretches a low-contrast range to full black/white', () => {
    // Two grays only 40 apart: after normalization they should span 0..255.
    const image: RgbaImage = {
      width: 2,
      height: 1,
      data: new Uint8ClampedArray([
        100, 100, 100, 255,
        140, 140, 140, 255,
      ]),
    };
    const out = toNormalizedGrayscale(image);
    expect(out.data[0]).toBe(0);
    expect(out.data[4]).toBe(255);
  });

  it('inverts before stretching so a light-on-dark pill becomes dark-on-light', () => {
    const image: RgbaImage = {
      width: 2,
      height: 1,
      data: new Uint8ClampedArray([
        220, 220, 220, 255, // light code stroke
        60, 60, 60, 255, // dark pill background
      ]),
    };
    const out = toNormalizedGrayscale(image, true);
    expect(out.data[0]).toBe(0); // stroke -> black text
    expect(out.data[4]).toBe(255); // pill -> white background
  });

  it('produces grayscale output (equal channels) and preserves alpha', () => {
    const image: RgbaImage = {
      width: 2,
      height: 1,
      data: new Uint8ClampedArray([
        200, 40, 90, 128,
        10, 230, 60, 255,
      ]),
    };
    const out = toNormalizedGrayscale(image);
    expect(out.data[0]).toBe(out.data[1]);
    expect(out.data[1]).toBe(out.data[2]);
    expect(out.data[3]).toBe(128);
  });

  it('leaves a uniform image unchanged instead of dividing by zero', () => {
    const image: RgbaImage = {
      width: 2,
      height: 1,
      data: new Uint8ClampedArray([
        77, 77, 77, 255,
        77, 77, 77, 255,
      ]),
    };
    const out = toNormalizedGrayscale(image);
    expect(out.data[0]).toBe(77);
    expect(out.data[4]).toBe(77);
  });

  it('upscales with the same nearest-neighbor scheme as the threshold path', () => {
    const image: RgbaImage = {
      width: 2,
      height: 1,
      data: new Uint8ClampedArray([
        0, 0, 0, 255,
        255, 255, 255, 255,
      ]),
    };
    const out = toNormalizedGrayscale(image, false, 3);
    expect(out.width).toBe(6);
    expect(out.height).toBe(3);
    expect(out.data[0]).toBe(0);
    const firstBright = (0 * out.width + 3) * 4;
    expect(out.data[firstBright]).toBe(255);
  });

  it('ignores outlier pixels via percentile clipping', () => {
    // 100 mid-gray pixels with one near-black and one near-white outlier:
    // the stretch should be driven by the bulk, clamping the outliers.
    const n = 100;
    const data = new Uint8ClampedArray(n * 4);
    for (let i = 0; i < n; i++) {
      const v = i === 0 ? 0 : i === 1 ? 255 : 120 + (i % 21); // bulk in 120..140
      data[i * 4] = v;
      data[i * 4 + 1] = v;
      data[i * 4 + 2] = v;
      data[i * 4 + 3] = 255;
    }
    const out = toNormalizedGrayscale({ width: n, height: 1, data });
    // Outliers clamp to the extremes...
    expect(out.data[0]).toBe(0);
    expect(out.data[4]).toBe(255);
    // ...and the bulk still spans a wide range (stretch not killed by outliers).
    let min = 255;
    let max = 0;
    for (let i = 2; i < n; i++) {
      min = Math.min(min, out.data[i * 4]);
      max = Math.max(max, out.data[i * 4]);
    }
    expect(max - min).toBeGreaterThan(200);
  });
});
