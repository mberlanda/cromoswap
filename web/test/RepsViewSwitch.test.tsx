import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RepsViewSwitch } from '../src/ui/RepsViewSwitch';

describe('RepsViewSwitch', () => {
  test('renders three options: Grid, Manual, Scan', () => {
    render(<RepsViewSwitch value="grid" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /grid/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manual/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan/i })).toBeInTheDocument();
  });

  test('active option has aria-pressed=true, others false', () => {
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

  test('clicking Manual calls onChange with manual', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<RepsViewSwitch value="grid" onChange={spy} />);
    await user.click(screen.getByRole('button', { name: /manual/i }));
    expect(spy).toHaveBeenCalledWith('manual');
  });
});
