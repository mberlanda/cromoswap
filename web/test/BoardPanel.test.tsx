import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardPanel } from '../src/ui/BoardPanel';
import { MemoryAlbumRepo } from '../src/storage/memory-repos';

const now = () => '2026-06-06T00:00:00.000Z';
const ids = () => 'id-1';
const entries = [{ userName: 'Mauro', owned: 5, missing: 975 }];

function baseProps(overrides = {}) {
  return {
    entries,
    loading: false,
    onRefresh: vi.fn(),
    selectionUserName: null as string | null,
    onOpenSelection: vi.fn(),
    onCloseSelection: vi.fn(),
    albumRepo: new MemoryAlbumRepo(ids, now),
    downloadText: vi.fn(),
    now,
    ...overrides,
  };
}

describe('BoardPanel', () => {
  it('shows the leaderboard when no collector is selected', () => {
    render(<BoardPanel {...baseProps()} />);
    expect(screen.getByText('Mauro')).toBeInTheDocument();
  });

  it('opens a collector selection on click', async () => {
    const onOpenSelection = vi.fn();
    render(<BoardPanel {...baseProps({ onOpenSelection })} />);
    await userEvent.click(screen.getByRole('button', { name: /open mauro selection/i }));
    expect(onOpenSelection).toHaveBeenCalledWith('Mauro');
  });

  it('renders the read-only selection with a link to the admin backoffice', async () => {
    render(<BoardPanel {...baseProps({ selectionUserName: 'Mauro' })} />);
    expect(screen.getByText(/Mauro's selection/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /admin backoffice/i });
    expect(link).toHaveAttribute('href', '/admin');
  });
});
