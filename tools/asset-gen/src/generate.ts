import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CorpusAnnotation } from './corpus';
import { buildMaskConfig, OCR_PROFILE } from './build-assets';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');

/**
 * Seed corpus encoding domain knowledge: codes sit near the top-right corner.
 * Replace/extend with real annotations as the corpus grows; regenerating is a
 * pure build step with no runtime change.
 */
const SEED_CORPUS: CorpusAnnotation[] = [
  { orientation: 'portrait', box: { x: 0.7, y: 0.03, w: 0.24, h: 0.1 } },
  { orientation: 'portrait', box: { x: 0.72, y: 0.04, w: 0.22, h: 0.09 } },
  { orientation: 'portrait', box: { x: 0.68, y: 0.05, w: 0.26, h: 0.1 } },
  { orientation: 'landscape', box: { x: 0.76, y: 0.05, w: 0.2, h: 0.14 } },
  { orientation: 'landscape', box: { x: 0.78, y: 0.06, w: 0.18, h: 0.13 } },
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
