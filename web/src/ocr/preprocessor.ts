import type { RgbaImage } from './image';

/**
 * Convert an RGBA image to a black/white image by luminance threshold.
 * Pixels at or above `threshold` become white, the rest black. Alpha is kept.
 */
export function toGrayscaleThreshold(image: RgbaImage, threshold: number): RgbaImage {
  const data = new Uint8ClampedArray(image.data.length);
  for (let i = 0; i < image.data.length; i += 4) {
    const luminance =
      0.299 * image.data[i] + 0.587 * image.data[i + 1] + 0.114 * image.data[i + 2];
    const value = luminance >= threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = image.data[i + 3];
  }
  return { width: image.width, height: image.height, data };
}
