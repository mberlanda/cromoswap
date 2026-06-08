import { useState } from 'react';

export interface CommandBarProps {
  groups: readonly string[];
  activeGroups: Set<string>;
  onToggleGroup: (group: string) => void;
  onClearFilter: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 3h14M3 8h10M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CommandBar({
  groups,
  activeGroups,
  onToggleGroup,
  onClearFilter,
  searchQuery = '',
  onSearchChange,
}: CommandBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const activeCount = activeGroups.size;
  const hasSearch = !!onSearchChange;

  return (
    <div className="command-bar">
      <div className="command-bar-row">
        <button
          type="button"
          className={`command-bar-btn${activeCount > 0 ? ' command-bar-btn-active' : ''}`}
          aria-label="Filter by group"
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen((v) => !v)}
        >
          <FilterIcon />
          {activeCount > 0 && <span className="command-bar-badge">{activeCount}</span>}
        </button>
        {hasSearch && (
          <button
            type="button"
            className={`command-bar-btn${searchQuery ? ' command-bar-btn-active' : ''}`}
            aria-label="Search teams"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <SearchIcon />
          </button>
        )}
      </div>
      {filterOpen && (
        <div className="command-bar-filter-panel" role="group" aria-label="Group filters">
          {activeCount > 0 && (
            <button
              type="button"
              className="filter-chip filter-chip-reset"
              onClick={onClearFilter}
            >
              Reset
            </button>
          )}
          {groups.map((g) => {
            const active = activeGroups.has(g);
            const label = g === 'FWC' ? 'FWC' : `Group ${g}`;
            return (
              <button
                key={g}
                type="button"
                className={`filter-chip${active ? ' filter-chip-active' : ''}`}
                aria-pressed={active}
                onClick={() => onToggleGroup(g)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {hasSearch && searchOpen && (
        <div className="command-bar-search-row">
          <input
            type="search"
            className="command-bar-search-input"
            aria-label="Search teams"
            placeholder="Search teams…"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
