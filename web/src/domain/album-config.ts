import TEAM_NAMES from '../assets/team-names.json';
import TEAM_FLAGS from '../assets/team-flags.json';

export const ALBUM_GROUPS: readonly { letter: string; prefixes: readonly string[] }[] = [
  { letter: 'A', prefixes: ['MEX', 'KOR', 'RSA', 'CZE'] },
  { letter: 'B', prefixes: ['CAN', 'SUI', 'QAT', 'BIH'] },
  { letter: 'C', prefixes: ['BRA', 'MAR', 'SCO', 'HAI'] },
  { letter: 'D', prefixes: ['USA', 'PAR', 'AUS', 'TUR'] },
  { letter: 'E', prefixes: ['GER', 'ECU', 'CIV', 'CUW'] },
  { letter: 'F', prefixes: ['NED', 'JPN', 'TUN', 'SWE'] },
  { letter: 'G', prefixes: ['BEL', 'IRN', 'EGY', 'NZL'] },
  { letter: 'H', prefixes: ['ESP', 'URU', 'KSA', 'CPV'] },
  { letter: 'I', prefixes: ['FRA', 'SEN', 'NOR', 'IRQ'] },
  { letter: 'J', prefixes: ['ARG', 'AUT', 'ALG', 'JOR'] },
  { letter: 'K', prefixes: ['POR', 'COL', 'COD', 'UZB'] },
  { letter: 'L', prefixes: ['ENG', 'CRO', 'GHA', 'PAN'] },
] as const;

export const ALBUM_ORDER: readonly string[] = [
  'FWC',
  ...ALBUM_GROUPS.flatMap((g) => g.prefixes),
];

export function teamFullName(prefix: string): string {
  return (TEAM_NAMES as Record<string, string>)[prefix] ?? prefix;
}

export function teamFlag(prefix: string): string {
  return (TEAM_FLAGS as Record<string, string>)[prefix] ?? '';
}

export function teamGroup(prefix: string): string | null {
  for (const group of ALBUM_GROUPS) {
    if ((group.prefixes as readonly string[]).includes(prefix)) return group.letter;
  }
  return null;
}

export function stickerNumbers(prefix: string): string[] {
  if (prefix === 'FWC') {
    return Array.from({ length: 20 }, (_, i) => i.toString().padStart(2, '0'));
  }
  return Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(2, '0'));
}
