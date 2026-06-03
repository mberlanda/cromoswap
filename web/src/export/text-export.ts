import type { Scan, Session } from '../domain/types';
import type { Clock } from '../storage/types';
import { countByCode } from '../domain/counts';

/**
 * Render a plain-text export: a metadata header followed by one normalized code
 * per line, sorted. `now` is injected for deterministic output.
 */
export function toTextExport(session: Session, scans: Scan[], now: Clock): string {
  const counts = countByCode(scans);
  const countLines = Object.keys(counts)
    .sort()
    .map((code) => `${code}: ${counts[code]}`);
  const codes = scans.map((s) => s.normalizedCode).sort();

  const header = [
    `# WC 2026 Sticker Scanner export`,
    `user: ${session.userName}`,
    `session: ${session.id}`,
    `exported: ${now()}`,
    `total scans: ${scans.length}`,
    `counts by code:`,
    ...countLines.map((line) => `  ${line}`),
    ``,
  ];

  return [...header, ...codes].join('\n') + '\n';
}
