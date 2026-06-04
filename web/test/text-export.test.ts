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
  it('includes a metadata header and sorted codes', () => {
    const text = toTextExport(session, [scan('USA13'), scan('ARG01'), scan('ARG01')], () =>
      '2026-06-04T12:00:00.000Z',
    );
    expect(text).toContain('user: Mauro');
    expect(text).toContain('session: sess-1');
    expect(text).toContain('exported: 2026-06-04T12:00:00.000Z');
    expect(text).toContain('total scans: 3');
    expect(text).toContain('ARG01: 2');
    expect(text).toContain('USA13: 1');
    // codes listed one per line, sorted, after the header
    const lines = text.trimEnd().split('\n');
    expect(lines.slice(-3)).toEqual(['ARG01', 'ARG01', 'USA13']);
  });

  it('handles an empty session', () => {
    const text = toTextExport(session, [], () => '2026-06-04T12:00:00.000Z');
    expect(text).toContain('total scans: 0');
  });
});
