import type { Session } from '../domain/types';
import { SessionGate } from './SessionGate';
import { TabBar } from './TabBar';
import { RepsViewSwitch } from './RepsViewSwitch';
import { StatsChart, type SeriesData } from './StatsChart';

const MOCK_SESSIONS: Session[] = [
  {
    id: 'visual-1',
    userName: 'Mauro',
    createdAt: '2026-06-09T08:00:00.000Z',
    updatedAt: '2026-06-09T08:00:00.000Z',
  },
  {
    id: 'visual-2',
    userName: 'Luca',
    createdAt: '2026-06-09T08:00:00.000Z',
    updatedAt: '2026-06-09T08:00:00.000Z',
  },
];

const MOCK_STATS: SeriesData[] = [
  {
    name: 'Mauro',
    points: [
      { date: '2026-06-01', cumulative: 8 },
      { date: '2026-06-02', cumulative: 13 },
      { date: '2026-06-03', cumulative: 20 },
      { date: '2026-06-04', cumulative: 27 },
    ],
  },
  {
    name: 'Luca',
    points: [
      { date: '2026-06-01', cumulative: 6 },
      { date: '2026-06-02', cumulative: 11 },
      { date: '2026-06-03', cumulative: 17 },
      { date: '2026-06-04', cumulative: 24 },
    ],
  },
];

export function VisualTestPage() {
  return (
    <main className="visual-test-page" aria-label="Visual component showcase" data-test-id="visual-test-root">
      <section className="visual-test-section" aria-label="Session gate showcase">
        <h1>Visual Component Showcase</h1>
        <SessionGate
          sessions={MOCK_SESSIONS}
          scanCounts={{ 'visual-1': 14, 'visual-2': 9 }}
          albumCounts={{
            'visual-1': { owned: 240, missing: 740 },
            'visual-2': { owned: 180, missing: 800 },
          }}
          onCreate={() => {}}
          onResume={() => {}}
          onImportAlbum={() => {}}
          onImportJson={() => {}}
          onOpenBoard={() => {}}
          storageMode="local"
          onChangeMode={() => {}}
        />
      </section>

      <section className="visual-test-section" aria-label="Tab bar showcase">
        <h2>Navigation</h2>
        <TabBar active="reps" onChange={() => {}} showBoard onGoHome={() => {}} />
      </section>

      <section className="visual-test-section" aria-label="Reps switch showcase">
        <h2>Reps View Switch</h2>
        <RepsViewSwitch value="grid" onChange={() => {}} />
      </section>

      <section className="visual-test-section" aria-label="Stats chart showcase">
        <h2>Board Stats Chart</h2>
        <StatsChart series={MOCK_STATS} />
      </section>
    </main>
  );
}
