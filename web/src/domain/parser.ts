import { PREFIXES } from './prefixes';

const CANDIDATE_RE = /\b[A-Z0-9]{3}\s*-?\s*[A-Z0-9]{1,2}\b/gi;
const DIGIT_LIKE_RE = /[0-9BDGILOQSTZ]/i;
const PREFIX_OCR_FIXES: Record<string, string> = {
  '0': 'O',
  '1': 'I',
  '2': 'Z',
  '5': 'S',
  '6': 'G',
  '8': 'B',
};

function compactCandidate(candidate: string): string {
  return candidate.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function hasDigitLikeNumber(candidate: string): boolean {
  const compact = compactCandidate(candidate);
  const number = compact.slice(3);
  return number.length > 0 && [...number].every((char) => DIGIT_LIKE_RE.test(char));
}

function hasKnownPrefix(candidate: string): boolean {
  const compact = compactCandidate(candidate);
  const prefix = [...compact.slice(0, 3)].map((char) => PREFIX_OCR_FIXES[char] ?? char).join('');
  return PREFIXES.has(prefix);
}

/**
 * Extract code-like substrings from raw (possibly noisy, multi-line) OCR text.
 * Does not normalize or validate — see normalizeOcrCode / validateCode.
 */
export function parseCandidates(rawText: string): string[] {
  return [...rawText.matchAll(CANDIDATE_RE)]
    .map((m) => m[0].trim())
    .filter(
      (candidate) => /\d/.test(candidate) || (hasKnownPrefix(candidate) && hasDigitLikeNumber(candidate)),
    );
}
