export type Tab = 'album' | 'reps' | 'board';

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  showBoard?: boolean;
  onGoHome?: () => void;
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 8.5L9 2l7 6.5V16a1 1 0 01-1 1H12v-5H6v5H3a1 1 0 01-1-1V8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function AlbumIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 6h14M6 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="5" y="9" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10" y="9" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function RepsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="11" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="1" width="11" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="var(--paper)" />
      <path d="M9 7h5M9 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LeaderboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="10" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7" y="6" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="2" width="4" height="15" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function TabBar({ active, onChange, showBoard = false, onGoHome }: TabBarProps) {
  const contentTabs: Array<{ id: Tab; label: string }> = [
    { id: 'album', label: 'My Album' },
    { id: 'reps', label: 'My Reps' },
    ...(showBoard ? [{ id: 'board' as const, label: 'Leaderboard' }] : []),
  ];
  const activeIndex = contentTabs.findIndex((tab) => tab.id === active);
  const previous = activeIndex > 0 ? contentTabs[activeIndex - 1] : null;
  const next = activeIndex >= 0 && activeIndex < contentTabs.length - 1 ? contentTabs[activeIndex + 1] : null;

  return (
    <nav aria-label="Primary sections" className="section-nav">
      <div role="tablist" className="tab-bar">
        {onGoHome && (
          <button
            type="button"
            role="tab"
            aria-selected={false}
            className="tab-bar-item"
            onClick={onGoHome}
          >
            <HomeIcon />
            <span className="tab-bar-label">Home</span>
          </button>
        )}
        <button
          type="button"
          role="tab"
          aria-selected={active === 'album'}
          data-test-id="tab-album"
          className={`tab-bar-item${active === 'album' ? ' tab-active' : ''}`}
          onClick={() => onChange('album')}
        >
          <AlbumIcon />
          <span className="tab-bar-label">My Album</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={active === 'reps'}
          data-test-id="tab-reps"
          className={`tab-bar-item${active === 'reps' ? ' tab-active' : ''}`}
          onClick={() => onChange('reps')}
        >
          <RepsIcon />
          <span className="tab-bar-label">My Reps</span>
        </button>
        {showBoard && (
          <button
            type="button"
            role="tab"
            aria-selected={active === 'board'}
            data-test-id="tab-board"
            className={`tab-bar-item${active === 'board' ? ' tab-active' : ''}`}
            onClick={() => onChange('board')}
          >
            <LeaderboardIcon />
            <span className="tab-bar-label">Leaderboard</span>
          </button>
        )}
      </div>
      <div className="section-stepper">
        <button
          type="button"
          className="quiet"
          disabled={!previous}
          onClick={() => previous && onChange(previous.id)}
        >
          Previous section
        </button>
        <button
          type="button"
          className="quiet"
          disabled={!next}
          onClick={() => next && onChange(next.id)}
        >
          Next section
        </button>
      </div>
    </nav>
  );
}
