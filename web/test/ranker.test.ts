import { describe, it, expect } from 'vitest';
import { rankCandidates } from '../src/domain/ranker';

describe('rankCandidates', () => {
  it('keeps only valid codes, ordered by confidence desc', () => {
    const out = rankCandidates([
      { raw: 'ZZZ01', confidence: 0.9 },
      { raw: 'ARG 1', confidence: 0.4 },
      { raw: 'USA13', confidence: 0.8 },
    ]);
    expect(out.map((o) => o.code.canonical)).toEqual(['USA13', 'ARG01']);
    expect(out[0].confidence).toBe(0.8);
  });

  it('returns [] when none valid', () => {
    expect(rankCandidates([{ raw: 'ZZZ99', confidence: 1 }])).toEqual([]);
  });

  it('returns [] for empty input', () => {
    expect(rankCandidates([])).toEqual([]);
  });

  it('drops candidates that normalize but fail validation', () => {
    expect(rankCandidates([{ raw: 'ARG 99', confidence: 0.5 }])).toEqual([]);
  });
});
