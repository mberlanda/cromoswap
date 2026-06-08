import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsChart } from '../src/ui/StatsChart';
import { buildCumulativeSeries } from '../src/ui/stats-chart-utils';
import type { SeriesData } from '../src/ui/StatsChart';
import type { AlbumEntry } from '../src/domain/types';

const series: SeriesData[] = [
  {
    name: 'alice',
    points: [
      { date: '2025-01-01', cumulative: 5 },
      { date: '2025-01-02', cumulative: 12 },
      { date: '2025-01-03', cumulative: 20 },
    ],
  },
  {
    name: 'bob',
    points: [
      { date: '2025-01-01', cumulative: 3 },
      { date: '2025-01-02', cumulative: 7 },
    ],
  },
];

describe('StatsChart', () => {
  it('renders an SVG chart', () => {
    const { container } = render(<StatsChart series={series} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a polyline per series', () => {
    const { container } = render(<StatsChart series={series} />);
    const polylines = container.querySelectorAll('polyline[data-series]');
    expect(polylines.length).toBe(2);
  });

  it('renders series names in legend', () => {
    render(<StatsChart series={series} />);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('renders empty state when no series', () => {
    render(<StatsChart series={[]} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });
});

describe('buildCumulativeSeries', () => {
  it('accumulates by day', () => {
    const entries: AlbumEntry[] = [
      { id: '1', userName: 'alice', normalizedCode: 'FWC1', ownedAt: '2025-01-01T10:00:00Z' },
      { id: '2', userName: 'alice', normalizedCode: 'FWC2', ownedAt: '2025-01-01T11:00:00Z' },
      { id: '3', userName: 'alice', normalizedCode: 'FWC3', ownedAt: '2025-01-02T09:00:00Z' },
    ];
    const result = buildCumulativeSeries(entries);
    expect(result).toEqual([
      { date: '2025-01-01', cumulative: 2 },
      { date: '2025-01-02', cumulative: 3 },
    ]);
  });

  it('returns empty array for empty entries', () => {
    expect(buildCumulativeSeries([])).toEqual([]);
  });
});
