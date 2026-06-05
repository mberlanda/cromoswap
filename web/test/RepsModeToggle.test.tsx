import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RepsModeToggle } from '../src/ui/RepsModeToggle';
import type { RepsMode } from '../src/ui/RepsModeToggle';

describe('RepsModeToggle', () => {
  it('marks the active mode pressed', () => {
    render(<RepsModeToggle value="add" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /got one/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /give away/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('emits the chosen mode on click', async () => {
    const onChange = vi.fn<(m: RepsMode) => void>();
    render(<RepsModeToggle value="add" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /give away/i }));
    expect(onChange).toHaveBeenCalledWith('remove');
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith('clear');
  });
});
