import { describe, it, expect } from 'vitest';
import {
  detectTextKind,
  parseUserName,
  parseGroupedCodes,
  parseDuplicateCounts,
  resolveOwnedCodes,
  buildTextImport,
  parseJsonImport,
} from '../src/import/parse-import';

const ownedExport = [
  '# Cromoswap – My Album – Owned',
  '# user: Mauro',
  '# exported: 2026-06-05',
  '# total: 3',
  '',
  'FWC: 00, 01',
  'BRA: 05',
].join('\n');

const missingExport = [
  '# Cromoswap – My Album – Missing',
  '# user: Luca',
  '',
  'BRA: 03, 04',
].join('\n');

const repsExport = [
  '# WC 2026 Sticker Scanner export',
  'user: Ana',
  'session: s1',
  'exported: 2026-06-05',
  'total scans: 3',
  'counts by code:',
  '  ARG01: 2',
  '  USA13: 1',
  '',
  'ARG: 01, 01',
  'USA: 13',
].join('\n');

describe('detectTextKind', () => {
  it('recognizes owned, missing, and duplicate headers', () => {
    expect(detectTextKind(ownedExport)).toBe('owned');
    expect(detectTextKind(missingExport)).toBe('missing');
    expect(detectTextKind(repsExport)).toBe('duplicate');
  });

  it('returns null for an unrecognized / header-less file', () => {
    expect(detectTextKind('BRA: 01, 02\nARG: 05')).toBeNull();
  });
});

describe('parseUserName', () => {
  it('reads the user from both # and bare headers', () => {
    expect(parseUserName(ownedExport)).toBe('Mauro');
    expect(parseUserName(repsExport)).toBe('Ana');
  });

  it('falls back to Imported when no user header is present', () => {
    expect(parseUserName('BRA: 01')).toBe('Imported');
  });
});

describe('parseGroupedCodes', () => {
  it('expands PREFIX: nn, nn lines into full codes', () => {
    expect(parseGroupedCodes(ownedExport).sort()).toEqual(['BRA05', 'FWC00', 'FWC01']);
  });

  it('ignores headers and indented count lines (keeps grouped occurrences)', () => {
    // The grouped reps line is `ARG: 01, 01`, so ARG01 appears twice; the
    // indented `  ARG01: 2` count line must NOT be expanded here.
    expect(parseGroupedCodes(repsExport).sort()).toEqual(['ARG01', 'ARG01', 'USA13']);
  });
});

describe('parseDuplicateCounts', () => {
  it('reads CODE: count lines from the counts-by-code section', () => {
    expect(parseDuplicateCounts(repsExport)).toEqual({ ARG01: 2, USA13: 1 });
  });
});

describe('resolveOwnedCodes', () => {
  it('returns the listed codes for owned', () => {
    expect(resolveOwnedCodes('owned', ['BRA05'])).toEqual(['BRA05']);
  });

  it('returns the complement of the listed codes for missing', () => {
    const listed = ['BRA03'];
    const owned = resolveOwnedCodes('missing', listed);
    expect(owned).not.toContain('BRA03');
    expect(owned).toContain('BRA04');
    // 980 total stickers minus the one missing.
    expect(owned).toHaveLength(979);
  });
});

describe('buildTextImport', () => {
  it('builds an owned import from a detected file', () => {
    const result = buildTextImport(ownedExport);
    expect(result).toMatchObject({ kind: 'owned', userName: 'Mauro' });
    expect(result.ownedCodes!.sort()).toEqual(['BRA05', 'FWC00', 'FWC01']);
  });

  it('builds a duplicate import with counts', () => {
    const result = buildTextImport(repsExport);
    expect(result).toMatchObject({ kind: 'duplicate', userName: 'Ana' });
    expect(result.counts).toEqual({ ARG01: 2, USA13: 1 });
  });

  it('honors an explicit kind override for header-less files', () => {
    const result = buildTextImport('BRA: 03', 'missing');
    expect(result.kind).toBe('missing');
    expect(result.ownedCodes!).not.toContain('BRA03');
    expect(result.ownedCodes!).toContain('BRA04');
  });
});

describe('parseJsonImport', () => {
  it('parses a session export with scans and album codes', () => {
    const json = JSON.stringify({
      session: { id: 's1', userName: 'Mauro', createdAt: 'c', updatedAt: 'u' },
      scans: [
        { id: 'sc1', sessionId: 's1', normalizedCode: 'ARG01', source: 'ocr', confidence: 1, capturedAt: 'cap', createdAt: 'c', updatedAt: 'u' },
      ],
      images: { sc1: 'data:image/png;base64,AAAA' },
      albumOwnedCodes: ['BRA05'],
    });
    const result = parseJsonImport(json);
    expect(result.userName).toBe('Mauro');
    expect(result.scans).toHaveLength(1);
    expect(result.images.sc1).toContain('base64');
    expect(result.albumOwnedCodes).toEqual(['BRA05']);
  });

  it('throws on malformed JSON', () => {
    expect(() => parseJsonImport('not json')).toThrow();
  });

  it('throws when the shape is not a session export', () => {
    expect(() => parseJsonImport('{"foo":1}')).toThrow(/session export/i);
  });
});
