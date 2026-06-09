import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabBar } from '../src/ui/TabBar';

describe('TabBar', () => {
  it('hides the Board tab by default and shows Album + Stickers', () => {
    render(<TabBar active="reps" onChange={vi.fn()} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /my album/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /my stickers/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /leaderboard/i })).not.toBeInTheDocument();
  });

  it('shows the Leaderboard tab when showBoard=true', () => {
    render(<TabBar active="reps" onChange={vi.fn()} showBoard />);
    expect(screen.getByRole('tab', { name: /leaderboard/i })).toBeInTheDocument();
  });

  it('shows the Home tab when onGoHome is provided', () => {
    render(<TabBar active="album" onChange={vi.fn()} onGoHome={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /home/i })).toBeInTheDocument();
  });

  it('hides the Home tab when onGoHome is not provided', () => {
    render(<TabBar active="album" onChange={vi.fn()} />);
    expect(screen.queryByRole('tab', { name: /home/i })).not.toBeInTheDocument();
  });

  it('marks the active tab as selected', () => {
    render(<TabBar active="album" onChange={vi.fn()} showBoard />);
    expect(screen.getByRole('tab', { name: /my album/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /my stickers/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('reports the clicked tab', async () => {
    const onChange = vi.fn();
    render(<TabBar active="reps" onChange={onChange} showBoard />);
    await userEvent.click(screen.getByRole('tab', { name: /my album/i }));
    expect(onChange).toHaveBeenCalledWith('album');
    await userEvent.click(screen.getByRole('tab', { name: /my stickers/i }));
    expect(onChange).toHaveBeenCalledWith('reps');
    await userEvent.click(screen.getByRole('tab', { name: /leaderboard/i }));
    expect(onChange).toHaveBeenCalledWith('board');
  });

  it('calls onGoHome when Home tab is clicked', async () => {
    const spy = vi.fn();
    render(<TabBar active="album" onChange={vi.fn()} onGoHome={spy} />);
    await userEvent.click(screen.getByRole('tab', { name: /home/i }));
    expect(spy).toHaveBeenCalled();
  });

  it('does not render the navigation menu button (it lives in app-header)', () => {
    render(<TabBar active="reps" onChange={vi.fn()} showBoard onGoHome={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /open navigation menu/i })).not.toBeInTheDocument();
  });
});
