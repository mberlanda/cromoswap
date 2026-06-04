import { describe, it, expect } from 'vitest';
import { rotate90 } from '../src/ocr/rotate';
import type { RgbaImage } from '../src/ocr/image';

// 2x1 image: pixel A (red index 10) at (0,0), pixel B (red index 20) at (1,0).
function makeWide(): RgbaImage {
  const data = new Uint8ClampedArray(2 * 1 * 4);
  data[0] = 10;
  data[3] = 255;
  data[4] = 20;
  data[7] = 255;
  return { width: 2, height: 1, data };
}

function redAt(img: RgbaImage, x: number, y: number): number {
  return img.data[(y * img.width + x) * 4];
}

describe('rotate90', () => {
  it('returns the same image for 0 turns', () => {
    const img = makeWide();
    const out = rotate90(img, 0);
    expect(out).toEqual(img);
  });

  it('swaps dimensions for a single clockwise turn', () => {
    const out = rotate90(makeWide(), 1);
    expect(out.width).toBe(1);
    expect(out.height).toBe(2);
  });

  it('rotates pixels clockwise (left pixel moves to top)', () => {
    // Clockwise 90: source (0,0) -> dest (top), source (1,0) -> dest (bottom).
    const out = rotate90(makeWide(), 1);
    expect(redAt(out, 0, 0)).toBe(10);
    expect(redAt(out, 0, 1)).toBe(20);
  });

  it('two turns restores the original dimensions', () => {
    const out = rotate90(makeWide(), 2);
    expect(out.width).toBe(2);
    expect(out.height).toBe(1);
    expect(redAt(out, 0, 0)).toBe(20);
    expect(redAt(out, 1, 0)).toBe(10);
  });

  it('normalizes turn counts modulo 4', () => {
    expect(rotate90(makeWide(), 4)).toEqual(makeWide());
  });
});
