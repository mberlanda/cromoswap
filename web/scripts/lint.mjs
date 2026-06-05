#!/usr/bin/env node
/**
 * Deterministic, programmatic ESLint gate.
 *
 * Runs ESLint through its Node API instead of the CLI so the result is stable
 * and scriptable:
 *   - fixed working directory (independent of where it is invoked from),
 *   - results sorted by file path with a locale-independent comparison,
 *   - exits non-zero on ANY error OR warning (equivalent to
 *     `eslint . --max-warnings 0`),
 *   - no autofix and no cache, so a run only reports, never mutates.
 *
 * Exit codes: 0 = clean, 1 = lint problems found, 2 = the run itself failed.
 *
 *   node scripts/lint.mjs   (or: npm run lint:check)
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Locale-independent ordering: compare by Unicode code points, not localeCompare.
const byFilePath = (a, b) => (a.filePath < b.filePath ? -1 : a.filePath > b.filePath ? 1 : 0);

async function main() {
  const eslint = new ESLint({ cwd: webRoot, cache: false, fix: false });
  const results = await eslint.lintFiles(['.']);
  results.sort(byFilePath);

  const formatter = await eslint.loadFormatter('stylish');
  const output = await formatter.format(results);
  if (output.trim()) console.log(output);

  const errors = results.reduce((n, r) => n + r.errorCount, 0);
  const warnings = results.reduce((n, r) => n + r.warningCount, 0);
  console.log(
    `eslint: ${errors} error(s), ${warnings} warning(s) across ${results.length} file(s).`,
  );
  process.exitCode = errors + warnings > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 2;
});
