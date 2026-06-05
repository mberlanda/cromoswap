import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabBar } from '../src/ui/TabBar';

describe('TabBar', () => {
  it('hides the Board tab by default and shows Album + Reps', () => {
    render(<TabBar active="reps" onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /my album/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /my reps/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /board/i })).not.toBeInTheDocument();
  });

  it('shows the Board tab when enabled', () => {
    render(<TabBar active="reps" onChange={vi.fn()} showBoard />);
    expect(screen.getByRole('tab', { name: /board/i })).toBeInTheDocument();
  });

  it('marks the active tab as selected', () => {
    render(<TabBar active="album" onChange={vi.fn()} showBoard />);
    expect(screen.getByRole('tab', { name: /my album/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /my reps/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('reports the clicked tab', async () => {
    const onChange = vi.fn();
    render(<TabBar active="reps" onChange={onChange} showBoard />);
    await userEvent.click(screen.getByRole('tab', { name: /my album/i }));
    expect(onChange).toHaveBeenCalledWith('album');
    await userEvent.click(screen.getByRole('tab', { name: /my reps/i }));
    expect(onChange).toHaveBeenCalledWith('reps');
    await userEvent.click(screen.getByRole('tab', { name: /board/i }));
    expect(onChange).toHaveBeenCalledWith('board');
  });
});
