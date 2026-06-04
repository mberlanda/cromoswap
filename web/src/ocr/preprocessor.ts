import type { RgbaImage } from './image';

/**
 * Convert an RGBA image to a black/white image by luminance threshold.
 * Pixels at or above `threshold` become white, the rest black. Alpha is kept.
 *
 * The sticker code is light text on a dark pill, which would yield white text
 * on black — unreadable by Tesseract (it expects dark text on light). Pass
 * `invert` to flip the output so the code becomes dark-on-light.
 */
export function toGrayscaleThreshold(
  image: RgbaImage,
  threshold: number,
  invert = false,
): RgbaImage {
  const data = new Uint8ClampedArray(image.data.length);
  const hi = invert ? 0 : 255;
  const lo = invert ? 255 : 0;
  for (let i = 0; i < image.data.length; i += 4) {
    const luminance =
      0.299 * image.data[i] + 0.587 * image.data[i + 1] + 0.114 * image.data[i + 2];
    const value = luminance >= threshold ? hi : lo;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = image.data[i + 3];
  }
  return { width: image.width, height: image.height, data };
}
