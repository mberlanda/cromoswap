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
  // Opt out of the camera — manual entry must be reachable without one.
  await page.getByTestId('enter-manually').click();
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
  await page.getByTestId('enter-manually').click();
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

  await page.getByTestId('home').click();
  await expect(page.getByTestId('session-name')).toBeVisible();
});
