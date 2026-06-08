import { useState } from 'react';

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

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 5l1.5-2h3L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
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

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function labelFor(tab: Tab): string {
  if (tab === 'album') return 'My Album';
  if (tab === 'reps') return 'My Stickers';
  return 'Leaderboard';
}

function iconFor(tab: Tab): () => ReturnType<typeof AlbumIcon> {
  if (tab === 'album') return AlbumIcon;
  if (tab === 'reps') return CameraIcon;
  return LeaderboardIcon;
}

export function TabBar({ active, onChange, showBoard = false, onGoHome }: TabBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const contentTabs: Array<{ id: Tab; label: string }> = [
    { id: 'album', label: 'My Album' },
    { id: 'reps', label: 'My Stickers' },
    ...(showBoard ? [{ id: 'board' as const, label: 'Leaderboard' }] : []),
  ];

  const menuItems: Array<{ id: 'home' | Tab; label: string; onSelect: () => void }> = [
    ...(onGoHome
      ? [
          {
            id: 'home' as const,
            label: 'Home',
            onSelect: () => onGoHome(),
          },
        ]
      : []),
    ...contentTabs.map((tab) => ({ id: tab.id, label: tab.label, onSelect: () => onChange(tab.id) })),
  ];

  return (
    <nav aria-label="Primary sections" className="section-nav">
      <div className="tab-bar-top">
        <button
          type="button"
          className="tab-menu-btn"
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          data-test-id="nav-menu-toggle"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <MenuIcon />
        </button>
      </div>
      {menuOpen && (
        <div className="tab-menu" role="menu" data-test-id="nav-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              data-test-id={`menu-${item.id}`}
              onClick={() => {
                item.onSelect();
                setMenuOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div role="tablist" className="tab-bar" data-test-id="primary-tablist">
        {onGoHome && (
          <button
            type="button"
            role="tab"
            aria-selected={false}
            data-test-id="tab-home"
            className="tab-bar-item"
            onClick={onGoHome}
          >
            <HomeIcon />
            <span className="tab-bar-label">Home</span>
          </button>
        )}
        {contentTabs.map((tab) => {
          const Icon = iconFor(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active === tab.id}
              data-test-id={`tab-${tab.id}`}
              className={`tab-bar-item${active === tab.id ? ' tab-active' : ''}`}
              onClick={() => onChange(tab.id)}
            >
              <Icon />
              <span className="tab-bar-label">{labelFor(tab.id)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
