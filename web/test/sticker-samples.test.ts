import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import maskConfig from '../src/assets/mask-config.json';
import { validateCode } from '../src/domain/validator';
import type { RelativeRect } from '../src/ocr/image';

type Sample = {
  file: string;
  code: string;
  orientation: 'portrait' | 'landscape';
  codeBox: RelativeRect;
};

const samples: Sample[] = [
  {
    file: 'cro-20-portrait.jpg',
    code: 'CRO20',
    orientation: 'portrait',
    codeBox: { x: 0.66, y: 0.04, w: 0.28, h: 0.07 },
  },
  {
    file: 'fwc-17-landscape.jpg',
    code: 'FWC17',
    orientation: 'landscape',
    codeBox: { x: 0.62, y: 0.05, w: 0.33, h: 0.1 },
  },
  {
    file: 'gha-7-portrait.jpg',
    code: 'GHA07',
    orientation: 'portrait',
    codeBox: { x: 0.66, y: 0.04, w: 0.3, h: 0.07 },
  },
  {
    file: 'gha-1-portrait.jpg',
    code: 'GHA01',
    orientation: 'portrait',
    codeBox: { x: 0.68, y: 0.04, w: 0.27, h: 0.07 },
  },
];

const fixturePath = (file: string) => resolve('test/fixtures/stickers', file);

function contains(outer: RelativeRect, inner: RelativeRect): boolean {
  return (
    outer.x <= inner.x &&
    outer.y <= inner.y &&
    outer.x + outer.w >= inner.x + inner.w &&
    outer.y + outer.h >= inner.y + inner.h
  );
}

describe('tracked sticker samples', () => {
  it.each(samples)('$file is committed as a decodable fixture', async ({ file }) => {
    const path = fixturePath(file);
    expect(existsSync(path)).toBe(true);
    const metadata = await sharp(path).metadata();
    expect(metadata.width).toBeGreaterThan(100);
    expect(metadata.height).toBeGreaterThan(100);
  });

  it.each(samples)('$code is valid for the current album preset', ({ code }) => {
    expect(validateCode(code)).not.toBeNull();
  });

  it.each(samples)('mask ROI covers the annotated code pill in $file', ({ orientation, codeBox }) => {
    const roi = maskConfig.orientations[orientation].roi;
    expect(contains(roi, codeBox)).toBe(true);
  });
});
