import type { RgbaImage } from './image';

/** Rotate an RGBA image 90 degrees clockwise. */
function rotateOnce(image: RgbaImage): RgbaImage {
  const { width: w, height: h, data: src } = image;
  const data = new Uint8ClampedArray(w * h * 4);
  const newWidth = h;
  for (let sy = 0; sy < h; sy++) {
    for (let sx = 0; sx < w; sx++) {
      const dx = h - 1 - sy;
      const dy = sx;
      const srcIdx = (sy * w + sx) * 4;
      const dstIdx = (dy * newWidth + dx) * 4;
      data[dstIdx] = src[srcIdx];
      data[dstIdx + 1] = src[srcIdx + 1];
      data[dstIdx + 2] = src[srcIdx + 2];
      data[dstIdx + 3] = src[srcIdx + 3];
    }
  }
  return { width: newWidth, height: w, data };
}

/** Rotate an image clockwise by `turns` * 90 degrees (normalized modulo 4). */
export function rotate90(image: RgbaImage, turns: number): RgbaImage {
  const normalized = ((turns % 4) + 4) % 4;
  let result = image;
  for (let i = 0; i < normalized; i++) {
    result = rotateOnce(result);
  }
  return result;
}
