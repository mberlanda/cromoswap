import { PREFIXES } from './prefixes';
import type { StickerCode } from './types';

/**
 * Validate a canonical `<PREFIX><NN>` code against the known prefix set and the
 * number range. FWC uses 0-19, other prefixes use 1-20. Returns the parsed StickerCode or null.
 */
export function validateCode(canonical: string): StickerCode | null {
  const match = canonical.match(/^([A-Z]{3})(\d{2})$/);
  if (!match) return null;
  const prefix = match[1];
  const number = parseInt(match[2], 10);
  if (!PREFIXES.has(prefix)) return null;
  const isFwc = prefix === 'FWC';
  if (isFwc && (number < 0 || number > 19)) return null;
  if (!isFwc && (number < 1 || number > 20)) return null;
  return { prefix, number, canonical };
}
