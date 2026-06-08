# UI Improvements — 6-Feature Backlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement six incremental UI improvements across the album, reps, board, and home sections of the cromoswap web app, each delivered as an atomic PR.

**Architecture:** All changes are pure frontend: React components + CSS in `web/src/ui/` and `web/src/index.css`. No new runtime dependencies. Charts use plain SVG. Icons use inline SVG fragments. Each PR is independently deployable.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, CSS custom properties. Tests via `@testing-library/react` + vitest. Run tests from `web/` with `npm test` (or `npx vitest run`).

**PRs in order:**
- PR 1 (this): Planning doc
- PR 2: Task 1 — Album/Reps group filter
- PR 3: Task 2 — Album/Reps team name search
- PR 4: Task 3 — Reps view switch (Grid / Manual / Scan)
- PR 5: Task 4 — TabBar icon-driven navigation
- PR 6: Task 5 — Board cumulative-stats chart
- PR 7: Task 6 — Home page section-style normalization

---

## Task 1: Album/Reps Group Filter

**Goal:** In both the My Album and My Reps (grid) tabs, add a filter bar above the album list. A filter icon opens group chips (FWC, A–L). Clicking a chip toggles that group on/off; a "Reset" chip clears all filters. When filters are active, only matching `.album-group` sections render.

**Files:**
- Create: `web/src/ui/CommandBar.tsx`
- Modify: `web/src/ui/AlbumGroupedGrid.tsx`
- Modify: `web/src/ui/AlbumView.tsx`
- Modify: `web/src/ui/RepsGrid.tsx`
- Modify: `web/src/index.css`
- Test: `web/src/ui/CommandBar.test.tsx`

---

- [ ] **Step 1.1: Write failing tests for CommandBar**

Create `web/src/ui/CommandBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandBar } from './CommandBar';

const GROUPS = ['FWC', 'A', 'B', 'C'];

test('renders filter icon button', () => {
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set()}
      onToggleGroup={() => {}}
      onClearFilter={() => {}}
    />,
  );
  expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
});

test('filter panel hidden by default', () => {
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set()}
      onToggleGroup={() => {}}
      onClearFilter={() => {}}
    />,
  );
  expect(screen.queryByRole('button', { name: 'FWC' })).not.toBeInTheDocument();
});

test('clicking filter icon shows group chips', async () => {
  const user = userEvent.setup();
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set()}
      onToggleGroup={() => {}}
      onClearFilter={() => {}}
    />,
  );
  await user.click(screen.getByRole('button', { name: /filter/i }));
  expect(screen.getByRole('button', { name: 'FWC' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Group A' })).toBeInTheDocument();
});

test('active group chip has aria-pressed=true', async () => {
  const user = userEvent.setup();
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set(['A'])}
      onToggleGroup={() => {}}
      onClearFilter={() => {}}
    />,
  );
  await user.click(screen.getByRole('button', { name: /filter/i }));
  expect(screen.getByRole('button', { name: 'Group A' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Group B' })).toHaveAttribute('aria-pressed', 'false');
});

test('clicking group chip calls onToggleGroup', async () => {
  const user = userEvent.setup();
  const spy = vi.fn();
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set()}
      onToggleGroup={spy}
      onClearFilter={() => {}}
    />,
  );
  await user.click(screen.getByRole('button', { name: /filter/i }));
  await user.click(screen.getByRole('button', { name: 'Group A' }));
  expect(spy).toHaveBeenCalledWith('A');
});

test('clicking FWC chip calls onToggleGroup with FWC', async () => {
  const user = userEvent.setup();
  const spy = vi.fn();
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set()}
      onToggleGroup={spy}
      onClearFilter={() => {}}
    />,
  );
  await user.click(screen.getByRole('button', { name: /filter/i }));
  await user.click(screen.getByRole('button', { name: 'FWC' }));
  expect(spy).toHaveBeenCalledWith('FWC');
});

test('reset chip visible when filters active, calls onClearFilter', async () => {
  const user = userEvent.setup();
  const spy = vi.fn();
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set(['A'])}
      onToggleGroup={() => {}}
      onClearFilter={spy}
    />,
  );
  await user.click(screen.getByRole('button', { name: /filter/i }));
  const reset = screen.getByRole('button', { name: /reset/i });
  await user.click(reset);
  expect(spy).toHaveBeenCalled();
});

test('active filter count badge shown on filter button when filters active', () => {
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set(['A', 'B'])}
      onToggleGroup={() => {}}
      onClearFilter={() => {}}
    />,
  );
  expect(screen.getByText('2')).toBeInTheDocument();
});
```

- [ ] **Step 1.2: Run tests to confirm they fail**

```bash
cd web && npx vitest run src/ui/CommandBar.test.tsx
```
Expected: all tests FAIL with "Cannot find module './CommandBar'"

- [ ] **Step 1.3: Create CommandBar component**

Create `web/src/ui/CommandBar.tsx`:

```tsx
import { useState } from 'react';

interface CommandBarProps {
  groups: readonly string[];
  activeGroups: Set<string>;
  onToggleGroup: (group: string) => void;
  onClearFilter: () => void;
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 3h14M3 8h10M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CommandBar({ groups, activeGroups, onToggleGroup, onClearFilter }: CommandBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const activeCount = activeGroups.size;

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
    </div>
  );
}
```

- [ ] **Step 1.4: Run tests to confirm they pass**

```bash
cd web && npx vitest run src/ui/CommandBar.test.tsx
```
Expected: all 8 tests PASS.

- [ ] **Step 1.5: Add groupFilter support to AlbumGroupedGrid**

Read `web/src/ui/AlbumGroupedGrid.tsx`, then update the props and render logic:

