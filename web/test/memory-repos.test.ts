import { describe, it, expect, beforeEach } from 'vitest';
import {
  MemorySessionRepo,
  MemoryScanRepo,
  MemoryImageStore,
} from '../src/storage/memory-repos';

let seq: number;
const ids = () => `id-${++seq}`;
const clock = () => '2026-06-04T00:00:00.000Z';

beforeEach(() => {
  seq = 0;
});

describe('MemorySessionRepo', () => {
  it('creates, gets, lists, and updates sessions', async () => {
    const repo = new MemorySessionRepo(ids, clock);
    const created = await repo.create('Mauro');
    expect(created).toMatchObject({ id: 'id-1', userName: 'Mauro' });
    expect(await repo.get('id-1')).toEqual(created);
    expect(await repo.list()).toEqual([created]);

    const updated = await repo.update('id-1', { userName: 'Mauro B' });
    expect(updated.userName).toBe('Mauro B');
  });

  it('returns undefined for a missing session', async () => {
    const repo = new MemorySessionRepo(ids, clock);
    expect(await repo.get('nope')).toBeUndefined();
  });
});

describe('MemoryScanRepo', () => {
  it('adds, lists by session, updates, and deletes scans', async () => {
    const repo = new MemoryScanRepo(ids, clock);
    const scan = await repo.add({
      sessionId: 's1',
      normalizedCode: 'ARG01',
      source: 'ocr',
      confidence: 0.9,
      capturedAt: clock(),
    });
    expect(scan).toMatchObject({ id: 'id-1', sessionId: 's1', normalizedCode: 'ARG01' });
    await repo.add({
      sessionId: 's2',
      normalizedCode: 'USA13',
      source: 'manual',
      confidence: 1,
      capturedAt: clock(),
    });

    expect(await repo.listBySession('s1')).toHaveLength(1);

    const updated = await repo.update('id-1', { normalizedCode: 'ARG02' });
    expect(updated.normalizedCode).toBe('ARG02');

    await repo.delete('id-1');
    expect(await repo.listBySession('s1')).toEqual([]);
  });
});

describe('MemoryImageStore', () => {
  it('puts, gets, and deletes images', async () => {
    const store = new MemoryImageStore();
    await store.put('scan-1', 'data:image/png;base64,AAAA');
    expect(await store.get('scan-1')).toBe('data:image/png;base64,AAAA');
    await store.delete('scan-1');
    expect(await store.get('scan-1')).toBeUndefined();
  });
});
