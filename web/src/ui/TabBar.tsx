export type Tab = 'album' | 'reps' | 'board';

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  showBoard?: boolean;
}

export function TabBar({ active, onChange, showBoard = false }: TabBarProps) {
  return (
    <div role="tablist" className="tab-bar">
      <button
        type="button"
        role="tab"
        aria-selected={active === 'album'}
        className={active === 'album' ? 'tab-active' : ''}
        onClick={() => onChange('album')}
      >
        My Album
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === 'reps'}
        className={active === 'reps' ? 'tab-active' : ''}
        onClick={() => onChange('reps')}
      >
        My Reps
      </button>
      {showBoard && (
        <button
          type="button"
          role="tab"
          aria-selected={active === 'board'}
          className={active === 'board' ? 'tab-active' : ''}
          onClick={() => onChange('board')}
        >
          Board
        </button>
      )}
    </div>
  );
}
