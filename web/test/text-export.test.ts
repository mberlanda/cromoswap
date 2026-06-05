import { describe, it, expect } from 'vitest';
import { toTextExport } from '../src/export/text-export';
import type { Scan, Session } from '../src/domain/types';

const session: Session = {
  id: 'sess-1',
  userName: 'Mauro',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

function scan(code: string): Scan {
  return {
    id: code,
    sessionId: 'sess-1',
    normalizedCode: code,
    source: 'ocr',
    confidence: 1,
    capturedAt: '2026-06-04T00:00:00.000Z',
    createdAt: '2026-06-04T00:00:00.000Z',
    updatedAt: '2026-06-04T00:00:00.000Z',
  };
}

describe('toTextExport', () => {
  it('includes a metadata header with counts', () => {
    const text = toTextExport(session, [scan('USA13'), scan('ARG01'), scan('ARG01')], () =>
      '2026-06-04T12:00:00.000Z',
    );
    expect(text).toContain('user: Mauro');
    expect(text).toContain('session: sess-1');
    expect(text).toContain('exported: 2026-06-04T12:00:00.000Z');
    expect(text).toContain('total scans: 3');
    expect(text).toContain('ARG01: 2');
    expect(text).toContain('USA13: 1');
  });

  it('groups codes by prefix with number-only format', () => {
    const text = toTextExport(session, [scan('USA13'), scan('ARG01'), scan('ARG01')], () =>
      '2026-06-04T12:00:00.000Z',
    );
    // Codes section: grouped, sorted by prefix then number
    expect(text).toContain('ARG: 01, 01');
    expect(text).toContain('USA: 13');
  });

  it('groups multiple codes within the same prefix', () => {
    const text = toTextExport(
      session,
      [scan('FWC03'), scan('FWC04'), scan('FWC05'), scan('FWC07'), scan('MEX02')],
      () => '2026-06-04T12:00:00.000Z',
    );
    expect(text).toContain('FWC: 03, 04, 05, 07');
    expect(text).toContain('MEX: 02');
  });

  it('handles an empty session', () => {
    const text = toTextExport(session, [], () => '2026-06-04T12:00:00.000Z');
    expect(text).toContain('total scans: 0');
  });
});
