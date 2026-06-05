import type { RgbaImage, RelativeRect } from './image';

/**
 * Finds where the sticker is within a camera frame, so the ROI can be taken
 * relative to the sticker rather than assuming it fills the frame. Designed as
 * a seam (ADR-0003): the brightness implementation can be replaced by a
 * contour-detect + perspective-rectify localizer later.
 */
export interface Localizer {
  locate(image: RgbaImage): RelativeRect | null;
}

export interface BrightnessLocalizerOptions {
  /** Luminance (0-255) above which a pixel counts as sticker, not background. */
  threshold?: number;
  /** Smallest accepted region, as a fraction of the whole frame. */
  minAreaFraction?: number;
}

/**
 * Detects the sticker as the largest bright connected component on a darker
 * background (the common "light sticker on a dark surface" case).
 */
export class BrightnessLocalizer implements Localizer {
  private readonly threshold: number;
  private readonly minAreaFraction: number;

  constructor(options: BrightnessLocalizerOptions = {}) {
    this.threshold = options.threshold ?? 110;
    this.minAreaFraction = options.minAreaFraction ?? 0.02;
  }

  locate(image: RgbaImage): RelativeRect | null {
    const { width: w, height: h, data } = image;
    const bright = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const lum = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
      bright[i] = lum >= this.threshold ? 1 : 0;
    }

    const seen = new Uint8Array(w * h);
    const stack: number[] = [];
    let best = { area: 0, minx: 0, miny: 0, maxx: 0, maxy: 0 };
    for (let start = 0; start < w * h; start++) {
      if (!bright[start] || seen[start]) continue;
      let area = 0;
      let minx = w;
      let miny = h;
      let maxx = 0;
      let maxy = 0;
      stack.length = 0;
      stack.push(start);
      seen[start] = 1;
      while (stack.length) {
        const p = stack.pop()!;
        const x = p % w;
        const y = (p / w) | 0;
        area++;
        if (x < minx) minx = x;
        if (x > maxx) maxx = x;
        if (y < miny) miny = y;
        if (y > maxy) maxy = y;
        if (x > 0 && bright[p - 1] && !seen[p - 1]) {
          seen[p - 1] = 1;
          stack.push(p - 1);
        }
        if (x < w - 1 && bright[p + 1] && !seen[p + 1]) {
          seen[p + 1] = 1;
          stack.push(p + 1);
        }
        if (y > 0 && bright[p - w] && !seen[p - w]) {
          seen[p - w] = 1;
          stack.push(p - w);
        }
        if (y < h - 1 && bright[p + w] && !seen[p + w]) {
          seen[p + w] = 1;
          stack.push(p + w);
        }
      }
      if (area > best.area) best = { area, minx, miny, maxx, maxy };
    }

    if (best.area < this.minAreaFraction * w * h) return null;
    return {
      x: best.minx / w,
      y: best.miny / h,
      w: (best.maxx - best.minx + 1) / w,
      h: (best.maxy - best.miny + 1) / h,
    };
  }
}

/** Map an inner relative rect into the coordinate space of an outer relative rect. */
export function composeRect(outer: RelativeRect, inner: RelativeRect): RelativeRect {
  return {
    x: outer.x + inner.x * outer.w,
    y: outer.y + inner.y * outer.h,
    w: inner.w * outer.w,
    h: inner.h * outer.h,
  };
}
