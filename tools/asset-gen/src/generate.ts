import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CorpusAnnotation } from './corpus';
import { buildMaskConfig, OCR_PROFILE } from './build-assets';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');

/**
 * Seed corpus annotated from the real Panini WC 2026 sticker backs: the code
 * sits in a wide rounded pill at the top-right (e.g. "CRO 20", "GHA 1",
 * "FWC 17"). Boxes are relative to the sticker; the pill is far wider than
 * tall. Extend with more annotations as the corpus grows — regenerating is a
 * pure build step with no runtime change.
 */
const SEED_CORPUS: CorpusAnnotation[] = [
  // Portrait (CRO 20, GHA 1, GHA 7): pill across the top-right.
  { orientation: 'portrait', box: { x: 0.6, y: 0.035, w: 0.34, h: 0.06 } },
  { orientation: 'portrait', box: { x: 0.58, y: 0.04, w: 0.36, h: 0.055 } },
  { orientation: 'portrait', box: { x: 0.62, y: 0.03, w: 0.32, h: 0.065 } },
  // Landscape (FWC 17): shorter sticker, so the pill is a touch taller relative.
  { orientation: 'landscape', box: { x: 0.62, y: 0.05, w: 0.33, h: 0.1 } },
  { orientation: 'landscape', box: { x: 0.6, y: 0.06, w: 0.35, h: 0.09 } },
];

const PAD = 0.02;

function writeJson(relPath: string, data: unknown): void {
  const target = resolve(repoRoot, relPath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(data, null, 2) + '\n');
  console.log(`wrote ${relPath}`);
}

const maskConfig = buildMaskConfig(SEED_CORPUS, PAD);
const prefixes = JSON.parse(readFileSync(resolve(repoRoot, 'assets/prefixes.json'), 'utf8'));

for (const dir of ['assets', 'web/src/assets']) {
  writeJson(`${dir}/mask-config.json`, maskConfig);
  writeJson(`${dir}/ocr-profile.json`, OCR_PROFILE);
  writeJson(`${dir}/prefixes.json`, prefixes);
}
