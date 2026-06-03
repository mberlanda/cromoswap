import type { Scan } from './types';

/** Map each normalized code to how many scans carry it (duplicate counts). */
export function countByCode(scans: Scan[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const scan of scans) {
    counts[scan.normalizedCode] = (counts[scan.normalizedCode] ?? 0) + 1;
  }
  return counts;
}