```tsx
// Add to props interface:
groupFilter?: Set<string>; // when non-empty, only render matching groups

// In the render, wrap each group in a conditional:
const showFwc = !groupFilter || groupFilter.size === 0 || groupFilter.has('FWC');
// ... for ALBUM_GROUPS:
const visibleGroups = ALBUM_GROUPS.filter(
  ({ letter }) => !groupFilter || groupFilter.size === 0 || groupFilter.has(letter),
);
```

Full updated `web/src/ui/AlbumGroupedGrid.tsx`:

```tsx
import { Fragment, type ReactNode } from 'react';
import { ALBUM_GROUPS, teamFullName, teamFlag } from '../domain/album-config';

interface RenderTeamArgs {
  prefix: string;
  fullName: string;
  flag: string;
}

interface AlbumGroupedGridProps {
  ariaLabel?: string;
  renderTeam: (args: RenderTeamArgs) => ReactNode;
  groupFilter?: Set<string>;
}

export function AlbumGroupedGrid({ ariaLabel, renderTeam, groupFilter }: AlbumGroupedGridProps) {
  const noFilter = !groupFilter || groupFilter.size === 0;
  const showFwc = noFilter || groupFilter.has('FWC');
  const visibleGroups = ALBUM_GROUPS.filter(
    ({ letter }) => noFilter || groupFilter.has(letter),
  );

  return (
    <div className="album-list" aria-label={ariaLabel}>
      {showFwc && (
        <div className="album-group">
          <h3 className="album-group-header">🏆 FIFA World Cup</h3>
          {renderTeam({ prefix: 'FWC', fullName: 'FIFA World Cup', flag: '🏆' })}
        </div>
      )}
      {visibleGroups.map(({ letter, prefixes }) => (
        <div key={letter} className="album-group">
          <h3 className="album-group-header">Group {letter}</h3>
          {prefixes.map((prefix) => (
            <Fragment key={prefix}>
              {renderTeam({ prefix, fullName: teamFullName(prefix), flag: teamFlag(prefix) })}
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 1.6: Integrate CommandBar into AlbumView**

Read `web/src/ui/AlbumView.tsx` and add state + CommandBar above the grid:

```tsx
// Add import at top:
import { useState } from 'react';
import { CommandBar } from './CommandBar';
import { ALBUM_GROUPS } from '../domain/album-config';

// All group keys available for filtering:
const ALL_GROUPS = ['FWC', ...ALBUM_GROUPS.map((g) => g.letter)] as const;

// Inside the component, add state:
const [groupFilter, setGroupFilter] = useState<Set<string>>(new Set());

function toggleGroup(g: string) {
  setGroupFilter((prev) => {
    const next = new Set(prev);
    if (next.has(g)) next.delete(g);
    else next.add(g);
    return next;
  });
}

// Replace the current return, adding CommandBar above AlbumGroupedGrid:
return (
  <section aria-label="My Album">
    <CommandBar
      groups={ALL_GROUPS}
      activeGroups={groupFilter}
      onToggleGroup={toggleGroup}
      onClearFilter={() => setGroupFilter(new Set())}
    />
    <AlbumGroupedGrid
      groupFilter={groupFilter}
      renderTeam={({ prefix, fullName, flag }) => (
        <TeamCard ... />
      )}
    />
    ...
  </section>
);
```

- [ ] **Step 1.7: Integrate CommandBar into RepsGrid**

Read `web/src/ui/RepsGrid.tsx` and add CommandBar inside the exported `RepsGrid` component (above the `AlbumGroupedGrid`):

```tsx
// Add imports:
import { useState } from 'react';
import { CommandBar } from './CommandBar';
import { ALBUM_GROUPS } from '../domain/album-config';

const ALL_GROUPS = ['FWC', ...ALBUM_GROUPS.map((g) => g.letter)] as const;

// Inside RepsGrid component, add state:
const [groupFilter, setGroupFilter] = useState<Set<string>>(new Set());

function toggleGroup(g: string) {
  setGroupFilter((prev) => {
    const next = new Set(prev);
    if (next.has(g)) next.delete(g);
    else next.add(g);
    return next;
  });
}

// Wrap existing return with CommandBar:
return (
  <>
    <CommandBar
      groups={ALL_GROUPS}
      activeGroups={groupFilter}
      onToggleGroup={toggleGroup}
      onClearFilter={() => setGroupFilter(new Set())}
    />
    <AlbumGroupedGrid
      groupFilter={groupFilter}
      renderTeam={...} // existing renderTeam prop unchanged
    />
  </>
);
```

- [ ] **Step 1.8: Add CSS for CommandBar**

Append to `web/src/index.css`:

```css
/* ── Command Bar ─────────────────────────────────────────── */
.command-bar {
  margin-bottom: var(--space-3);
}

.command-bar-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  justify-content: flex-end;
}

.command-bar-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius);
  border: 1px solid var(--subtle);
  background: var(--field);
  color: var(--muted);
  padding: 0;
}

.command-bar-btn-active {
  border-color: var(--info);
  color: var(--info);
}

.command-bar-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 999px;
  background: var(--info);
  color: white;
  font-size: 10px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--paper);
}

.command-bar-filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  padding: var(--space-2) 0 var(--space-1);
}

