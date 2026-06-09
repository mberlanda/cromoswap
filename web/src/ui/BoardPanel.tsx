import type { AlbumRepo, Clock } from '../storage/types';
import type { LeaderboardEntry } from '../storage/sync-client';
import { LeaderboardView } from './LeaderboardView';
import { AlbumView } from './AlbumView';

interface BoardPanelProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  onRefresh: () => void;
  selectionUserName: string | null;
  onOpenSelection: (userName: string) => void;
  onCloseSelection: () => void;
  albumRepo: AlbumRepo;
  downloadText: (filename: string, content: string) => void;
  now: Clock;
}

/**
 * The board: a leaderboard that drills into a read-only view of any collector's
 * album. Editing/deleting lives in the Rails /admin backoffice, linked here.
 * Reused both inside a session (Board tab) and from the home screen.
 */
export function BoardPanel({
  entries,
  loading,
  onRefresh,
  selectionUserName,
  onOpenSelection,
  onCloseSelection,
  albumRepo,
  downloadText,
  now,
}: BoardPanelProps) {
  if (selectionUserName) {
    return (
      <section aria-label="Read-only selection">
        <div className="leaderboard-header">
          <h2 className="leaderboard-title">{selectionUserName}'s selection</h2>
          <button type="button" className="secondary" onClick={onCloseSelection}>
            Back to board
          </button>
        </div>
        <AlbumView
          userName={selectionUserName}
          albumRepo={albumRepo}
          downloadText={downloadText}
          now={now}
          readOnly
        />
        <p className="board-admin-note">
          Need to edit or remove this collector?{' '}
          <a href="/admin" target="_blank" rel="noopener noreferrer" className="board-admin-link" data-test-id="admin-link">
            Open admin backoffice
          </a>
        </p>
      </section>
    );
  }

  return (
    <LeaderboardView
      entries={entries}
      loading={loading}
      onRefresh={onRefresh}
      onOpenSelection={onOpenSelection}
    />
  );
}
