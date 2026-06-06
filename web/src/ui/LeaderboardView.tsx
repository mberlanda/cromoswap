import type { LeaderboardEntry } from '../storage/sync-client';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  onRefresh: () => void;
  onOpenSelection?: (userName: string) => void;
}

export function LeaderboardView({
  entries,
  loading,
  onRefresh,
  onOpenSelection,
}: LeaderboardViewProps) {
  return (
    <section aria-label="Leaderboard">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title" data-test-id="leaderboard-title">Leaderboard</h2>
        <button type="button" className="secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      {entries.length === 0 && !loading && (
        <p className="leaderboard-empty">
          No data yet. Collect stickers and sync your album to appear here.
        </p>
      )}
      <ol className="leaderboard-list" aria-label="Ranking">
        {entries.map((entry, i) => (
          <li key={entry.userName} className="leaderboard-row">
            <span className="leaderboard-rank" aria-label={`Rank ${i + 1}`}>#{i + 1}</span>
            <span className="leaderboard-name">{entry.userName}</span>
            <span className="leaderboard-owned">{entry.owned} owned</span>
            <span className="leaderboard-missing">{entry.missing} missing</span>
            {onOpenSelection && (
              <button
                type="button"
                className="quiet leaderboard-open"
                data-test-id={`open-${entry.userName}`}
                onClick={() => onOpenSelection(entry.userName)}
              >
                Open {entry.userName} selection
              </button>
            )}
          </li>
        ))}
      </ol>
      <p className="leaderboard-note">
        Based on album stickers synced from each collector's device.
      </p>
    </section>
  );
}
