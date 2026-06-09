import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Local (IndexedDB) mode — no backend. Drives the core UI by data-test-id so
// internal refactors stay safe. Switching to Local rebuilds the deps to use
// IndexedDB and persists the choice in localStorage.

async function startLocalSession(page: Page, name = 'Mauro') {
  await page.goto('/');
  await page.getByTestId('storage-local').click();
  await page.getByTestId('session-name').fill(name);
  await page.getByTestId('start-session').click();
  await page.getByTestId('reps-view-manual').click();
}

async function addManually(page: Page, prefix: string, number: string) {
  await page.getByTestId('manual-prefix').fill(prefix);
  await page.getByTestId('manual-number').selectOption(number);
  await page.getByTestId('manual-add').click();
}

test('local: manual add persists across reload and exports', async ({ page }) => {
  await startLocalSession(page);
  await addManually(page, 'ARG', '01');

  const collection = page.getByRole('list', { name: /collection/i });
  await expect(collection.getByText('ARG01')).toBeVisible();

  // Persists across reload -> resume (IndexedDB).
  await page.reload();
  await page.getByTestId('resume-Mauro').click();
  await page.getByTestId('reps-view-manual').click();
  await expect(collection.getByText('ARG01')).toBeVisible();

  // Export text contains the code.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-text').click(),
  ]);
  const contents = readFileSync((await download.path())!, 'utf8');
  expect(contents).toContain('ARG01');
});

test('local: navigates between album, reps grid, and home', async ({ page }) => {
  await startLocalSession(page);

  await page.getByTestId('tab-album').click();
  await expect(page.getByRole('heading', { name: /fifa world cup/i })).toBeVisible();

  await page.getByTestId('tab-reps').click();
  await page.getByTestId('reps-view-grid').click();
  await expect(page.getByTestId('reps-mode')).toBeVisible();

  await page.getByTestId('tab-home').click();
  await expect(page.getByTestId('session-name')).toBeVisible();
});

test('local: stats tab shows seeded histogram and supports player switch', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('storage-local').click();

  await page.getByTestId('import-name').fill('Mauro');
  await page.getByTestId('import-owned').click();
  await page.getByTestId('import-file').setInputFiles({
    name: 'mauro.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('ARG01\nARG02\nBRA05\n'),
  });
  await expect(page.getByTestId('import-result')).toContainText('Imported 3 owned stickers');

  await page.getByTestId('import-name').fill('Luca');
  await page.getByTestId('import-file').setInputFiles({
    name: 'luca.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('ARG01\n'),
  });
  await expect(page.getByTestId('import-result')).toContainText('Imported 1 owned sticker');

  await page.getByTestId('resume-Mauro').click();
  await page.getByTestId('tab-stats').click();
  await expect(page.getByTestId('stats-summary')).toContainText('Mauro: 3 owned stickers');

  await page.getByTestId('stats-player-select').selectOption('Luca');
  await expect(page.getByTestId('stats-summary')).toContainText('Luca: 1 owned sticker');
  await expect(page.getByTestId('hist-row-20')).toBeVisible();
});

test('local: stats and leaderboard are reachable from hamburger menu', async ({ page }) => {
  await startLocalSession(page);

  await page.getByTestId('nav-menu-toggle').click();
  await page.getByTestId('menu-stats').click();
  await expect(page.getByRole('heading', { name: /sticker histogram/i })).toBeVisible();

  await page.getByTestId('nav-menu-toggle').click();
  await page.getByTestId('menu-home').click();
  await expect(page.getByTestId('session-name')).toBeVisible();
});
