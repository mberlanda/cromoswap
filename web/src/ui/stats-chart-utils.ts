import type { AlbumEntry } from '../domain/types';

export interface DataPoint {
  date: string;
  cumulative: number;
}

export function buildCumulativeSeries(entries: AlbumEntry[]): DataPoint[] {
  const countByDay: Record<string, number> = {};
  for (const e of entries) {
    const day = e.ownedAt.slice(0, 10);
    countByDay[day] = (countByDay[day] ?? 0) + 1;
  }
  const sorted = Object.keys(countByDay).sort();
  let cumulative = 0;
  return sorted.map((date) => {
    cumulative += countByDay[date];
    return { date, cumulative };
  });
}