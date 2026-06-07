import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildCloudSaver } from '../src/storage/save-to-cloud';
import { setToken, TOKEN_KEY } from '../src/auth/auth';
import type { Scan, Session } from '../src/domain/types';

const BASE = 'http://api.test';

const session: Session = {
  id: 'sess-1',
  userName: 'mauro',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

const scan: Scan = {
  id: 'scan-1',
  sessionId: 'sess-1',
  normalizedCode: 'ARG01',
  source: 'ocr',
  confidence: 0.9,
  capturedAt: '2026-06-04T00:00:00.000Z',
  createdAt: '2026-06-04T00:00:00.000Z',
  updatedAt: '2026-06-04T00:00:00.000Z',
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
});
afterEach(() => vi.restoreAllMocks());

describe('buildCloudSaver.upload', () => {
  it('syncs the album and pushes scans with the bearer token', async () => {
    localStorage.setItem(TOKEN_KEY, 'jwt-1');
    const saver = buildCloudSaver(BASE, fetchMock);

    const result = await saver.upload(session, [scan], ['ARG01', 'BRA07'], 'mauro');

    expect(result.ok).toBe(true);
    const urls = fetchMock.mock.calls.map((c) => c[0]);
    expect(urls).toContain(`${BASE}/api/v1/album_stickers/sync`);
    expect(urls).toContain(`${BASE}/api/v1/sessions`);
    for (const [, init] of fetchMock.mock.calls) {
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-1');
    }
  });

  it('sends the owned codes for the cloud username', async () => {
    setToken('jwt-1');
    const saver = buildCloudSaver(BASE, fetchMock);
    await saver.upload(session, [], ['ARG01'], 'mauro');

    const albumCall = fetchMock.mock.calls.find((c) => String(c[0]).endsWith('/album_stickers/sync'))!;
    const body = JSON.parse(albumCall[1].body as string);
    expect(body.userName).toBe('mauro');
    expect(body.codes).toEqual(['ARG01']);
  });

  it('reports ok:false when a request fails', async () => {
    setToken('jwt-1');
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 })); // album ok
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 })); // session fails
    const saver = buildCloudSaver(BASE, fetchMock);
    const result = await saver.upload(session, [scan], ['ARG01'], 'mauro');
    expect(result.ok).toBe(false);
  });

  it('exposes a cloud auth client', () => {
    const saver = buildCloudSaver(BASE, fetchMock);
    expect(typeof saver.auth.login).toBe('function');
    expect(typeof saver.auth.register).toBe('function');
  });
});
