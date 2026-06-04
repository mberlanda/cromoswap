import { describe, it, expect } from 'vitest';
import { toAlbumOwnedExport, toAlbumMissingExport } from '../src/export/album-export';

const now = () => '2026-06-04T12:00:00.000Z';

describe('toAlbumOwnedExport', () => {
  it('includes a header and groups owned codes by team', () => {
    const owned = new Set(['FWC00', 'FWC01', 'ARG07']);
    const text = toAlbumOwnedExport('Mauro', owned, now);
    expect(text).toContain('user: Mauro');
    expect(text).toContain('total: 3');
    expect(text).toContain('FWC00 FWC01');
    expect(text).toContain('ARG07');
  });

  it('omits teams with no owned stickers', () => {
    const owned = new Set(['ARG01']);
    const text = toAlbumOwnedExport('Mauro', owned, now);
    expect(text).not.toMatch(/^BRA/m);
    expect(text).not.toMatch(/^FWC/m);
  });

  it('handles an empty owned set', () => {
    const text = toAlbumOwnedExport('Mauro', new Set(), now);
    expect(text).toContain('total: 0');
  });
});

describe('toAlbumMissingExport', () => {
  it('includes a header and groups missing codes by team', () => {
    const owned = new Set(['FWC00', 'FWC01']);
    const text = toAlbumMissingExport('Mauro', owned, now);
    expect(text).toContain('user: Mauro');
    expect(text).toContain('FWC: FWC02');
    expect(text).not.toContain('FWC00');
    expect(text).not.toContain('FWC01');
  });

  it('omits teams that are fully owned', () => {
    const owned = new Set(
      Array.from({ length: 20 }, (_, i) => `ARG${(i + 1).toString().padStart(2, '0')}`),
    );
    const text = toAlbumMissingExport('Mauro', owned, now);
    expect(text).not.toMatch(/^ARG:/m);
  });

  it('reports the correct missing count (980 total − 2 owned = 978)', () => {
    const owned = new Set(['FWC00', 'ARG01']);
    const text = toAlbumMissingExport('Mauro', owned, now);
    expect(text).toContain('missing: 978');
  });

  it('reports 980 missing when nothing is owned', () => {
    const text = toAlbumMissingExport('Mauro', new Set(), now);
    expect(text).toContain('missing: 980');
  });
});
