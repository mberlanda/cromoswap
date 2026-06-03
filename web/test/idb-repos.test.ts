import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { openStickerDb } from '../src/storage/db';
import { IdbSessionRepo, IdbScanRepo, IdbImageStore } from '../src/storage/idb-repos';

let seq: number;
const ids = () => `id-${++seq}`;
const clock = () => '2026-06-04T00:00:00.000Z';

beforeEach(() => {
  seq = 0;
  // Fresh in-memory IndexedDB per test.
  globalThis.indexedDB = new IDBFactory();
});

describe('IndexedDB repos', () => {
  it('persists a session and scans, and reads them back', async () => {
    const db = await openStickerDb();
    const sessions = new IdbSessionRepo(db, ids, clock);
    const scans = new IdbScanRepo(db, ids, clock);

    const session = await sessions.create('Mauro');
    await scans.add({
      sessionId: session.id,
      normalizedCode: 'ARG01',
      source: 'ocr',
      confidence: 0.9,
      capturedAt: clock(),
    });

    expect(await sessions.get(session.id)).toMatchObject({ userName: 'Mauro' });
    expect(await scans.listBySession(session.id)).toHaveLength(1);
  });

  it('survives a database re-open (reload)', async () => {
    const db1 = await openStickerDb();
    const sessions1 = new IdbSessionRepo(db1, ids, clock);
    const session = await sessions1.create('Mauro');
    db1.close();

    const db2 = await openStickerDb();
    const sessions2 = new IdbSessionRepo(db2, ids, clock);
    expect(await sessions2.get(session.id)).toMatchObject({ userName: 'Mauro' });
  });

  it('updates and deletes scans', async () => {
    const db = await openStickerDb();
    const scans = new IdbScanRepo(db, ids, clock);
    const scan = await scans.add({
      sessionId: 's1',
      normalizedCode: 'ARG01',
      source: 'manual',
      confidence: 1,
      capturedAt: clock(),
    });

    const updated = await scans.update(scan.id, { normalizedCode: 'ARG02' });
    expect(updated.normalizedCode).toBe('ARG02');

    await scans.delete(scan.id);
    expect(await scans.listBySession('s1')).toEqual([]);
  });

  it('stores and removes images', async () => {
    const db = await openStickerDb();
    const images = new IdbImageStore(db);
    await images.put('scan-1', 'data:image/png;base64,AAAA');
    expect(await images.get('scan-1')).toBe('data:image/png;base64,AAAA');
    await images.delete('scan-1');
    expect(await images.get('scan-1')).toBeUndefined();
  });
});
