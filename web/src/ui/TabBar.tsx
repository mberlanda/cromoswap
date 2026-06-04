interface TabBarProps {
  active: 'album' | 'reps';
  onChange: (tab: 'album' | 'reps') => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
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
    </div>
  );
}
