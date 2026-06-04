import { ALBUM_ORDER, stickerNumbers } from '../domain/album-config';
import type { Clock } from '../storage/types';

export function toAlbumOwnedExport(
  userName: string,
  ownedCodes: Set<string>,
  now: Clock,
): string {
  const lines: string[] = [
    '# Cromoswap – My Album – Owned',
    `# user: ${userName}`,
    `# exported: ${now()}`,
    `# total: ${ownedCodes.size}`,
    '',
  ];

  for (const prefix of ALBUM_ORDER) {
    const owned = stickerNumbers(prefix)
      .map((n) => `${prefix}${n}`)
      .filter((code) => ownedCodes.has(code));
    if (owned.length > 0) lines.push(owned.join(' '));
  }

  return lines.join('\n');
}

export function toAlbumMissingExport(
  userName: string,
  ownedCodes: Set<string>,
  now: Clock,
): string {
  const totalMissing = ALBUM_ORDER.flatMap((p) =>
    stickerNumbers(p).map((n) => `${p}${n}`),
  ).filter((c) => !ownedCodes.has(c)).length;

  const lines: string[] = [
    '# Cromoswap – My Album – Missing',
    `# user: ${userName}`,
    `# exported: ${now()}`,
    `# missing: ${totalMissing}`,
    '',
  ];

  for (const prefix of ALBUM_ORDER) {
    const missing = stickerNumbers(prefix)
      .map((n) => `${prefix}${n}`)
      .filter((code) => !ownedCodes.has(code));
    if (missing.length > 0) lines.push(`${prefix}: ${missing.join(' ')}`);
  }

  return lines.join('\n');
}
