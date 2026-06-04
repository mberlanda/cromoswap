import { PREFIXES } from './prefixes';
import type { StickerCode } from './types';

/**
 * Validate a canonical `<PREFIX><NN>` code against the known prefix set and the
 * number range 01-20. Returns the parsed StickerCode or null.
 */
export function validateCode(canonical: string): StickerCode | null {
  const match = canonical.match(/^([A-Z]{3})(\d{2})$/);
  if (!match) return null;
  const prefix = match[1];
  const number = parseInt(match[2], 10);
  if (!PREFIXES.has(prefix)) return null;
  if (number < 1 || number > 20) return null;
  return { prefix, number, canonical };
}