.filter-chip {
  padding: var(--space-1) var(--space-2);
  border-radius: 999px;
  border: 1px solid var(--subtle);
  background: var(--field);
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.filter-chip-active {
  background: var(--info);
  border-color: var(--info);
  color: white;
}

.filter-chip-reset {
  background: var(--surface);
  border-color: var(--danger);
  color: var(--danger);
}
```

- [ ] **Step 1.9: Run all tests**

```bash
cd web && npx vitest run
```
Expected: all tests PASS.

- [ ] **Step 1.10: Commit**

```bash
cd web && git add src/ui/CommandBar.tsx src/ui/CommandBar.test.tsx src/ui/AlbumGroupedGrid.tsx src/ui/AlbumView.tsx src/ui/RepsGrid.tsx src/index.css
git commit -m "feat(ui): group filter command bar for album and reps tabs"
```

---

## Task 2: Album/Reps Team Name Search

**Goal:** Add a search icon (magnifying glass) to the CommandBar. Clicking it expands an inline text input. Typing filters the album list case-insensitively against `.team-card-name` text (prefix + fullName). Groups with no visible teams are hidden.

**Files:**
- Modify: `web/src/ui/CommandBar.tsx`
- Modify: `web/src/ui/AlbumGroupedGrid.tsx`
- Modify: `web/src/ui/AlbumView.tsx`
- Modify: `web/src/ui/RepsGrid.tsx`
- Modify: `web/src/index.css`
- Modify: `web/src/ui/CommandBar.test.tsx`

---

- [ ] **Step 2.1: Write failing tests for search in CommandBar**

Add to `web/src/ui/CommandBar.test.tsx`:

```tsx
test('search icon button is rendered', () => {
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set()}
      onToggleGroup={() => {}}
      onClearFilter={() => {}}
      searchQuery=""
      onSearchChange={() => {}}
    />,
  );
  expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
});

test('search input hidden by default', () => {
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set()}
      onToggleGroup={() => {}}
      onClearFilter={() => {}}
      searchQuery=""
      onSearchChange={() => {}}
    />,
  );
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});

test('clicking search icon expands input', async () => {
  const user = userEvent.setup();
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set()}
      onToggleGroup={() => {}}
      onClearFilter={() => {}}
      searchQuery=""
      onSearchChange={() => {}}
    />,
  );
  await user.click(screen.getByRole('button', { name: /search/i }));
  expect(screen.getByRole('textbox')).toBeInTheDocument();
});

test('typing in search calls onSearchChange', async () => {
  const user = userEvent.setup();
  const spy = vi.fn();
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set()}
      onToggleGroup={() => {}}
      onClearFilter={() => {}}
      searchQuery=""
      onSearchChange={spy}
    />,
  );
  await user.click(screen.getByRole('button', { name: /search/i }));
  await user.type(screen.getByRole('textbox'), 'bra');
  expect(spy).toHaveBeenCalledWith('b');
});

test('search button highlighted when query non-empty', () => {
  render(
    <CommandBar
      groups={GROUPS}
      activeGroups={new Set()}
      onToggleGroup={() => {}}
      onClearFilter={() => {}}
      searchQuery="bra"
      onSearchChange={() => {}}
    />,
  );
  expect(screen.getByRole('button', { name: /search/i })).toHaveClass('command-bar-btn-active');
});
```

- [ ] **Step 2.2: Run tests to confirm new tests fail**

```bash
cd web && npx vitest run src/ui/CommandBar.test.tsx
```
Expected: 5 new tests FAIL (search-related ones).

- [ ] **Step 2.3: Update CommandBar to support search**

Update `web/src/ui/CommandBar.tsx` to add optional `searchQuery` and `onSearchChange` props and a search icon button:

```tsx
import { useState } from 'react';

