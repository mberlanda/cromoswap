// Copies the tesseract.js runtime assets (worker script, wasm cores, eng
// traineddata) from node_modules into public/tesseract so OCR runs entirely
// from our own origin. Without this, tesseract.js fetches executable JS/wasm
// and language data from cdn.jsdelivr.net at runtime (supply-chain exposure,
// and it would break the local-first promise and any strict CSP).
//
// public/tesseract is gitignored; this script runs before `dev` and `build`.
// Only the LSTM core variants are copied because createWorker defaults to
// OEM.LSTM_ONLY (see src/ocr/tesseract-adapter.ts).
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(webRoot, 'public', 'tesseract');

const workerSrc = join(dirname(require.resolve('tesseract.js/package.json')), 'dist', 'worker.min.js');
const coreSrc = dirname(require.resolve('tesseract.js-core/package.json'));
const langSrc = join(dirname(require.resolve('@tesseract.js-data/eng/package.json')), '4.0.0_best_int');

const coreVariants = [
  'tesseract-core-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-relaxedsimd-lstm.wasm.js',
];

mkdirSync(join(out, 'core'), { recursive: true });
mkdirSync(join(out, 'lang'), { recursive: true });

copyFileSync(workerSrc, join(out, 'worker.min.js'));
for (const file of coreVariants) {
  copyFileSync(join(coreSrc, file), join(out, 'core', file));
}
copyFileSync(join(langSrc, 'eng.traineddata.gz'), join(out, 'lang', 'eng.traineddata.gz'));

console.log(`tesseract assets copied to ${out}`);
