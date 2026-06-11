import type { RgbaImage } from './image';

/**
 * Convert an RGBA image to a contrast-stretched grayscale image: luminance,
 * optional inversion (for light-on-dark code pills), then a linear stretch of
 * the 1st..99th luminance percentiles to 0..255 (matching sharp's
 * `normalise`, which the OCR fixture harness validated). Unlike the fixed
 * binary threshold this adapts to the actual lighting of the crop, so glare
 * or shadow shifts don't wipe out the glyphs.
 */
export function toNormalizedGrayscale(image: RgbaImage, invert = false, scale = 1): RgbaImage {
  const count = image.width * image.height;
  const lum = new Uint8ClampedArray(count);
  const histogram = new Uint32Array(256);
  for (let i = 0; i < count; i++) {
    const src = i * 4;
    const raw =
      0.299 * image.data[src] + 0.587 * image.data[src + 1] + 0.114 * image.data[src + 2];
    lum[i] = invert ? 255 - raw : raw;
    histogram[lum[i]] += 1;
  }

  const clip = count / 100; // 1% per tail
  let lo = 0;
  let hi = 255;
  for (let seen = 0; lo < 255; lo++) {
    seen += histogram[lo];
    if (seen > clip) break;
  }
  for (let seen = 0; hi > 0; hi--) {
    seen += histogram[hi];
    if (seen > clip) break;
  }
  const range = hi - lo;

  const safeScale = Math.max(1, Math.floor(scale));
  const width = image.width * safeScale;
  const height = image.height * safeScale;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcY = Math.min(Math.floor(y / safeScale), image.height - 1);
    for (let x = 0; x < width; x++) {
      const srcX = Math.min(Math.floor(x / safeScale), image.width - 1);
      const src = srcY * image.width + srcX;
      const value = range > 0 ? ((lum[src] - lo) * 255) / range : lum[src];
      const dst = (y * width + x) * 4;
      data[dst] = value;
      data[dst + 1] = value;
      data[dst + 2] = value;
      data[dst + 3] = image.data[src * 4 + 3];
    }
  }
  return { width, height, data };
}

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
