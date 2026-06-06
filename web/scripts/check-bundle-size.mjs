// Performance budget: fail if the built JS (gzipped) exceeds the budget.
// Guards against accidental bundle bloat. Run after `npm run build`.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const DIR = 'dist/assets';
const BUDGET = Number(process.env.BUNDLE_BUDGET_BYTES ?? 150_000);

if (!existsSync(DIR)) {
  console.error(`No build output at ${DIR}; run "npm run build" first.`);
  process.exit(1);
}

const total = readdirSync(DIR)
  .filter((f) => f.endsWith('.js'))
  .reduce((sum, f) => sum + gzipSync(readFileSync(`${DIR}/${f}`)).length, 0);

const kb = (n) => `${(n / 1000).toFixed(1)} KB`;
console.log(`JS gzip total: ${kb(total)} (budget ${kb(BUDGET)})`);

if (total > BUDGET) {
  console.error(`❌ Bundle exceeds the performance budget by ${kb(total - BUDGET)}.`);
  process.exit(1);
}
console.log('✓ Within performance budget.');
