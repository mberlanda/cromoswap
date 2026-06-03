const CANDIDATE_RE = /[A-Z]{3}\s*-?\s*\d{1,2}/gi;

/**
 * Extract code-like substrings from raw (possibly noisy, multi-line) OCR text.
 * Does not normalize or validate — see normalizeCode / validateCode.
 */
export function parseCandidates(rawText: string): string[] {
  return [...rawText.matchAll(CANDIDATE_RE)].map((m) => m[0].trim());
}
