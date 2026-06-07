import { describe, it, expect, vi } from 'vitest';
import { pushSession, syncAlbumStickers, fetchLeaderboard } from '../src/storage/sync-client';
import type { Scan, Session } from '../src/domain/types';

const session: Session = {
  id: 'sess-1',
  userName: 'Mauro',
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

describe('pushSession', () => {
  it('POSTs codes + metadata and returns ok on success', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 201 }));
    const result = await pushSession(session, [scan], 'http://api.test', null, fetchImpl);

    expect(result.ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('http://api.test/api/v1/sessions');
    expect(init?.method).toBe('POST');
    const body = JSON.parse(init!.body as string);
    expect(body.session.userName).toBe('Mauro');
    expect(body.scans[0].normalizedCode).toBe('ARG01');
  });

  it('never sends image fields', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 201 }));
    await pushSession(session, [scan], 'http://api.test', null, fetchImpl);
    const body = JSON.parse(fetchImpl.mock.calls[0][1]!.body as string);
    const serialized = JSON.stringify(body).toLowerCase();
    expect(serialized).not.toContain('image');
    expect(serialized).not.toContain('dataurl');
  });

  it('resolves ok:false on network failure (best-effort)', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });
    const result = await pushSession(session, [scan], 'http://api.test', null, fetchImpl);
    expect(result.ok).toBe(false);
  });

  it('resolves ok:false on non-2xx response', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 500 }));
    const result = await pushSession(session, [scan], 'http://api.test', null, fetchImpl);
    expect(result.ok).toBe(false);
  });
});

describe('syncAlbumStickers', () => {
  it('POSTs userName and codes to the album sync endpoint', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true, owned: 2 }), { status: 200 }));
    const result = await syncAlbumStickers('Mauro', ['ARG01', 'BRA07'], 'http://api.test', null, fetchImpl);

    expect(result.ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('http://api.test/api/v1/album_stickers/sync');
    const body = JSON.parse(init!.body as string);
    expect(body.userName).toBe('Mauro');
    expect(body.codes).toEqual(['ARG01', 'BRA07']);
  });

  it('resolves ok:false on network failure', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('down'); });
    const result = await syncAlbumStickers('Mauro', [], 'http://api.test', null, fetchImpl);
    expect(result.ok).toBe(false);
  });

  it('sends the bearer token when one is provided', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true, owned: 0 }), { status: 200 }));
    await syncAlbumStickers('Mauro', ['ARG01'], 'http://api.test', 'jwt-9', fetchImpl);
    const init = fetchImpl.mock.calls[0][1]!;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-9');
  });
});

describe('fetchLeaderboard', () => {
  it('returns parsed leaderboard entries on success', async () => {
    const entries = [{ userName: 'Mauro', owned: 45, missing: 935 }];
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(entries), { status: 200 }));
    const result = await fetchLeaderboard('http://api.test', fetchImpl);
    expect(result).toEqual(entries);
  });

  it('returns empty array on error', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('down'); });
    const result = await fetchLeaderboard('http://api.test', fetchImpl);
    expect(result).toEqual([]);
  });

  it('returns empty array on non-2xx response', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 500 }));
    const result = await fetchLeaderboard('http://api.test', fetchImpl);
    expect(result).toEqual([]);
  });
});
