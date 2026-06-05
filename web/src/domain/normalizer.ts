import { PREFIXES } from './prefixes';

/**
 * Normalize a tolerant code form to canonical `<PREFIX><NN>`.
 * Accepts forms like `ARG 1`, `ARG-01`, `arg01`, `fwc7`.
 * Returns null when no code shape is found.
 */
export function normalizeCode(input: string): string | null {
  const match = input.toUpperCase().match(/([A-Z]{3})\s*-?\s*(\d{1,2})/);
  if (!match) return null;
  const number = parseInt(match[2], 10);
  return `${match[1]}${String(number).padStart(2, '0')}`;
}

const PREFIX_OCR_FIXES: Record<string, string> = {
  '0': 'O',
  '1': 'I',
  '2': 'Z',
  '5': 'S',
  '6': 'G',
  '8': 'B',
};

const NUMBER_OCR_FIXES: Record<string, string> = {
  B: '8',
  D: '0',
  G: '6',
  I: '1',
  L: '1',
  O: '0',
  Q: '0',
  S: '5',
  T: '1',
  Z: '2',
};

function replaceByMap(value: string, replacements: Record<string, string>): string {
  return [...value].map((char) => replacements[char] ?? char).join('');
}

function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) distance += 1;
  }
  return distance;
}

function nearestKnownPrefix(prefix: string): string | null {
  let nearest: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  let ties = 0;

  for (const known of PREFIXES) {
    const distance = hammingDistance(prefix, known);
    if (distance < bestDistance) {
      nearest = known;
      bestDistance = distance;
      ties = 1;
    } else if (distance === bestDistance) {
      ties += 1;
    }
  }

  return bestDistance <= 1 && ties === 1 ? nearest : null;
}

/**
 * Normalize OCR output using the known album preset. This is intentionally more
 * tolerant than manual normalization: it fixes position-specific OCR confusions
 * and allows one unambiguous prefix character to snap to the known prefix list.
 */
export function normalizeOcrCode(input: string): string | null {
  const match = input.toUpperCase().match(/([A-Z0-9]{3})\s*-?\s*([A-Z0-9]{1,2})/);
  if (!match) return null;

  const prefixCandidate = replaceByMap(match[1], PREFIX_OCR_FIXES);
  const prefix = PREFIXES.has(prefixCandidate)
    ? prefixCandidate
    : nearestKnownPrefix(prefixCandidate);
  if (!prefix) return null;

  const numberCandidate = replaceByMap(match[2], NUMBER_OCR_FIXES);
  if (!/^\d{1,2}$/.test(numberCandidate)) return null;
  const number = parseInt(numberCandidate, 10);
  return `${prefix}${String(number).padStart(2, '0')}`;
}
