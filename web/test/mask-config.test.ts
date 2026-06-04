import { describe, it, expect } from 'vitest';
import maskConfig from '../src/assets/mask-config.json';

// The real sticker backs show the code in a wide rounded pill at the top-right
// (e.g. "CRO 20", "FWC 17"). The generated ROI must match that: wide, near the
// top, and pushed to the right — for both portrait and landscape.
describe('mask-config ROIs match the real code pill', () => {
  const orientations = Object.entries(maskConfig.orientations);

  it('defines portrait and landscape', () => {
    expect(maskConfig.orientations.portrait).toBeDefined();
    expect(maskConfig.orientations.landscape).toBeDefined();
  });

  it.each(orientations)('%s roi is a wide pill (w > 2*h)', (_name, mask) => {
    expect(mask.roi.w).toBeGreaterThan(mask.roi.h * 2);
  });

  it.each(orientations)('%s roi sits in the top-right corner', (_name, mask) => {
    expect(mask.roi.x + mask.roi.w).toBeGreaterThan(0.9); // reaches the right edge
    expect(mask.roi.y).toBeLessThan(0.15); // near the top
  });
});
