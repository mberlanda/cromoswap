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
