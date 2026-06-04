import { describe, it, expect } from 'vitest';
import { stickerNumbers, ALBUM_ORDER, teamFullName } from '../src/domain/album-config';

describe('stickerNumbers', () => {
  it('returns 00-19 for FWC', () => {
    const nums = stickerNumbers('FWC');
    expect(nums).toHaveLength(20);
    expect(nums[0]).toBe('00');
    expect(nums[19]).toBe('19');
  });

  it('returns 01-20 for all other prefixes', () => {
    const nums = stickerNumbers('ARG');
    expect(nums).toHaveLength(20);
    expect(nums[0]).toBe('01');
    expect(nums[19]).toBe('20');
  });
});

describe('ALBUM_ORDER', () => {
  it('has FWC as the first entry', () => {
    expect(ALBUM_ORDER[0]).toBe('FWC');
  });

  it('contains 49 entries (48 teams + FWC)', () => {
    expect(ALBUM_ORDER).toHaveLength(49);
  });
});

describe('teamFullName', () => {
  it('returns the full name for a known prefix', () => {
    expect(teamFullName('ARG')).toBe('Argentina');
    expect(teamFullName('FWC')).toBe('FIFA World Cup');
  });

  it('falls back to the prefix for an unknown code', () => {
    expect(teamFullName('ZZZ')).toBe('ZZZ');
  });
});
