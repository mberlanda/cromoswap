import { describe, it, expect } from 'vitest';
import { toJsonExport } from '../src/export/json-export';
import { MemoryImageStore } from '../src/storage/memory-repos';
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

describe('toJsonExport', () => {
  it('embeds metadata, scans, counts, and image data URLs', async () => {
    const images = new MemoryImageStore();
    await images.put('scan-1', 'data:image/png;base64,AAAA');

    const out = await toJsonExport(session, [scan], images, () => '2026-06-04T12:00:00.000Z');

    expect(out.session).toEqual(session);
    expect(out.exportedAt).toBe('2026-06-04T12:00:00.000Z');
    expect(out.totalScans).toBe(1);
    expect(out.countsByCode).toEqual({ ARG01: 1 });
    expect(out.scans).toEqual([scan]);
    expect(out.images).toEqual({ 'scan-1': 'data:image/png;base64,AAAA' });
    // round-trips through JSON
    expect(JSON.parse(JSON.stringify(out))).toEqual(out);
  });

  it('omits images that are not stored', async () => {
    const images = new MemoryImageStore();
    const out = await toJsonExport(session, [scan], images, () => '2026-06-04T12:00:00.000Z');
    expect(out.images).toEqual({});
  });
});
