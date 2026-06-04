import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// End-to-end happy path without a real camera: the app falls back to manual
// entry when getUserMedia is unavailable (as in headless Chromium).
test('create session, add a code, persist across reload, and export', async ({ page }) => {
  await page.goto('/');

  // Session creation
  await page.getByLabel(/name/i).fill('Mauro');
  await page.getByRole('button', { name: /start scanning/i }).click();

  // Manual add (camera-free path)
  await page.getByLabel(/^code$/i).fill('USA13');
  await page.getByRole('button', { name: /^add$/i }).click();

  const collection = page.getByRole('list', { name: /collection/i });
  await expect(collection.getByText('USA13')).toBeVisible();

  // Persistence across reload -> resume the session
  await page.reload();
  await page.getByRole('button', { name: /resume.*mauro/i }).click();
  await expect(collection.getByText('USA13')).toBeVisible();

  // Export the text list
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /export text/i }).click(),
  ]);
  const path = await download.path();
  const contents = readFileSync(path, 'utf8');
  expect(contents).toContain('USA13');
  expect(contents).toContain('user: Mauro');
});
