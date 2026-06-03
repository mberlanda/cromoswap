import { describe, it, expect, vi } from 'vitest';
import { pushSession } from '../src/storage/sync-client';
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
    const result = await pushSession(session, [scan], 'http://api.test', fetchImpl);

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
    await pushSession(session, [scan], 'http://api.test', fetchImpl);
    const body = JSON.parse(fetchImpl.mock.calls[0][1]!.body as string);
    const serialized = JSON.stringify(body).toLowerCase();
    expect(serialized).not.toContain('image');
    expect(serialized).not.toContain('dataurl');
  });

  it('resolves ok:false on network failure (best-effort)', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });
    const result = await pushSession(session, [scan], 'http://api.test', fetchImpl);
    expect(result.ok).toBe(false);
  });

  it('resolves ok:false on non-2xx response', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 500 }));
    const result = await pushSession(session, [scan], 'http://api.test', fetchImpl);
    expect(result.ok).toBe(false);
  });
});
