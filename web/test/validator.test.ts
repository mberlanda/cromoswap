import { describe, it, expect } from 'vitest';
import { validateCode } from '../src/domain/validator';

describe('validateCode', () => {
  it('accepts a known prefix with number 01-20', () => {
    expect(validateCode('ARG01')).toEqual({ prefix: 'ARG', number: 1, canonical: 'ARG01' });
    expect(validateCode('FWC20')).toEqual({ prefix: 'FWC', number: 20, canonical: 'FWC20' });
  });

  it('rejects unknown prefix', () => {
    expect(validateCode('ZZZ01')).toBeNull();
  });

  it('rejects number below range', () => {
    expect(validateCode('ARG00')).toBeNull();
  });

  it('rejects number above range', () => {
    expect(validateCode('ARG21')).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(validateCode('AR1')).toBeNull();
    expect(validateCode('ARG1')).toBeNull();
    expect(validateCode('arg01')).toBeNull();
  });
});
