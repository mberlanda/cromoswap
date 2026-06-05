import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeaderboardView } from '../src/ui/LeaderboardView';
import type { LeaderboardEntry } from '../src/storage/sync-client';

const entries: LeaderboardEntry[] = [
  { userName: 'Mauro', owned: 45, missing: 935 },
  { userName: 'Alice', owned: 30, missing: 950 },
];

describe('LeaderboardView', () => {
  it('renders ranked entries with owned and missing counts', () => {
    render(<LeaderboardView entries={entries} loading={false} onRefresh={vi.fn()} />);
    expect(screen.getByText('#1')).toBeDefined();
    expect(screen.getByText('Mauro')).toBeDefined();
    expect(screen.getByText('45 owned')).toBeDefined();
    expect(screen.getByText('935 missing')).toBeDefined();
    expect(screen.getByText('#2')).toBeDefined();
    expect(screen.getByText('Alice')).toBeDefined();
  });

  it('shows empty state when no entries and not loading', () => {
    render(<LeaderboardView entries={[]} loading={false} onRefresh={vi.fn()} />);
    expect(screen.getByText(/No data yet/)).toBeDefined();
  });

  it('hides empty state when loading', () => {
    render(<LeaderboardView entries={[]} loading={true} onRefresh={vi.fn()} />);
    expect(screen.queryByText(/No data yet/)).toBeNull();
  });

  it('calls onRefresh when Refresh button is clicked', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(<LeaderboardView entries={[]} loading={false} onRefresh={onRefresh} />);
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('disables Refresh button while loading', () => {
    render(<LeaderboardView entries={[]} loading={true} onRefresh={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Loading…' })).toHaveProperty('disabled', true);
  });

  it('renders aria label on the ranking list', () => {
    render(<LeaderboardView entries={entries} loading={false} onRefresh={vi.fn()} />);
    expect(screen.getByRole('list', { name: 'Ranking' })).toBeDefined();
  });

  it('opens a collector selection from a leaderboard row', async () => {
    const onOpenSelection = vi.fn();
    render(
      <LeaderboardView
        entries={entries}
        loading={false}
        onRefresh={vi.fn()}
        onOpenSelection={onOpenSelection}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /open mauro selection/i }));

    expect(onOpenSelection).toHaveBeenCalledWith('Mauro');
  });
});
