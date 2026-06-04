import type { RgbaImage, RelativeRect } from './image';

/**
 * Crop a relative region of interest out of an RGBA image, returning a new
 * image. The ROI is clamped so it never reads outside the source bounds.
 */
export function cropRoi(image: RgbaImage, roi: RelativeRect): RgbaImage {
  const startX = Math.round(roi.x * image.width);
  const startY = Math.round(roi.y * image.height);
  const cropW = Math.min(Math.round(roi.w * image.width), image.width - startX);
  const cropH = Math.min(Math.round(roi.h * image.height), image.height - startY);

  const data = new Uint8ClampedArray(cropW * cropH * 4);
  for (let row = 0; row < cropH; row++) {
    for (let col = 0; col < cropW; col++) {
      const srcIdx = ((startY + row) * image.width + (startX + col)) * 4;
      const dstIdx = (row * cropW + col) * 4;
      data[dstIdx] = image.data[srcIdx];
      data[dstIdx + 1] = image.data[srcIdx + 1];
      data[dstIdx + 2] = image.data[srcIdx + 2];
      data[dstIdx + 3] = image.data[srcIdx + 3];
    }
  }
  return { width: cropW, height: cropH, data };
}
