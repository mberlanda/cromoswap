import { describe, it, expect } from 'vitest';
import { parseCandidates } from '../src/domain/parser';

describe('parseCandidates', () => {
  it('extracts code-like tokens from noisy multi-line text', () => {
    expect(parseCandidates('foo ARG 01\nbar USA13')).toEqual(['ARG 01', 'USA13']);
  });

  it('handles hyphenated and lowercase forms', () => {
    expect(parseCandidates('arg-01 noise')).toEqual(['arg-01']);
  });

  it('keeps OCR-confused code tokens for preset correction', () => {
    expect(parseCandidates('noise CR0 2O\nFWC I7\nJ0R8\nGHA I')).toEqual([
      'CR0 2O',
      'FWC I7',
      'J0R8',
      'GHA I',
    ]);
  });

  it('returns [] when nothing matches', () => {
    expect(parseCandidates('no codes here')).toEqual([]);
  });

  it('returns [] for empty input', () => {
    expect(parseCandidates('')).toEqual([]);
  });
});
