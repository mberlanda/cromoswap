import { describe, it, expect } from 'vitest';
import { countByCode } from '../src/domain/counts';
import type { Scan } from '../src/domain/types';

function scan(code: string): Scan {
  return {
    id: code,
    sessionId: 's1',
    normalizedCode: code,
    source: 'ocr',
    confidence: 1,
    capturedAt: '2026-06-04T00:00:00.000Z',
    createdAt: '2026-06-04T00:00:00.000Z',
    updatedAt: '2026-06-04T00:00:00.000Z',
  };
}

describe('countByCode', () => {
  it('counts duplicates by normalized code', () => {
    const counts = countByCode([scan('ARG01'), scan('ARG01'), scan('USA13')]);
    expect(counts).toEqual({ ARG01: 2, USA13: 1 });
  });

  it('returns an empty object for no scans', () => {
    expect(countByCode([])).toEqual({});
  });
});
