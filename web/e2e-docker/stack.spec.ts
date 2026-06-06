import { test, expect } from '@playwright/test';

// Full-stack smoke against the assembled image: the Rails app serves the web
// bundle and the API on one origin, with the admin backoffice and Postgres.

const ADMIN_USER = 'admin@cromoswap.local';
const ADMIN_PASS = '!cromoswap!';
const authHeader = 'Basic ' + Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

// Unique per run so repeated CI runs don't collide on collector name.
const collector = `E2E_${Date.now()}`;

test('the served SPA loads and can open the board', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('gate-title')).toBeVisible();
  await expect(page.getByTestId('session-name')).toBeVisible();

  await page.getByTestId('view-board').click();
  await expect(page.getByTestId('leaderboard-title')).toBeVisible();
});

test('API + admin round-trip: synced album shows on the board and in the backoffice', async ({ request }) => {
  // Sync an album through the public API.
  const sync = await request.post('/api/v1/album_stickers/sync', {
    data: { userName: collector, codes: ['ARG01', 'ARG02', 'BRA05'] },
  });
  expect(sync.ok()).toBeTruthy();

  // It appears on the leaderboard with the right owned count.
  const board = await request.get('/api/v1/leaderboard');
  const entries = (await board.json()) as { userName: string; owned: number }[];
  expect(entries.find((e) => e.userName === collector)?.owned).toBe(3);

  // The admin backoffice is gated...
  const anon = await request.get('/admin/collectors');
  expect(anon.status()).toBe(401);

  // ...and with credentials lists the synced collector.
  const collectors = await request.get('/admin/collectors', {
    headers: { Authorization: authHeader },
  });
  expect(collectors.ok()).toBeTruthy();
  expect(await collectors.text()).toContain(collector);
});

test('browsing a collector from the board surfaces the admin backoffice link', async ({ page, request }) => {
  const user = `E2E_BOARD_${Date.now()}`;
  const sync = await request.post('/api/v1/album_stickers/sync', {
    data: { userName: user, codes: ['ARG01', 'ARG02'] },
  });
  expect(sync.ok()).toBeTruthy();

  await page.goto('/');
  await page.getByTestId('view-board').click();
  await page.getByTestId(`open-${user}`).click();

  const adminLink = page.getByTestId('admin-link');
  await expect(adminLink).toBeVisible();
  await expect(adminLink).toHaveAttribute('href', '/admin');
});

test('the admin dashboard renders for an authenticated admin', async ({ browser }) => {
  const ctx = await browser.newContext({
    baseURL,
    httpCredentials: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  const page = await ctx.newPage();
  await page.goto('/admin');
  await expect(page.getByTestId('admin-dashboard')).toBeVisible();
  await ctx.close();
});
