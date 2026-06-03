import { describe, it, expect } from 'vitest';
import { normalizeCode } from '../src/domain/normalizer';

describe('normalizeCode', () => {
  it.each([
    ['ARG 1', 'ARG01'],
    ['ARG 01', 'ARG01'],
    ['ARG-01', 'ARG01'],
    ['arg01', 'ARG01'],
    ['  usa13 ', 'USA13'],
    ['fwc7', 'FWC07'],
    ['ARG  -  9', 'ARG09'],
  ])('normalizes %s -> %s', (input, expected) => {
    expect(normalizeCode(input)).toBe(expected);
  });

  it('returns null when no code shape is present', () => {
    expect(normalizeCode('hello')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(normalizeCode('')).toBeNull();
  });
});
