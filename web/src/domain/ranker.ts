import type { Candidate, RankedCode } from './types';
import { normalizeCode } from './normalizer';
import { validateCode } from './validator';

/**
 * Normalize and validate each candidate, drop invalid ones, and sort the
 * surviving valid codes by confidence descending.
 */
export function rankCandidates(candidates: Candidate[]): RankedCode[] {
  return candidates
    .map((candidate): RankedCode | null => {
      const canonical = normalizeCode(candidate.raw);
      if (!canonical) return null;
      const code = validateCode(canonical);
      if (!code) return null;
      return { code, confidence: candidate.confidence };
    })
    .filter((ranked): ranked is RankedCode => ranked !== null)
    .sort((a, b) => b.confidence - a.confidence);
}
