import type { DataPoint } from './stats-chart-utils';

export interface SeriesData {
  name: string;
  points: DataPoint[];
}

interface StatsChartProps {
  series: SeriesData[];
}

const SERIES_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function StatsChart({ series }: StatsChartProps) {
  if (series.length === 0) {
    return <p className="stats-chart-empty">No data to display.</p>;
  }

  const W = 320;
  const H = 160;
  const PAD = { top: 8, right: 8, bottom: 28, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const allDates = [...new Set(series.flatMap((s) => s.points.map((p) => p.date)))].sort();
  const maxVal = Math.max(...series.flatMap((s) => s.points.map((p) => p.cumulative)), 1);
  const dateIndex = new Map(allDates.map((d, i) => [d, i]));

  function xScale(date: string): number {
    const idx = dateIndex.get(date) ?? 0;
    if (allDates.length === 1) return PAD.left + chartW / 2;
    return PAD.left + (idx / (allDates.length - 1)) * chartW;
  }

  function yScale(val: number): number {
    return PAD.top + chartH - (val / maxVal) * chartH;
  }

  const tickStep = Math.max(1, Math.floor(allDates.length / 5));
  const xTicks = allDates.filter((_, i) => i % tickStep === 0 || i === allDates.length - 1);

  return (
    <div className="stats-chart">
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Cumulative owned stickers over time"
        role="img"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD.top + chartH * (1 - frac);
          return (
            <g key={frac}>
              <line
                x1={PAD.left} y1={y}
                x2={PAD.left + chartW} y2={y}
                stroke="var(--subtle)" strokeWidth="0.5"
              />
              <text x={PAD.left - 4} y={y + 4} fontSize="9" textAnchor="end" fill="var(--muted)">
                {Math.round(maxVal * frac)}
              </text>
            </g>
          );
        })}

        {xTicks.map((d) => (
          <text key={d} x={xScale(d)} y={H - 4} fontSize="8" textAnchor="middle" fill="var(--muted)">
            {d.slice(5)}
          </text>
        ))}

        {series.map((s, idx) => {
          const pts = s.points
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((p) => `${xScale(p.date)},${yScale(p.cumulative)}`)
            .join(' ');
          return (
            <polyline
              key={`${s.name}-${idx}`}
              data-series={`${s.name}-${idx}`}
              points={pts}
              fill="none"
              stroke={SERIES_COLORS[idx % SERIES_COLORS.length]}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      <div className="stats-chart-legend">
        {series.map((s, idx) => (
          <span key={s.name} className="stats-chart-legend-item">
            <span
              className="stats-chart-legend-dot"
              style={{ background: SERIES_COLORS[idx % SERIES_COLORS.length] }}
            />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
