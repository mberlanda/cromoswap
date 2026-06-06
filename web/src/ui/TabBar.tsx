export type Tab = 'album' | 'reps' | 'board';

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  showBoard?: boolean;
}

export function TabBar({ active, onChange, showBoard = false }: TabBarProps) {
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'album', label: 'My Album' },
    { id: 'reps', label: 'My Reps' },
    ...(showBoard ? [{ id: 'board' as const, label: 'Board' }] : []),
  ];
  const activeIndex = tabs.findIndex((tab) => tab.id === active);
  const previous = activeIndex > 0 ? tabs[activeIndex - 1] : null;
  const next = activeIndex >= 0 && activeIndex < tabs.length - 1 ? tabs[activeIndex + 1] : null;

  return (
    <nav aria-label="Primary sections" className="section-nav">
      <div role="tablist" className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            data-test-id={`tab-${tab.id}`}
            className={active === tab.id ? 'tab-active' : ''}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
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
