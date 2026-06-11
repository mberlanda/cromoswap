import { describe, it, expect } from 'vitest';
import { centeredRect, coverMapRect, expandRect, isWellTargeted } from '../src/ocr/geometry';

describe('centeredRect', () => {
  it('portrait in a 3:4 box is a centered normalized square', () => {
    // boxAspect 0.75 already matches the portrait sticker, so the guide is square
    // in normalized space (it displays as 3:4).
    const r = centeredRect('portrait', 0.8, 0.75);
    expect(r.w).toBeCloseTo(0.8, 5);
    expect(r.h).toBeCloseTo(0.8, 5);
    expect(r.x).toBeCloseTo(0.1, 5);
    expect(r.y).toBeCloseTo(0.1, 5);
  });

  it('landscape in a 3:4 box is a centered wide rect', () => {
    const r = centeredRect('landscape', 0.8, 0.75);
    expect(r.w).toBeCloseTo(0.8, 5);
    expect(r.h).toBeCloseTo(0.45, 5); // 0.8 * (0.75 / (4/3))
    expect(r.x).toBeCloseTo(0.1, 5);
    expect(r.y).toBeCloseTo(0.275, 5);
  });

  it('landscape guide displays at the 4:3 physical aspect', () => {
    const r = centeredRect('landscape', 0.6, 0.75);
    const physicalAspect = (r.w / r.h) * 0.75;
    expect(physicalAspect).toBeCloseTo(4 / 3, 4);
  });

  it('clamps so the guide never exceeds the box', () => {
    const r = centeredRect('portrait', 1.4, 0.75);
    expect(r.w).toBeLessThanOrEqual(1);
    expect(r.h).toBeLessThanOrEqual(1);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
  });
});

describe('coverMapRect', () => {
  it('is the identity when the frame aspect equals the box aspect', () => {
    const display = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
    const out = coverMapRect(display, 3, 4, 0.75);
    expect(out.x).toBeCloseTo(0.1, 5);
    expect(out.y).toBeCloseTo(0.1, 5);
    expect(out.w).toBeCloseTo(0.8, 5);
    expect(out.h).toBeCloseTo(0.8, 5);
  });

  it('maps into the visible center strip when the frame is wider than the box', () => {
    // frame 8x3 (aspect 2.667) covered into a 0.75 box crops the sides.
    const out = coverMapRect({ x: 0, y: 0, w: 1, h: 1 }, 8, 3, 0.75);
    const w0 = 0.75 / (8 / 3);
    expect(out.w).toBeCloseTo(w0, 5);
    expect(out.x).toBeCloseTo((1 - w0) / 2, 5);
    expect(out.y).toBeCloseTo(0, 5);
    expect(out.h).toBeCloseTo(1, 5);
  });

  it('maps into the visible center strip when the frame is taller than the box', () => {
    // frame 3x8 (aspect 0.375) covered into a 0.75 box crops top/bottom.
    const out = coverMapRect({ x: 0, y: 0, w: 1, h: 1 }, 3, 8, 0.75);
    const h0 = 0.375 / 0.75;
    expect(out.h).toBeCloseTo(h0, 5);
    expect(out.y).toBeCloseTo((1 - h0) / 2, 5);
    expect(out.x).toBeCloseTo(0, 5);
    expect(out.w).toBeCloseTo(1, 5);
  });
});

describe('isWellTargeted', () => {
  it('is true when a near-full crop has ~3:4 aspect', () => {
    // bbox fills 90% of a crop whose pixel aspect is 0.75 (3:4) -> ratio 1.33.
    expect(isWellTargeted({ x: 0.03, y: 0.03, w: 0.94, h: 0.94 }, 0.75)).toBe(true);
  });

  it('is false when the bright region is too small', () => {
    expect(isWellTargeted({ x: 0.4, y: 0.4, w: 0.2, h: 0.2 }, 0.75)).toBe(false);
  });

  it('is false when the aspect ratio is far from 3:4', () => {
    // A long thin region in a square crop -> pixel aspect ~ 9, way past tolerance.
    expect(isWellTargeted({ x: 0, y: 0.45, w: 0.9, h: 0.1 }, 1)).toBe(false);
  });
});

describe('expandRect', () => {
  it('grows the rect by the margin fraction on every side', () => {
    const out = expandRect({ x: 0.4, y: 0.4, w: 0.2, h: 0.2 }, 0.5);
    expect(out.x).toBeCloseTo(0.3);
    expect(out.y).toBeCloseTo(0.3);
    expect(out.w).toBeCloseTo(0.4);
    expect(out.h).toBeCloseTo(0.4);
  });

  it('clamps to the unit square at the edges', () => {
    const out = expandRect({ x: 0, y: 0.9, w: 0.2, h: 0.1 }, 1);
    expect(out.x).toBe(0);
    expect(out.y).toBeCloseTo(0.8);
    expect(out.x + out.w).toBeLessThanOrEqual(1);
    expect(out.y + out.h).toBeLessThanOrEqual(1);
  });
});
