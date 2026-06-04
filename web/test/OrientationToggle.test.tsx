import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrientationToggle } from '../src/ui/OrientationToggle';

describe('OrientationToggle', () => {
  it('marks the active orientation with active class and aria-pressed', () => {
    render(<OrientationToggle value="portrait" onChange={vi.fn()} />);
    const portrait = screen.getByRole('button', { name: /portrait/i });
    const landscape = screen.getByRole('button', { name: /landscape/i });
    expect(portrait).toHaveClass('active');
    expect(portrait).toHaveAttribute('aria-pressed', 'true');
    expect(landscape).not.toHaveClass('active');
    expect(landscape).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange when the inactive option is clicked', async () => {
    const onChange = vi.fn();
    render(<OrientationToggle value="portrait" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /landscape/i }));
    expect(onChange).toHaveBeenCalledWith('landscape');
  });

  it('does not call onChange when the active option is clicked', async () => {
    const onChange = vi.fn();
    render(<OrientationToggle value="portrait" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /portrait/i }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
