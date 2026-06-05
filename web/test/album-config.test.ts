import { describe, it, expect } from 'vitest';
import {
  stickerNumbers,
  ALBUM_ORDER,
  ALBUM_GROUPS,
  teamFullName,
  teamFlag,
  teamGroup,
} from '../src/domain/album-config';

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

  it('follows group order: Group A teams come before Group B teams', () => {
    const idxMex = ALBUM_ORDER.indexOf('MEX'); // Group A first team
    const idxCan = ALBUM_ORDER.indexOf('CAN'); // Group B first team
    expect(idxMex).toBeLessThan(idxCan);
  });
});

describe('ALBUM_GROUPS', () => {
  it('has 12 groups', () => {
    expect(ALBUM_GROUPS).toHaveLength(12);
  });

  it('each group has exactly 4 teams', () => {
    for (const g of ALBUM_GROUPS) {
      expect(g.prefixes).toHaveLength(4);
    }
  });

  it('groups are labelled A through L', () => {
    expect(ALBUM_GROUPS[0].letter).toBe('A');
    expect(ALBUM_GROUPS[11].letter).toBe('L');
  });
});

describe('teamFullName', () => {
  it('returns the full name for a known prefix', () => {
    expect(teamFullName('ARG')).toBe('Argentina');
    expect(teamFullName('FWC')).toBe('FIFA World Cup');
  });

  it('returns updated names for Czechia and Türkiye', () => {
    expect(teamFullName('CZE')).toBe('Czechia');
    expect(teamFullName('TUR')).toBe('Türkiye');
  });

  it('falls back to the prefix for an unknown code', () => {
    expect(teamFullName('ZZZ')).toBe('ZZZ');
  });
});

describe('teamFlag', () => {
  it('returns the flag emoji for a known prefix', () => {
    expect(teamFlag('ARG')).toBe('🇦🇷');
    expect(teamFlag('FWC')).toBe('🏆');
    expect(teamFlag('ENG')).toBe('🏴󠁧󠁢󠁥󠁮󠁧󠁿');
  });

  it('returns empty string for an unknown prefix', () => {
    expect(teamFlag('ZZZ')).toBe('');
  });
});

describe('teamGroup', () => {
  it('returns the group letter for a known team', () => {
    expect(teamGroup('MEX')).toBe('A');
    expect(teamGroup('ARG')).toBe('J');
    expect(teamGroup('ENG')).toBe('L');
  });

  it('returns null for FWC and unknown codes', () => {
    expect(teamGroup('FWC')).toBeNull();
    expect(teamGroup('ZZZ')).toBeNull();
  });
});
