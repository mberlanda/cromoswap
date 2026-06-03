import { describe, it, expect } from 'vitest';
import { buildMaskConfig } from '../src/build-assets';
import type { CorpusAnnotation } from '../src/corpus';

describe('buildMaskConfig', () => {
  const corpus: CorpusAnnotation[] = [
    { orientation: 'portrait', box: { x: 0.7, y: 0.04, w: 0.22, h: 0.09 } },
    { orientation: 'portrait', box: { x: 0.72, y: 0.05, w: 0.2, h: 0.08 } },
    { orientation: 'landscape', box: { x: 0.78, y: 0.06, w: 0.18, h: 0.12 } },
  ];

  it('produces a roi per orientation present in the corpus', () => {
    const cfg = buildMaskConfig(corpus, 0.02);
    expect(Object.keys(cfg.orientations).sort()).toEqual(['landscape', 'portrait']);
    expect(cfg.orientations.portrait.roi.x).toBeGreaterThan(0.6);
    expect(cfg.orientations.landscape.roi.x).toBeGreaterThan(0.7);
  });

  it('keeps the roi inside the unit square', () => {
    const cfg = buildMaskConfig(corpus, 0.02);
    for (const o of Object.values(cfg.orientations)) {
      expect(o.roi.x + o.roi.w).toBeLessThanOrEqual(1);
      expect(o.roi.y + o.roi.h).toBeLessThanOrEqual(1);
    }
  });

  it('ignores orientations with no annotations', () => {
    const cfg = buildMaskConfig(
      [{ orientation: 'portrait', box: { x: 0.7, y: 0.04, w: 0.2, h: 0.08 } }],
      0.02,
    );
    expect(Object.keys(cfg.orientations)).toEqual(['portrait']);
  });
});
