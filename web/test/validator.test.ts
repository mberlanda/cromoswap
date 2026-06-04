import { describe, it, expect } from 'vitest';
import { validateCode } from '../src/domain/validator';

describe('validateCode', () => {
  it('accepts a known prefix with number 01-20', () => {
    expect(validateCode('ARG01')).toEqual({ prefix: 'ARG', number: 1, canonical: 'ARG01' });
    expect(validateCode('ARG20')).toEqual({ prefix: 'ARG', number: 20, canonical: 'ARG20' });
  });

  it('accepts FWC00 as the lowest valid FWC sticker', () => {
    expect(validateCode('FWC00')).toEqual({ prefix: 'FWC', number: 0, canonical: 'FWC00' });
  });

  it('accepts FWC19 as the highest valid FWC sticker', () => {
    expect(validateCode('FWC19')).toEqual({ prefix: 'FWC', number: 19, canonical: 'FWC19' });
  });

  it('rejects FWC20 as above the FWC range', () => {
    expect(validateCode('FWC20')).toBeNull();
  });

  it('rejects unknown prefix', () => {
    expect(validateCode('ZZZ01')).toBeNull();
  });

  it('rejects ARG00 as below the non-FWC range', () => {
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
