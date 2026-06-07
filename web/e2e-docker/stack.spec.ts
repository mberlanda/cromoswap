import { test, expect, type APIRequestContext } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// Full-stack smoke against the assembled image: the Rails app serves the web
// bundle and the API on one origin, with the admin backoffice and Postgres.

const ADMIN_USER = 'admin@cromoswap.local';
const ADMIN_PASS = '!cromoswap!';
const authHeader = 'Basic ' + Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

// Unique per run so repeated CI runs don't collide on collector name. Usernames
// are constrained to lowercase alphanumeric (^[a-z0-9]+$), so no underscores.
const collector = `e2e${Date.now()}`;

// Writes now require a Bearer JWT scoped to the registering user; the album is
// keyed by the session's user_name (== username). Returns the token.
async function registerCollector(request: APIRequestContext, username: string): Promise<string> {
  const res = await request.post('/api/v1/auth/register', {
    data: { username, password: 'supersecret' },
  });
  expect(res.ok()).toBeTruthy();
  const { token } = (await res.json()) as { token: string };
  return token;
}

test('the served SPA loads and can open the board', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('gate-title')).toBeVisible();
  // Cloud is the default storage mode, so the gate asks you to log in / register.
  // The board stays browsable without an account.
  await expect(page.getByTestId('auth-username')).toBeVisible();

  await page.getByTestId('view-board').click();
  await expect(page.getByTestId('leaderboard-title')).toBeVisible();
});

test('switching to local mode shows the name-based session gate', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('storage-local').click();
  await expect(page.getByTestId('session-name')).toBeVisible();
});

test('API + admin round-trip: synced album shows on the board and in the backoffice', async ({ request }) => {
  // Register, then sync an album through the authenticated API.
  const token = await registerCollector(request, collector);
  const sync = await request.post('/api/v1/album_stickers/sync', {
    headers: { Authorization: `Bearer ${token}` },
    data: { codes: ['ARG01', 'ARG02', 'BRA05'] },
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
  const user = `e2eboard${Date.now()}`;
  const token = await registerCollector(request, user);
  const sync = await request.post('/api/v1/album_stickers/sync', {
    headers: { Authorization: `Bearer ${token}` },
    data: { codes: ['ARG01', 'ARG02'] },
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

test('the admin SQL export returns a non-empty dump with schema and seeded data', async ({ browser, request }) => {
  const seed = {
    userName: 'giacomopietro',
    codes: ['ALG05', 'ARG01'],
  };
  const token = await registerCollector(request, seed.userName);
  const sync = await request.post('/api/v1/album_stickers/sync', {
    headers: { Authorization: `Bearer ${token}` },
    data: { codes: seed.codes },
  });
  expect(sync.ok()).toBeTruthy();

  const ctx = await browser.newContext({
    baseURL,
    httpCredentials: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  const page = await ctx.newPage();
  await page.goto('/admin');
  await expect(page.getByTestId('admin-dashboard')).toBeVisible();

  const responsePromise = page.waitForResponse((response) => {
    return new URL(response.url()).pathname === '/admin/export.sql';
  });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Export SQL' }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(200);

  const download = await downloadPromise;
  await expect(page.getByText('Export failed:')).not.toBeVisible();
  expect(await download.failure()).toBeNull();
  const path = await download.path();
  expect(path).toBeTruthy();

  const sql = await readFile(path!, 'utf8');
  expect(sql.length).toBeGreaterThan(1000);
  expect(sql).toContain('CREATE TABLE public.album_stickers');
  expect(sql).toContain(seed.userName);
  expect(sql).toContain('ALG05');
  expect(sql).toContain('ARG01');
  expect(sql).not.toContain('Export failed:');

  await ctx.close();
});