interface CommandBarProps {
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
```

- [ ] **Step 2.4: Run tests to confirm they pass**

```bash
cd web && npx vitest run src/ui/CommandBar.test.tsx
```
Expected: all tests PASS.

- [ ] **Step 2.5: Add searchQuery filtering to AlbumGroupedGrid**

Update `web/src/ui/AlbumGroupedGrid.tsx` to accept and apply `searchQuery`:

```tsx
interface AlbumGroupedGridProps {
  ariaLabel?: string;
  renderTeam: (args: RenderTeamArgs) => ReactNode;
  groupFilter?: Set<string>;
  searchQuery?: string;
}

// Helper: does a prefix+fullName match the query?
function matchesSearch(prefix: string, fullName: string, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return prefix.toLowerCase().includes(q) || fullName.toLowerCase().includes(q);
}
```

In the render, filter each group's prefixes by the search query, and skip groups with no matching prefixes:

```tsx
export function AlbumGroupedGrid({ ariaLabel, renderTeam, groupFilter, searchQuery = '' }: AlbumGroupedGridProps) {
  const noFilter = !groupFilter || groupFilter.size === 0;
  const showFwc = (noFilter || groupFilter.has('FWC')) && matchesSearch('FWC', 'FIFA World Cup', searchQuery);
  const visibleGroups = ALBUM_GROUPS
    .filter(({ letter }) => noFilter || groupFilter.has(letter))
    .map(({ letter, prefixes }) => ({
      letter,
      prefixes: prefixes.filter((p) => matchesSearch(p, teamFullName(p), searchQuery)),
    }))
    .filter(({ prefixes }) => prefixes.length > 0);

  return (
    <div className="album-list" aria-label={ariaLabel}>
      {showFwc && (
        <div className="album-group">
          <h3 className="album-group-header">🏆 FIFA World Cup</h3>
          {renderTeam({ prefix: 'FWC', fullName: 'FIFA World Cup', flag: '🏆' })}
        </div>
      )}
      {visibleGroups.map(({ letter, prefixes }) => (
        <div key={letter} className="album-group">
          <h3 className="album-group-header">Group {letter}</h3>
          {prefixes.map((prefix) => (
            <Fragment key={prefix}>
              {renderTeam({ prefix, fullName: teamFullName(prefix), flag: teamFlag(prefix) })}
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2.6: Wire search state into AlbumView**

In `web/src/ui/AlbumView.tsx`, add search state alongside the existing filter state:

```tsx
const [searchQuery, setSearchQuery] = useState('');

// Update CommandBar usage:
<CommandBar
  groups={ALL_GROUPS}
  activeGroups={groupFilter}
  onToggleGroup={toggleGroup}
  onClearFilter={() => setGroupFilter(new Set())}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
/>

// Pass to AlbumGroupedGrid:
<AlbumGroupedGrid
  groupFilter={groupFilter}
  searchQuery={searchQuery}
  renderTeam={...}
/>
```

- [ ] **Step 2.7: Wire search state into RepsGrid**

Same pattern in `web/src/ui/RepsGrid.tsx`:

```tsx
const [searchQuery, setSearchQuery] = useState('');

<CommandBar
  groups={ALL_GROUPS}
  activeGroups={groupFilter}
  onToggleGroup={toggleGroup}
  onClearFilter={() => setGroupFilter(new Set())}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
/>
<AlbumGroupedGrid
  groupFilter={groupFilter}
  searchQuery={searchQuery}
  renderTeam={...}
/>
```

- [ ] **Step 2.8: Add CSS for search input**

Append to `web/src/index.css`:

```css
.command-bar-search-row {
  padding: var(--space-2) 0 var(--space-1);
}

.command-bar-search-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--subtle);
  border-radius: var(--radius);
  background: var(--field);
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  outline: none;
}

.command-bar-search-input:focus {
  border-color: var(--info);
}
```

- [ ] **Step 2.9: Run all tests**

```bash
cd web && npx vitest run
```
Expected: all tests PASS.

- [ ] **Step 2.10: Commit**

```bash
git add web/src/ui/CommandBar.tsx web/src/ui/CommandBar.test.tsx web/src/ui/AlbumGroupedGrid.tsx web/src/ui/AlbumView.tsx web/src/ui/RepsGrid.tsx web/src/index.css
git commit -m "feat(ui): team name search in album and reps command bar"
```

---

## Task 3: Reps View Switch Redesign (Grid / Manual / Scan)

**Goal:** Replace the current 2-button (Grid/Scan) text toggle in `RepsView` with a 3-option icon-driven segmented control: Grid (grid icon), Manual (pen icon), Scan (barcode icon). Grid is the default. The current 'scan' view is split into separate Manual (text entry) and Scan (camera) modes.

**Files:**
- Modify: `web/src/ui/RepsView.tsx`
- Modify: `web/src/ui/App.tsx`
- Modify: `web/src/index.css`
- Test: `web/src/ui/RepsViewSwitch.test.tsx` (new)

---

- [ ] **Step 3.1: Write failing tests for the new view switch**

Create `web/src/ui/RepsViewSwitch.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RepsViewSwitch } from './RepsViewSwitch';
import type { RepsViewMode } from './RepsView';

test('renders three options: Grid, Manual, Scan', () => {
  render(<RepsViewSwitch value="grid" onChange={() => {}} />);
  expect(screen.getByRole('button', { name: /grid/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /manual/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /scan/i })).toBeInTheDocument();
});

test('active option has aria-pressed=true', () => {
  render(<RepsViewSwitch value="manual" onChange={() => {}} />);
  expect(screen.getByRole('button', { name: /manual/i })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /grid/i })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('button', { name: /scan/i })).toHaveAttribute('aria-pressed', 'false');
});

test('clicking a button calls onChange with its mode', async () => {
  const user = userEvent.setup();
  const spy = vi.fn();
  render(<RepsViewSwitch value="grid" onChange={spy} />);
  await user.click(screen.getByRole('button', { name: /scan/i }));
  expect(spy).toHaveBeenCalledWith('scan');
});
```

- [ ] **Step 3.2: Run tests to confirm they fail**

```bash
cd web && npx vitest run src/ui/RepsViewSwitch.test.tsx
```
Expected: all 3 tests FAIL with "Cannot find module './RepsViewSwitch'"

- [ ] **Step 3.3: Create RepsViewSwitch component**

Create `web/src/ui/RepsViewSwitch.tsx`:

```tsx
import type { RepsViewMode } from './RepsView';

interface RepsViewSwitchProps {
  value: RepsViewMode;
  onChange: (mode: RepsViewMode) => void;
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M13 2.5l2.5 2.5-9 9L3 15l.5-3.5 9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 4.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BarcodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M1 4v10M4 4v10M7 4v10M10 4v10M13 4v10M16 4v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.5 4v10M8.5 4v10M11.5 4v10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const OPTIONS: Array<{ mode: RepsViewMode; label: string; Icon: () => JSX.Element }> = [
  { mode: 'grid', label: 'Grid', Icon: GridIcon },
  { mode: 'manual', label: 'Manual', Icon: PenIcon },
  { mode: 'scan', label: 'Scan', Icon: BarcodeIcon },
];

export function RepsViewSwitch({ value, onChange }: RepsViewSwitchProps) {
  return (
    <div className="reps-view-switch" role="group" aria-label="Reps view">
      {OPTIONS.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          className={`reps-view-btn${value === mode ? ' reps-view-active' : ''}`}
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
        >
          <Icon />
          <span className="reps-view-label">{label}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3.4: Run tests to confirm they pass**

```bash
cd web && npx vitest run src/ui/RepsViewSwitch.test.tsx
```
Expected: all 3 tests PASS.

- [ ] **Step 3.5: Update RepsViewMode type and RepsView**

In `web/src/ui/RepsView.tsx`:

1. Update `RepsViewMode`:
```tsx
export type RepsViewMode = 'grid' | 'manual' | 'scan';
```

2. Replace the existing `.reps-view-switch` JSX with the new component:
```tsx
import { RepsViewSwitch } from './RepsViewSwitch';
// Remove old reps-view-switch JSX block; replace with:
<RepsViewSwitch value={view} onSetView={onSetView} />
// (adjust prop names to match what RepsView passes)
```

Wait — `RepsView` uses `onSetView` but `RepsViewSwitch` uses `onChange`. Keep `RepsViewSwitch`'s prop `onChange` and adapt the call site:
```tsx
<RepsViewSwitch value={view} onChange={onSetView} />
```

3. In the content area, separate out the manual vs scan sections:

```tsx
{/* Grid view */}
{view === 'grid' && (
  <section aria-label="Reps grid view">
    <RepsModeToggle value={mode} onChange={onSetMode} />
    <RepsGrid counts={counts} onTap={onGridTap} />
  </section>
)}

{/* Manual input view */}
{view === 'manual' && (
  <section aria-label="Manual input">
    <ManualEntry ... />
    {/* collection list for manual entries */}
  </section>
)}

{/* Scan view */}
{view === 'scan' && (
  <section aria-label="Camera scan">
    {/* existing camera scan JSX */}
  </section>
)}
```

Read `web/src/ui/RepsView.tsx` fully before editing to ensure the existing JSX is correctly split. The camera-related JSX (video, DetectionResult, ScanStatus, etc.) stays in 'scan'; ManualEntry moves to 'manual'. CollectionList should show in both 'scan' and 'manual' views.

- [ ] **Step 3.6: Update App.tsx default repsView**

In `web/src/ui/App.tsx`, change the default:

```tsx
// Before:
const [repsView, setRepsView] = useState<RepsViewMode>('scan');
// After:
const [repsView, setRepsView] = useState<RepsViewMode>('grid');
```

- [ ] **Step 3.7: Update CSS for new icon-driven switch**

In `web/src/index.css`, update `.reps-view-switch` and `.reps-view-btn` styles:

```css
.reps-view-switch {
  display: flex;
  border: 1px solid var(--subtle);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: var(--space-3);
  background: var(--field);
}

.reps-view-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 56px;
  padding: var(--space-1) 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.reps-view-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.reps-view-btn.reps-view-active {
  background: var(--ink);
  color: white;
}
```

- [ ] **Step 3.8: Run all tests**

```bash
cd web && npx vitest run
```
Expected: all tests PASS.

- [ ] **Step 3.9: Commit**

```bash
git add web/src/ui/RepsViewSwitch.tsx web/src/ui/RepsViewSwitch.test.tsx web/src/ui/RepsView.tsx web/src/ui/App.tsx web/src/index.css
git commit -m "feat(ui): reps view switch with grid/manual/scan icon buttons"
```

---

## Task 4: TabBar Icon-Driven Navigation

**Goal:** Redesign the TabBar as an icon-driven segmented nav (icon on top, small label below), matching the Airbnb-style pattern already used in the Reps view switch. Add a Home tab that triggers `onGoHome`. Labels: Home, My Album, My Reps, Leaderboard (renaming Board). Icons: inline SVG.

**Files:**
- Modify: `web/src/ui/TabBar.tsx`
- Modify: `web/src/ui/App.tsx`
- Modify: `web/src/index.css`
- Test: `web/src/ui/TabBar.test.tsx` (new)

---

- [ ] **Step 4.1: Write failing tests**

Create `web/src/ui/TabBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabBar } from './TabBar';

test('renders Album and Reps tabs', () => {
  render(<TabBar active="album" onChange={() => {}} />);
  expect(screen.getByRole('tab', { name: /my album/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /my reps/i })).toBeInTheDocument();
});

test('board tab hidden when showBoard=false', () => {
  render(<TabBar active="album" onChange={() => {}} showBoard={false} />);
  expect(screen.queryByRole('tab', { name: /leaderboard/i })).not.toBeInTheDocument();
});

test('board tab shown as Leaderboard when showBoard=true', () => {
  render(<TabBar active="album" onChange={() => {}} showBoard />);
  expect(screen.getByRole('tab', { name: /leaderboard/i })).toBeInTheDocument();
});

test('home tab shown when onGoHome provided', () => {
  render(<TabBar active="album" onChange={() => {}} onGoHome={() => {}} />);
  expect(screen.getByRole('tab', { name: /home/i })).toBeInTheDocument();
});

test('home tab hidden when onGoHome not provided', () => {
  render(<TabBar active="album" onChange={() => {}} />);
  expect(screen.queryByRole('tab', { name: /home/i })).not.toBeInTheDocument();
});

test('active tab has aria-selected=true', () => {
  render(<TabBar active="reps" onChange={() => {}} />);
  expect(screen.getByRole('tab', { name: /my reps/i })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: /my album/i })).toHaveAttribute('aria-selected', 'false');
});

test('clicking a tab calls onChange', async () => {
  const user = userEvent.setup();
  const spy = vi.fn();
  render(<TabBar active="album" onChange={spy} />);
  await user.click(screen.getByRole('tab', { name: /my reps/i }));
  expect(spy).toHaveBeenCalledWith('reps');
});

test('clicking home calls onGoHome', async () => {
  const user = userEvent.setup();
  const spy = vi.fn();
  render(<TabBar active="album" onChange={() => {}} onGoHome={spy} />);
  await user.click(screen.getByRole('tab', { name: /home/i }));
  expect(spy).toHaveBeenCalled();
});
```

- [ ] **Step 4.2: Run tests to confirm they fail**

```bash
cd web && npx vitest run src/ui/TabBar.test.tsx
```
Expected: all 8 tests FAIL (TabBar doesn't match new API yet).

- [ ] **Step 4.3: Rewrite TabBar component**

Replace all content of `web/src/ui/TabBar.tsx`:

```tsx
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
  return (
    <nav aria-label="Primary sections" className="section-nav">
      <div role="tablist" className="tab-bar">
        {onGoHome && (
          <button
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
          role="tab"
          aria-selected={active === 'album'}
          className={`tab-bar-item${active === 'album' ? ' tab-active' : ''}`}
          onClick={() => onChange('album')}
        >
          <AlbumIcon />
          <span className="tab-bar-label">My Album</span>
        </button>
        <button
          role="tab"
          aria-selected={active === 'reps'}
          className={`tab-bar-item${active === 'reps' ? ' tab-active' : ''}`}
          onClick={() => onChange('reps')}
        >
          <RepsIcon />
          <span className="tab-bar-label">My Reps</span>
        </button>
        {showBoard && (
          <button
            role="tab"
            aria-selected={active === 'board'}
            className={`tab-bar-item${active === 'board' ? ' tab-active' : ''}`}
            onClick={() => onChange('board')}
          >
            <LeaderboardIcon />
            <span className="tab-bar-label">Leaderboard</span>
          </button>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4.4: Run tests to confirm they pass**

```bash
cd web && npx vitest run src/ui/TabBar.test.tsx
```
Expected: all 8 tests PASS.

- [ ] **Step 4.5: Wire onGoHome in App.tsx**

In `web/src/ui/App.tsx`, find the `<TabBar>` usage and pass `onGoHome`:

```tsx
// Existing: the "Home" button in app-header calls handleHome
// Find handleHome (it resets `active` to null and resets repsView)
// Pass it as onGoHome to TabBar:
<TabBar
  active={tab}
  onChange={setTab}
  showBoard={!!deps.fetchLeaderboard}
  onGoHome={handleHome}
/>
```

The `handleHome` function already exists in `App.tsx` — it's currently wired to the header home button. Now it also powers the Home tab.

- [ ] **Step 4.6: Update CSS for icon-driven tab bar**

In `web/src/index.css`, update the tab bar styles. Replace the existing `.tab-bar` and `.tab-active` rules:

```css
.tab-bar {
  display: flex;
  padding: var(--space-1);
  border: 1px solid var(--subtle);
  border-radius: var(--radius);
  background: var(--field);
  gap: var(--space-1);
}

.tab-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 52px;
  padding: var(--space-1) 0;
  border: 0;
  border-radius: calc(var(--radius) - 2px);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.tab-bar-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.tab-bar-item.tab-active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 6px 18px rgb(18 26 47 / 0.08);
}
```

- [ ] **Step 4.7: Run all tests**

```bash
cd web && npx vitest run
```
Expected: all tests PASS.

- [ ] **Step 4.8: Commit**

```bash
git add web/src/ui/TabBar.tsx web/src/ui/TabBar.test.tsx web/src/ui/App.tsx web/src/index.css
git commit -m "feat(ui): icon-driven tab bar with Home, My Album, My Reps, Leaderboard"
```

---

## Task 5: Board Cumulative Stats Chart

**Goal:** In the Board panel, add a Stats section showing a line chart of cumulative owned stickers per day, one line per session (user). X axis = date, Y axis = cumulative count. Chart built with plain SVG. Data loaded from `albumRepo.listByUser(userName)` for each session.

**Files:**
- Create: `web/src/ui/StatsChart.tsx`
- Modify: `web/src/ui/BoardPanel.tsx`
- Modify: `web/src/ui/App.tsx`
- Modify: `web/src/index.css`
- Test: `web/src/ui/StatsChart.test.tsx`

---

- [ ] **Step 5.1: Write failing tests for StatsChart**

Create `web/src/ui/StatsChart.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { StatsChart } from './StatsChart';
import type { SeriesData } from './StatsChart';

const series: SeriesData[] = [
  {
    name: 'alice',
    points: [
      { date: '2025-01-01', cumulative: 5 },
      { date: '2025-01-02', cumulative: 12 },
      { date: '2025-01-03', cumulative: 20 },
    ],
  },
  {
    name: 'bob',
    points: [
      { date: '2025-01-01', cumulative: 3 },
      { date: '2025-01-02', cumulative: 7 },
    ],
  },
];

test('renders an SVG chart', () => {
  const { container } = render(<StatsChart series={series} />);
  expect(container.querySelector('svg')).toBeInTheDocument();
});

test('renders a polyline per series', () => {
  const { container } = render(<StatsChart series={series} />);
  const polylines = container.querySelectorAll('polyline,path[data-series]');
  expect(polylines.length).toBe(2);
});

test('renders series names in legend', () => {
  render(<StatsChart series={series} />);
  expect(screen.getByText('alice')).toBeInTheDocument();
  expect(screen.getByText('bob')).toBeInTheDocument();
});

test('renders empty state when no series', () => {
  render(<StatsChart series={[]} />);
  expect(screen.getByText(/no data/i)).toBeInTheDocument();
});
```

- [ ] **Step 5.2: Run tests to confirm they fail**

```bash
cd web && npx vitest run src/ui/StatsChart.test.tsx
```
Expected: all 4 tests FAIL with "Cannot find module './StatsChart'"

- [ ] **Step 5.3: Create StatsChart component**

Create `web/src/ui/StatsChart.tsx`:

```tsx
export interface DataPoint {
  date: string;    // ISO date string: "2025-01-15"
  cumulative: number;
}

export interface SeriesData {
  name: string;
  points: DataPoint[];
}

interface StatsChartProps {
  series: SeriesData[];
}

const SERIES_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function StatsChart({ series }: StatsChartProps) {
  if (series.length === 0) {
    return <p className="stats-chart-empty">No data to display.</p>;
  }

  const W = 320;
  const H = 160;
  const PAD = { top: 8, right: 8, bottom: 28, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Collect all dates and values across all series
  const allDates = [...new Set(series.flatMap((s) => s.points.map((p) => p.date)))].sort();
  const maxVal = Math.max(...series.flatMap((s) => s.points.map((p) => p.cumulative)), 1);

  function xScale(date: string): number {
    const idx = allDates.indexOf(date);
    if (allDates.length === 1) return PAD.left + chartW / 2;
    return PAD.left + (idx / (allDates.length - 1)) * chartW;
  }

  function yScale(val: number): number {
    return PAD.top + chartH - (val / maxVal) * chartH;
  }

  // X axis tick labels (show at most 5)
  const tickStep = Math.max(1, Math.floor(allDates.length / 5));
  const xTicks = allDates.filter((_, i) => i % tickStep === 0 || i === allDates.length - 1);

  return (
    <div className="stats-chart">
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Cumulative owned stickers over time"
        role="img"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD.top + chartH * (1 - frac);
          return (
            <g key={frac}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + chartW}
                y2={y}
                stroke="var(--subtle)"
                strokeWidth="0.5"
              />
              <text x={PAD.left - 4} y={y + 4} fontSize="9" textAnchor="end" fill="var(--muted)">
                {Math.round(maxVal * frac)}
              </text>
            </g>
          );
        })}

        {/* X axis ticks */}
        {xTicks.map((d) => (
          <text
            key={d}
            x={xScale(d)}
            y={H - 4}
            fontSize="8"
            textAnchor="middle"
            fill="var(--muted)"
          >
            {d.slice(5)} {/* MM-DD */}
          </text>
        ))}

        {/* Series lines */}
        {series.map((s, idx) => {
          const pts = s.points
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((p) => `${xScale(p.date)},${yScale(p.cumulative)}`)
            .join(' ');
          return (
            <polyline
              key={s.name}
              data-series={s.name}
              points={pts}
              fill="none"
              stroke={SERIES_COLORS[idx % SERIES_COLORS.length]}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="stats-chart-legend">
        {series.map((s, idx) => (
          <span key={s.name} className="stats-chart-legend-item">
            <span
              className="stats-chart-legend-dot"
              style={{ background: SERIES_COLORS[idx % SERIES_COLORS.length] }}
            />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5.4: Run tests to confirm they pass**

```bash
cd web && npx vitest run src/ui/StatsChart.test.tsx
```
Expected: all 4 tests PASS.

- [ ] **Step 5.5: Add helper to build SeriesData from AlbumEntries**

Create a pure function (inside `StatsChart.tsx` or a separate util) to convert `AlbumEntry[]` → `DataPoint[]`:

```tsx
import type { AlbumEntry } from '../domain/types';
import type { DataPoint } from './StatsChart';

export function buildCumulativeSeries(entries: AlbumEntry[]): DataPoint[] {
  // Group by date (first 10 chars of ownedAt: "YYYY-MM-DD")
  const countByDay: Record<string, number> = {};
  for (const e of entries) {
    const day = e.ownedAt.slice(0, 10);
    countByDay[day] = (countByDay[day] ?? 0) + 1;
  }
  const sorted = Object.keys(countByDay).sort();
  let cumulative = 0;
  return sorted.map((date) => {
    cumulative += countByDay[date];
    return { date, cumulative };
  });
}
```

Add this to `web/src/ui/StatsChart.tsx`.

Add a test in `web/src/ui/StatsChart.test.tsx`:

```tsx
import { buildCumulativeSeries } from './StatsChart';
import type { AlbumEntry } from '../domain/types';

test('buildCumulativeSeries accumulates by day', () => {
  const entries: AlbumEntry[] = [
    { id: '1', userName: 'alice', normalizedCode: 'FWC1', ownedAt: '2025-01-01T10:00:00Z' },
    { id: '2', userName: 'alice', normalizedCode: 'FWC2', ownedAt: '2025-01-01T11:00:00Z' },
    { id: '3', userName: 'alice', normalizedCode: 'FWC3', ownedAt: '2025-01-02T09:00:00Z' },
  ];
  const result = buildCumulativeSeries(entries);
  expect(result).toEqual([
    { date: '2025-01-01', cumulative: 2 },
    { date: '2025-01-02', cumulative: 3 },
  ]);
});
```

Run:
```bash
cd web && npx vitest run src/ui/StatsChart.test.tsx
```
Expected: all 5 tests PASS.

- [ ] **Step 5.6: Update BoardPanel to accept and show stats**

Read `web/src/ui/BoardPanel.tsx` fully, then add a `statsSeries` prop:

```tsx
import { StatsChart } from './StatsChart';
import type { SeriesData } from './StatsChart';

interface BoardPanelProps {
  // ... existing props ...
  statsSeries?: SeriesData[];
}

export function BoardPanel({ ..., statsSeries }: BoardPanelProps) {
  // At the top of the leaderboard section (not inside the selection sub-panel):
  // Add a collapsible Stats section before the LeaderboardView:
  return (
    <>
      {selectionUserName ? (
        /* existing selection panel */
      ) : (
        <>
          {statsSeries && statsSeries.length > 0 && (
            <section aria-label="Stats" className="stats-section">
              <h2 className="stats-title">Progress</h2>
              <StatsChart series={statsSeries} />
            </section>
          )}
          <LeaderboardView ... />
        </>
      )}
    </>
  );
}
```

- [ ] **Step 5.7: Compute statsSeries in App.tsx and pass to BoardPanel**

In `web/src/ui/App.tsx`:

1. Add a `statsSeriesState` state:
```tsx
import { buildCumulativeSeries } from './StatsChart';
import type { SeriesData } from './StatsChart';

const [statsSeries, setStatsSeries] = useState<SeriesData[]>([]);
```

2. Compute stats when sessions change (in `refreshSessions` or in a dedicated `useEffect`):
```tsx
useEffect(() => {
  async function computeStats() {
    const result: SeriesData[] = [];
    for (const s of sessions) {
      const entries = await deps.albumRepo.listByUser(s.userName);
      if (entries.length > 0) {
        result.push({ name: s.userName, points: buildCumulativeSeries(entries) });
      }
    }
    setStatsSeries(result);
  }
  void computeStats();
}, [sessions, deps.albumRepo]);
```

3. Pass to `BoardPanel`:
```tsx
<BoardPanel
  entries={leaderboard}
  loading={leaderboardLoading}
  onRefresh={handleRefreshLeaderboard}
  selectionUserName={boardSelectionUserName}
  onOpenSelection={setBoardSelectionUserName}
  onCloseSelection={() => setBoardSelectionUserName(null)}
  statsSeries={statsSeries}
/>
```

- [ ] **Step 5.8: Add CSS for stats section**

Append to `web/src/index.css`:

```css
/* ── Stats Chart ─────────────────────────────────────────── */
.stats-section {
  margin-bottom: var(--space-4);
}

.stats-title {
  font-size: 14px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin: 0 0 var(--space-2);
}

.stats-chart {
  border: 1px solid var(--subtle);
  border-radius: var(--radius);
  background: var(--surface);
  padding: var(--space-3);
}

.stats-chart-empty {
  color: var(--muted);
  font-size: 13px;
  text-align: center;
  padding: var(--space-4);
}

.stats-chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.stats-chart-legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
}

.stats-chart-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

- [ ] **Step 5.9: Run all tests**

```bash
cd web && npx vitest run
```
Expected: all tests PASS.

- [ ] **Step 5.10: Commit**

```bash
git add web/src/ui/StatsChart.tsx web/src/ui/StatsChart.test.tsx web/src/ui/BoardPanel.tsx web/src/ui/App.tsx web/src/index.css
git commit -m "feat(ui): cumulative owned-stickers chart in board stats section"
```

---

## Task 6: Home Page Section Style Normalization

**Goal:** `SessionGate` renders several `<section>` elements (Resume, Create, Import, Account) with inconsistent styling — different padding, backgrounds, border treatments. Normalize them under shared CSS classes (`.home-section`, `.home-section-title`, `.home-card`) that mirror the `.team-card` pattern used elsewhere in the app.

**Files:**
- Modify: `web/src/ui/SessionGate.tsx`
- Modify: `web/src/index.css`
- Test: none needed (visual CSS normalization; existing rendering tests remain valid)

---

- [ ] **Step 6.1: Read SessionGate.tsx fully**

Read all of `web/src/ui/SessionGate.tsx` to catalog every section and its current CSS class usage before making any edits.

- [ ] **Step 6.2: Add normalized home-section CSS classes**

Append to `web/src/index.css`:

```css
/* ── Home / Session Gate ─────────────────────────────────── */
.home-section {
  margin-bottom: var(--space-5);
}

.home-section-title {
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin: 0 0 var(--space-2);
}

.home-card {
  border: 1px solid var(--subtle);
  border-radius: var(--radius);
  background: var(--surface);
  padding: var(--space-3);
  box-shadow: 0 8px 20px rgb(18 26 47 / 0.04);
}

.home-card + .home-card {
  margin-top: var(--space-2);
}

.home-card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
```

- [ ] **Step 6.3: Apply normalized classes in SessionGate**

In `web/src/ui/SessionGate.tsx`:

1. **Resume section** — The `<section aria-label="Resume">` with `<h2>Resume a session</h2>` and list of `.session-card` items:
   - Add `className="home-section"` to the `<section>`
   - Change `<h2>` to use `className="home-section-title"`
   - Wrap `<ul>` content remains as is (`.session-card` keeps its own styles)

2. **Create session form** — The form for creating a new session:
   - Wrap in `<div className="home-section">` if not already in a `<section>`
   - Add `<h2 className="home-section-title">Start a session</h2>` if missing
   - Wrap the form in `<div className="home-card">`

3. **Import section** — The backup/album-list import forms:
   - Wrap in `<section className="home-section" aria-label="Import">`
   - `<h2 className="home-section-title">Import</h2>`
   - Each import form in its own `<div className="home-card">`

4. **Account section** — The `.account-bar` section:
   - Add `home-section` alongside the existing class
   - `<h2 className="home-section-title">Account</h2>` if missing

The exact JSX edits depend on what you find when reading the file. Keep all existing `data-test-id` attributes and all existing form logic unchanged.

- [ ] **Step 6.4: Run all tests**

```bash
cd web && npx vitest run
```
Expected: all tests PASS (only CSS class names changed, not behavior).

- [ ] **Step 6.5: Commit**

```bash
git add web/src/ui/SessionGate.tsx web/src/index.css
git commit -m "fix(ui): normalize home page section card styles"
```

---

## Self-Review

### Spec Coverage Check

| Requirement | Task |
|---|---|
| Album/Reps group filter by album-group-header with reset | Task 1 |
| Search bar (lens icon) filtering team-card-name | Task 2 |
| Reps view switch: Grid, Manual, Scan with icons, Grid default | Task 3 |
| TabBar: home/album/reps/leaderboard with icons + small text | Task 4 |
| Board cumulative owned-stickers graph by day | Task 5 |
| Home page section style normalization | Task 6 |

All 6 requirements have dedicated tasks. ✓

### Placeholder Scan

- Task 3 Step 3.5 says "Read `RepsView.tsx` fully before editing" — this is intentional guidance to handle the complex split of scan vs manual JSX, not a deferral. ✓
- Task 4 Step 4.5 references `handleHome` — this function exists in `App.tsx` (it's the header home button handler). ✓
- Task 6 Step 6.3 says "The exact JSX edits depend on what you find when reading the file" — intentional because SessionGate is large and the structure must be verified before editing. ✓

### Type Consistency

- `RepsViewMode = 'grid' | 'manual' | 'scan'` defined in `RepsView.tsx` and used in `RepsViewSwitch.tsx` (imported from `RepsView.tsx`). ✓
- `SeriesData` and `DataPoint` defined in `StatsChart.tsx` and imported by `BoardPanel.tsx` and `App.tsx`. ✓
- `CommandBar` props (`groups`, `activeGroups`, `onToggleGroup`, `onClearFilter`, `searchQuery?`, `onSearchChange?`) consistent across Tasks 1 and 2. ✓
- `AlbumGroupedGrid` props (`groupFilter?`, `searchQuery?`) added incrementally in Tasks 1 and 2. ✓
