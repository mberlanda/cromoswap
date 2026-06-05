import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StorageModeToggle } from '../src/ui/StorageModeToggle';

describe('StorageModeToggle', () => {
  it('marks the active mode as checked', () => {
    render(<StorageModeToggle mode="local" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Local' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Cloud' })).toHaveAttribute('aria-checked', 'false');
  });

  it('reflects the active class on the selected button', () => {
    render(<StorageModeToggle mode="cloud" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Cloud' }).className).toContain('active');
    expect(screen.getByRole('radio', { name: 'Local' }).className).not.toContain('active');
  });

  it('reports the chosen mode on click', async () => {
    const onChange = vi.fn();
    render(<StorageModeToggle mode="cloud" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Local' }));
    expect(onChange).toHaveBeenCalledWith('local');
    await userEvent.click(screen.getByRole('radio', { name: 'Cloud' }));
    expect(onChange).toHaveBeenCalledWith('cloud');
  });
});
