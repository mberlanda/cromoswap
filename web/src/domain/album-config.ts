import TEAM_NAMES from '../assets/team-names.json';

export const ALBUM_ORDER: readonly string[] = Object.keys(TEAM_NAMES);

export function teamFullName(prefix: string): string {
  return (TEAM_NAMES as Record<string, string>)[prefix] ?? prefix;
}

export function stickerNumbers(prefix: string): string[] {
  if (prefix === 'FWC') {
    return Array.from({ length: 20 }, (_, i) => i.toString().padStart(2, '0'));
  }
  return Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(2, '0'));
}
