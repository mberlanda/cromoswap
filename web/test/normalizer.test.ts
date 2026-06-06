import { describe, it, expect } from 'vitest';
import { normalizeCode, normalizeOcrCode } from '../src/domain/normalizer';

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

describe('normalizeOcrCode', () => {
  it('accepts an exact code', () => {
    expect(normalizeOcrCode('ARG01')).toBe('ARG01');
  });

  it('fixes a position-specific digit→letter confusion in the prefix', () => {
    // 8 -> B snaps "8RA" to the known prefix "BRA".
    expect(normalizeOcrCode('8RA05')).toBe('BRA05');
  });

  it('fixes a letter→digit confusion in the number', () => {
    // O -> 0 in the number position.
    expect(normalizeOcrCode('ARGO')).toBe('ARG00');
  });

  it('returns null when no code shape is present', () => {
    expect(normalizeOcrCode('hi')).toBeNull();
  });

  it('returns null when the prefix is too far from any known prefix', () => {
    expect(normalizeOcrCode('QQQ05')).toBeNull();
  });

  it('returns null when the number cannot be resolved to digits', () => {
    expect(normalizeOcrCode('ARGXY')).toBeNull();
  });
});
