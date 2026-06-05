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
  scale = 1,
): RgbaImage {
  const safeScale = Math.max(1, Math.floor(scale));
  const width = image.width * safeScale;
  const height = image.height * safeScale;
  const data = new Uint8ClampedArray(width * height * 4);
  const hi = invert ? 0 : 255;
  const lo = invert ? 255 : 0;
  for (let y = 0; y < height; y++) {
    const srcY = Math.min(Math.floor(y / safeScale), image.height - 1);
    for (let x = 0; x < width; x++) {
      const srcX = Math.min(Math.floor(x / safeScale), image.width - 1);
      const src = (srcY * image.width + srcX) * 4;
      const dst = (y * width + x) * 4;
      const luminance =
        0.299 * image.data[src] + 0.587 * image.data[src + 1] + 0.114 * image.data[src + 2];
      const value = luminance >= threshold ? hi : lo;
      data[dst] = value;
      data[dst + 1] = value;
      data[dst + 2] = value;
      data[dst + 3] = image.data[src + 3];
    }
  }
  return { width, height, data };
}
