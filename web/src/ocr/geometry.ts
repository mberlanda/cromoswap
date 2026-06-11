import type { RelativeRect } from './image';

export type Orientation = 'portrait' | 'landscape';

/** Physical sticker aspect (width / height) per orientation, ~3:4. */
export const STICKER_ASPECT: Record<Orientation, number> = {
  portrait: 3 / 4,
  landscape: 4 / 3,
};

/** Aspect (width / height) of the fixed portrait camera preview box. */
export const PREVIEW_BOX_ASPECT = 3 / 4;

/** Targeting tolerance: a well-framed sticker fills most of the guide... */
const MIN_FILL_FRACTION = 0.5;
/** ...and its longer/shorter side ratio sits near 1.33. */
const MIN_ASPECT_RATIO = 1.15;
const MAX_ASPECT_RATIO = 1.55;

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * The scan guide, centered in the preview box and locked to the sticker's
 * physical aspect ratio for the orientation. Returned in *display* space
 * (0-1 of the preview box).
 *
 * @param size       longer side as a fraction of the matching box dimension
 * @param boxAspect  preview box width / height (the preview stays portrait)
 */
export function centeredRect(
  orientation: Orientation,
  size: number,
  boxAspect: number,
): RelativeRect {
  const sticker = STICKER_ASPECT[orientation];
  let w: number;
  let h: number;
  if (sticker < boxAspect) {
    // Taller than the box: height is the limiting dimension.
    h = size;
    w = size * (sticker / boxAspect);
  } else {
    // Wider than the box: width is the limiting dimension.
    w = size;
    h = size * (boxAspect / sticker);
  }
  w = clamp01(w);
  h = clamp01(h);
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

/**
 * Map a rect from *display* space (0-1 of the `object-fit: cover` preview box)
 * into *frame* space (0-1 of the captured `frameW x frameH` image), accounting
 * for the center-crop that cover applies.
 */
export function coverMapRect(
  display: RelativeRect,
  frameW: number,
  frameH: number,
  boxAspect: number,
): RelativeRect {
  const frameAspect = frameW / frameH;
  let x0 = 0;
  let y0 = 0;
  let w0 = 1;
  let h0 = 1;
  if (frameAspect > boxAspect) {
    // Frame wider than box: cover crops the left/right.
    w0 = boxAspect / frameAspect;
    x0 = (1 - w0) / 2;
  } else if (frameAspect < boxAspect) {
    // Frame taller than box: cover crops the top/bottom.
    h0 = frameAspect / boxAspect;
    y0 = (1 - h0) / 2;
  }
  return {
    x: x0 + display.x * w0,
    y: y0 + display.y * h0,
    w: display.w * w0,
    h: display.h * h0,
  };
}

/**
 * Whether a bright region (relative to its crop) looks like a well-framed
 * sticker: it fills most of the crop and its pixel aspect is near 3:4.
 *
 * @param bbox       detected region, relative to the crop it was found in
 * @param cropAspect the crop's pixel aspect (cropW / cropH)
 */
export function isWellTargeted(bbox: RelativeRect, cropAspect: number): boolean {
  const fill = bbox.w * bbox.h;
  if (fill < MIN_FILL_FRACTION) return false;
  const pixelAspect = (bbox.w / bbox.h) * cropAspect;
  const ratio = Math.max(pixelAspect, 1 / pixelAspect);
  return ratio >= MIN_ASPECT_RATIO && ratio <= MAX_ASPECT_RATIO;
}

/**
 * Grow a relative rect by `margin` (fraction of its own size) on every side,
 * clamped to the unit square. Used to turn a tight sticker bbox into a
 * guide-like crop that keeps some context around the sticker (mirrors how the
 * user frames the sticker inside the scan guide with breathing room).
 */
export function expandRect(rect: RelativeRect, margin: number): RelativeRect {
  const dx = rect.w * margin;
  const dy = rect.h * margin;
  const x = clamp01(rect.x - dx);
  const y = clamp01(rect.y - dy);
  return {
    x,
    y,
    w: clamp01(rect.x + rect.w + dx) - x,
    h: clamp01(rect.y + rect.h + dy) - y,
  };
}
