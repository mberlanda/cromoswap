import { ALBUM_ORDER, stickerNumbers } from '../domain/album-config';
import type { JsonExport } from '../export/json-export';

export type ImportKind = 'owned' | 'missing' | 'duplicate';

/** Every valid sticker code in the album (FWC + all teams). */
export function allCodes(): string[] {
  return ALBUM_ORDER.flatMap((prefix) =>
    stickerNumbers(prefix).map((n) => `${prefix}${n}`),
  );
}

/**
 * Extract valid sticker codes from free-form text, tolerating most layouts:
 * one per line, comma/space separated (`ARG01 BRA05`), spaced or dashed
 * (`ARG 1`, `arg-01`), and grouped (`BRA: 01, 02, 05`). Only codes that are
 * real album stickers are kept; everything else is ignored.
 */
export function parseFlexibleCodes(content: string): string[] {
  const valid = new Set(allCodes());
  const found = new Set<string>();
  const upper = content.toUpperCase();

  // Grouped "PREFIX: nn, nn" — one prefix, many numbers.
  for (const line of upper.split('\n')) {
    const match = line.match(/^\s*([A-Z]{3})\s*:\s*(.+)$/);
    if (!match) continue;
    for (const token of match[2].split(/[^0-9]+/)) {
      if (token === '') continue;
      const code = `${match[1]}${token.padStart(2, '0')}`;
      if (valid.has(code)) found.add(code);
    }
  }

  // Standalone full codes anywhere in the text.
  for (const match of upper.matchAll(/([A-Z]{3})\s*-?\s*(\d{1,2})/g)) {
    const code = `${match[1]}${match[2].padStart(2, '0')}`;
    if (valid.has(code)) found.add(code);
  }

  return [...found];
}

/** Guess the kind of a text export from its header, or null if unrecognized. */
export function detectTextKind(content: string): ImportKind | null {
  if (/album/i.test(content)) {
    if (/owned/i.test(content)) return 'owned';
    if (/missing/i.test(content)) return 'missing';
  }
  if (/sticker scanner export/i.test(content) || /my reps/i.test(content) || /counts by code/i.test(content)) {
    return 'duplicate';
  }
  return null;
}

/** Read the `user:` (or `# user:`) header, defaulting to "Imported". */
export function parseUserName(content: string): string {
  const match = content.match(/^#?\s*user:\s*(.+)$/im);
  return match ? match[1].trim() : 'Imported';
}

/** Expand grouped `PREFIX: nn, nn` lines into full codes. */
export function parseGroupedCodes(content: string): string[] {
  const codes: string[] = [];
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z]{3}):\s*(.+)$/);
    if (!match) continue;
    const [, prefix, rest] = match;
    for (const token of rest.split(',')) {
      const n = token.trim();
      if (/^\d{2}$/.test(n)) codes.push(`${prefix}${n}`);
    }
  }
  return codes;
}

/** Read `CODE: count` lines (the counts-by-code section of a reps export). */
export function parseDuplicateCounts(content: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([A-Z]{3}\d{2}):\s*(\d+)\s*$/);
    if (match) counts[match[1]] = Number(match[2]);
  }
  return counts;
}

/** Owned set implied by a kind: the listed codes (owned) or their complement (missing). */
export function resolveOwnedCodes(
  kind: 'owned' | 'missing',
  listedCodes: string[],
): string[] {
  if (kind === 'owned') return listedCodes;
  const listed = new Set(listedCodes);
  return allCodes().filter((code) => !listed.has(code));
}

export interface TextImport {
  kind: ImportKind;
  userName: string;
  /** For owned/missing: the codes to mark owned. */
  ownedCodes?: string[];
  /** For duplicate: copy counts per code. */
  counts?: Record<string, number>;
}

/**
 * Build a normalized text import. `kindOverride` is used when the file has no
 * recognizable header and the user picked the kind explicitly.
 */
export function buildTextImport(content: string, kindOverride?: ImportKind): TextImport {
  const kind = kindOverride ?? detectTextKind(content);
  if (!kind) throw new Error('Could not determine import kind');
  const userName = parseUserName(content);
  if (kind === 'duplicate') {
    return { kind, userName, counts: parseDuplicateCounts(content) };
  }
  return { kind, userName, ownedCodes: resolveOwnedCodes(kind, parseGroupedCodes(content)) };
}

export interface JsonImport {
  userName: string;
  session: JsonExport['session'];
  scans: JsonExport['scans'];
  images: JsonExport['images'];
  albumOwnedCodes: string[];
}

/** Parse and validate a JSON session export. Throws on malformed input. */
export function parseJsonImport(content: string): JsonImport {
  const data = JSON.parse(content) as Partial<JsonExport>;
  if (!data || typeof data !== 'object' || !data.session || !Array.isArray(data.scans)) {
    throw new Error('Not a valid session export');
  }
  return {
    userName: data.session.userName,
    session: data.session,
    scans: data.scans,
    images: data.images ?? {},
    albumOwnedCodes: data.albumOwnedCodes ?? [],
  };
}
