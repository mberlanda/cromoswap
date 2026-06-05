import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiSessionRepo, ApiScanRepo, ApiAlbumRepo } from '../src/storage/api-repos';

const BASE = 'http://api.test';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ApiSessionRepo', () => {
  const repo = () => new ApiSessionRepo(BASE);

  it('create POSTs the userName, returns the session, and remembers its id locally', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 's1', userName: 'Mauro', createdAt: 'c', updatedAt: 'u' }, 201),
    );
    const session = await repo().create('Mauro');

    expect(session).toEqual({ id: 's1', userName: 'Mauro', createdAt: 'c', updatedAt: 'u' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/v1/sessions`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body).session.userName).toBe('Mauro');
    // The new id is persisted so list() can find it.
    expect(JSON.parse(localStorage.getItem('wc-session-ids')!)).toContain('s1');
  });

  it('create throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    await expect(repo().create('Mauro')).rejects.toThrow(/Failed to create session: 500/);
  });

  it('list returns [] without making a request when no local ids are stored', async () => {
    const result = await repo().list();
    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('list requests the stored ids and maps the results', async () => {
    localStorage.setItem('wc-session-ids', JSON.stringify(['s1', 's2']));
    fetchMock.mockResolvedValue(
      jsonResponse([
        { id: 's1', userName: 'A', createdAt: 'c', updatedAt: 'u' },
        { id: 's2', userName: 'B', createdAt: 'c', updatedAt: 'u' },
      ]),
    );
    const result = await repo().list();

    expect(result.map((s) => s.userName)).toEqual(['A', 'B']);
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/api/v1/sessions?ids[]=s1&ids[]=s2`);
  });

  it('list returns [] on a non-ok response', async () => {
    localStorage.setItem('wc-session-ids', JSON.stringify(['s1']));
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    expect(await repo().list()).toEqual([]);
  });

  it('get returns the mapped session on success and undefined on failure', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 's1', userName: 'Mauro', createdAt: 'c', updatedAt: 'u' }),
    );
    expect(await repo().get('s1')).toMatchObject({ id: 's1', userName: 'Mauro' });

    fetchMock.mockResolvedValueOnce(jsonResponse({}, 404));
    expect(await repo().get('missing')).toBeUndefined();
  });

  it('update PATCHes the patch and returns the mapped session', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 's1', userName: 'Renamed', createdAt: 'c', updatedAt: 'u' }),
    );
    const session = await repo().update('s1', { userName: 'Renamed' });

    expect(session.userName).toBe('Renamed');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/v1/sessions/s1`);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body).session.userName).toBe('Renamed');
  });

  it('update throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 422));
    await expect(repo().update('s1', { userName: 'x' })).rejects.toThrow(/Failed to update session: 422/);
  });
});

describe('ApiScanRepo', () => {
  const repo = () => new ApiScanRepo(BASE);
  const input = {
    sessionId: 's1',
    normalizedCode: 'ARG01',
    source: 'ocr' as const,
    confidence: 0.9,
    capturedAt: '2026-06-04T00:00:00.000Z',
  };

  it('add POSTs the scan fields and returns the mapped scan', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: 'sc1',
        sessionId: 's1',
        normalizedCode: 'ARG01',
        source: 'ocr',
        confidence: 0.9,
        capturedAt: input.capturedAt,
        createdAt: 'c',
        updatedAt: 'u',
      }, 201),
    );
    const scan = await repo().add(input);

    expect(scan).toMatchObject({ id: 'sc1', normalizedCode: 'ARG01' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/v1/scans`);
    expect(JSON.parse(init.body).normalizedCode).toBe('ARG01');
  });

  it('add throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    await expect(repo().add(input)).rejects.toThrow(/Failed to add scan: 500/);
  });

  it('listBySession maps results and falls back to capturedAt for timestamps', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        // No createdAt/updatedAt -> both fall back to capturedAt.
        { id: 'sc1', sessionId: 's1', normalizedCode: 'ARG01', source: 'ocr', confidence: 0.9, capturedAt: 'cap' },
      ]),
    );
    const [scan] = await repo().listBySession('s1');
    expect(scan.createdAt).toBe('cap');
    expect(scan.updatedAt).toBe('cap');
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/api/v1/sessions/s1/scans`);
  });

  it('listBySession returns [] on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    expect(await repo().listBySession('s1')).toEqual([]);
  });

  it('update PATCHes the normalizedCode and returns the mapped scan', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ id: 'sc1', sessionId: 's1', normalizedCode: 'BRA07', source: 'manual', confidence: 1, capturedAt: 'cap' }),
    );
    const scan = await repo().update('sc1', { normalizedCode: 'BRA07' });
    expect(scan.normalizedCode).toBe('BRA07');
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH');
  });

  it('update throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    await expect(repo().update('sc1', { normalizedCode: 'X' })).rejects.toThrow(/Failed to update scan: 500/);
  });

  it('delete issues a DELETE request', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await repo().delete('sc1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/v1/scans/sc1`);
    expect(init.method).toBe('DELETE');
  });
});

describe('ApiAlbumRepo', () => {
  const repo = () => new ApiAlbumRepo(BASE);

  it('listByUser maps album entries on success', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([{ id: 'a1', userName: 'Mauro', normalizedCode: 'ARG01', ownedAt: 'o' }]),
    );
    const entries = await repo().listByUser('Mauro');
    expect(entries).toEqual([{ id: 'a1', userName: 'Mauro', normalizedCode: 'ARG01', ownedAt: 'o' }]);
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/api/v1/album_stickers?user_name=Mauro`);
  });

  it('listByUser returns [] on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    expect(await repo().listByUser('Mauro')).toEqual([]);
  });

  it('toggle returns the action on success', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ action: 'added' }));
    expect(await repo().toggle('Mauro', 'ARG01')).toBe('added');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/api/v1/album_stickers/toggle`);
    expect(JSON.parse(init.body)).toEqual({ userName: 'Mauro', normalizedCode: 'ARG01' });
  });

  it('toggle throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));
    await expect(repo().toggle('Mauro', 'ARG01')).rejects.toThrow(/Failed to toggle sticker: 500/);
  });
});
