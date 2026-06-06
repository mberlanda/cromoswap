import type { Scan, Session } from '../domain/types';
import type { Clock } from '../storage/types';
import { countByCode } from '../domain/counts';

function groupByPrefix(codes: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const code of codes) {
    const prefix = code.slice(0, -2);
    const number = code.slice(-2);
    const list = map.get(prefix) ?? [];
    list.push(number);
    map.set(prefix, list);
  }
  return map;
}

export function toTextExport(session: Session, scans: Scan[], now: Clock): string {
  const counts = countByCode(scans);
  const countLines = Object.keys(counts)
    .sort()
    .map((code) => `${code}: ${counts[code]}`);

  const header = [
    `# Cromoswap - My Reps export`,
    `user: ${session.userName}`,
    `session: ${session.id}`,
    `exported: ${now()}`,
    `total scans: ${scans.length}`,
    `counts by code:`,
    ...countLines.map((line) => `  ${line}`),
    ``,
  ];

  const sortedCodes = scans.map((s) => s.normalizedCode).sort();
  const grouped = groupByPrefix(sortedCodes);
  const codeLines = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([prefix, numbers]) => `${prefix}: ${numbers.join(', ')}`);

  return [...header, ...codeLines].join('\n') + '\n';
}
