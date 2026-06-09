import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

export type Tab = 'album' | 'reps' | 'board' | 'stats';

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

const MAX_VISIBLE_TABS = 4;
const MOBILE_MEDIA_QUERY = '(max-width: 680px)';

function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

export function HomeIcon() {
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

export function LeaderboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="10" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7" y="6" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="2" width="4" height="15" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="3" y="9" width="2.5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7.75" y="6.5" width="2.5" height="7.5" rx="0.8" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12.5" y="4" width="2.5" height="10" rx="0.8" stroke="currentColor" strokeWidth="1.5" />
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
  activeTabId?: Tab;
}

function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M11.5 3.5L6 9l5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M6.5 3.5L12 9l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PrimaryTabList({ items, dataTestId, activeTabId }: PrimaryTabListProps) {
  const [windowStart, setWindowStart] = useState(0);
  const isMobile = useIsMobileViewport();
  const hasOverflow = isMobile && items.length > MAX_VISIBLE_TABS;

  const maxStart = Math.max(0, items.length - MAX_VISIBLE_TABS);

  let displayStart = windowStart;
  if (hasOverflow && activeTabId) {
    const activeIndex = items.findIndex((item) => item.id === activeTabId);
    if (activeIndex >= 0) {
      if (activeIndex < displayStart) displayStart = activeIndex;
      if (activeIndex >= displayStart + MAX_VISIBLE_TABS) {
        displayStart = activeIndex - MAX_VISIBLE_TABS + 1;
      }
      displayStart = Math.max(0, Math.min(displayStart, maxStart));
    }
  }

  const visibleItems = useMemo(() => {
    if (!hasOverflow) return items;
    return items.slice(displayStart, displayStart + MAX_VISIBLE_TABS);
  }, [displayStart, hasOverflow, items]);

  const canGoLeft = displayStart > 0;
  const canGoRight = displayStart < maxStart;

  return (
    <div className="tab-bar-shell" data-test-id={`${dataTestId}-shell`}>
      {hasOverflow && (
        <button
          type="button"
          className="tab-swap-btn"
          aria-label="Show previous tabs"
          data-test-id="tab-swap-left"
          onClick={() => setWindowStart(Math.max(0, displayStart - 1))}
          disabled={!canGoLeft}
        >
          <ChevronLeftIcon />
        </button>
      )}
      <div role="tablist" className="tab-bar" data-test-id={dataTestId}>
        {visibleItems.map((item) => (
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
      {hasOverflow && (
        <button
          type="button"
          className="tab-swap-btn"
          aria-label="Show next tabs"
          data-test-id="tab-swap-right"
          onClick={() => setWindowStart(Math.min(maxStart, displayStart + 1))}
          disabled={!canGoRight}
        >
          <ChevronRightIcon />
        </button>
      )}
    </div>
  );
}

function labelFor(tab: Tab): string {
  if (tab === 'album') return 'My Album';
  if (tab === 'reps') return 'My Stickers';
  if (tab === 'stats') return 'Stats';
  return 'Leaderboard';
}

function iconFor(tab: Tab): () => ReturnType<typeof AlbumIcon> {
  if (tab === 'album') return AlbumIcon;
  if (tab === 'reps') return CameraIcon;
  if (tab === 'stats') return StatsIcon;
  return LeaderboardIcon;
}

export function TabBar({ active, onChange, showBoard = false, onGoHome }: TabBarProps) {
  const contentTabs: Array<{ id: Tab; label: string }> = [
    { id: 'album', label: 'My Album' },
    { id: 'reps', label: 'My Stickers' },
    { id: 'stats', label: 'Stats' },
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
      <PrimaryTabList items={items} dataTestId="primary-tablist" activeTabId={active} />
    </nav>
  );
}
