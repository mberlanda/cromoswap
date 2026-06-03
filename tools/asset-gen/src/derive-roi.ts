import type { CodeBox } from './corpus';

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/**
 * Derive the region-of-interest rectangle covering all code boxes, expanded by
 * `pad` on every side and clamped to the unit square. Returns a relative rect.
 */
export function deriveRoi(boxes: CodeBox[], pad: number): CodeBox {
  if (boxes.length === 0) {
    throw new Error('deriveRoi requires at least one annotation');
  }
  const left = Math.min(...boxes.map((b) => b.x));
  const top = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.w));
  const bottom = Math.max(...boxes.map((b) => b.y + b.h));

  const x = clamp01(left - pad);
  const y = clamp01(top - pad);
  const x2 = clamp01(right + pad);
  const y2 = clamp01(bottom + pad);

  return { x, y, w: x2 - x, h: y2 - y };
}
