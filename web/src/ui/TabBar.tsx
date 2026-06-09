import type { ReactNode } from 'react';

export type Tab = 'album' | 'reps' | 'board';

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  showBoard?: boolean;
  onGoHome?: () => void;
}

export interface PrimaryTabListItem {
  id: string;
  label: string;
  selected: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  testId?: string;
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

export function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface PrimaryTabListProps {
  items: PrimaryTabListItem[];
  dataTestId: string;
}

export function PrimaryTabList({ items, dataTestId }: PrimaryTabListProps) {
  return (
    <div role="tablist" className="tab-bar" data-test-id={dataTestId}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.selected}
          data-test-id={item.testId ?? `tab-${item.id}`}
          className={`tab-bar-item${item.selected ? ' tab-active' : ''}`}
          onClick={item.onClick}
        >
          {item.icon}
          <span className="tab-bar-label">{item.label}</span>
        </button>
      ))}
    </div>
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
  const contentTabs: Array<{ id: Tab; label: string }> = [
    { id: 'album', label: 'My Album' },
    { id: 'reps', label: 'My Stickers' },
    ...(showBoard ? [{ id: 'board' as const, label: 'Leaderboard' }] : []),
  ];
  const items: PrimaryTabListItem[] = [
    ...(onGoHome
      ? [
          {
            id: 'home',
            label: 'Home',
            selected: false,
            icon: <HomeIcon />,
            onClick: onGoHome,
            testId: 'tab-home',
          },
        ]
      : []),
    ...contentTabs.map((tab) => {
      const Icon = iconFor(tab.id);
      return {
        id: tab.id,
        label: labelFor(tab.id),
        selected: active === tab.id,
        icon: <Icon />,
        onClick: () => onChange(tab.id),
        testId: `tab-${tab.id}`,
      };
    }),
  ];

  return (
    <nav aria-label="Primary sections" className="section-nav">
      <PrimaryTabList items={items} dataTestId="primary-tablist" />
    </nav>
  );
}
