import { describe, it, expect } from 'vitest';
import { deriveRoi } from '../src/derive-roi';

describe('deriveRoi', () => {
  it('returns the padded union rectangle of code boxes (relative, clamped)', () => {
    const roi = deriveRoi(
      [
        { x: 0.7, y: 0.05, w: 0.2, h: 0.08 },
        { x: 0.72, y: 0.04, w: 0.22, h: 0.1 },
      ],
      0.02,
    );
    expect(roi.x).toBeCloseTo(0.68);
    expect(roi.y).toBeCloseTo(0.02);
    // union right edge = max(0.7+0.2, 0.72+0.22)=0.94, +pad 0.02 => 0.96
    expect(roi.x + roi.w).toBeCloseTo(0.96);
    expect(roi.h).toBeLessThanOrEqual(1);
  });

  it('clamps the padded rectangle to [0,1]', () => {
    const roi = deriveRoi([{ x: 0.95, y: 0.0, w: 0.1, h: 0.1 }], 0.1);
    expect(roi.x).toBeGreaterThanOrEqual(0);
    expect(roi.y).toBeGreaterThanOrEqual(0);
    expect(roi.x + roi.w).toBeLessThanOrEqual(1);
    expect(roi.y + roi.h).toBeLessThanOrEqual(1);
  });

  it('throws on empty annotation list', () => {
    expect(() => deriveRoi([], 0.02)).toThrow();
  });
});
