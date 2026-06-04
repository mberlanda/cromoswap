import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualEntry } from '../src/ui/ManualEntry';

describe('ManualEntry', () => {
  it('adds a valid code from prefix + number and clears fields', async () => {
    const onAdd = vi.fn();
    render(<ManualEntry onAdd={onAdd} />);
    await userEvent.type(screen.getByLabelText(/prefix/i), 'ARG');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAdd).toHaveBeenCalledWith('ARG01');
  });

  it('disables add until a valid prefix is entered', async () => {
    render(<ManualEntry onAdd={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/prefix/i), 'ZZZ');
    expect(screen.getByRole('button', { name: /add/i })).toBeDisabled();
    expect(screen.getByText(/invalid/i)).toBeInTheDocument();
  });

  it('auto-uppercases the prefix', async () => {
    render(<ManualEntry onAdd={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/prefix/i), 'arg');
    expect(screen.getByLabelText(/prefix/i)).toHaveValue('ARG');
  });

  it('shows recent prefix chips and clicking one sets the prefix', async () => {
    const onAdd = vi.fn();
    render(<ManualEntry onAdd={onAdd} recentPrefixes={['BRA', 'ARG']} />);
    const braChip = screen.getByRole('button', { name: 'BRA' });
    await userEvent.click(braChip);
    expect(screen.getByLabelText(/prefix/i)).toHaveValue('BRA');
  });

  it('shows no recent chips when recentPrefixes is empty', () => {
    render(<ManualEntry onAdd={vi.fn()} recentPrefixes={[]} />);
    expect(screen.queryByLabelText(/recent/i)).not.toBeInTheDocument();
  });

  it('FWC prefix shows 00 as the first number option', async () => {
    render(<ManualEntry onAdd={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/prefix/i), 'FWC');
    const select = screen.getByLabelText(/number/i);
    expect((select as HTMLSelectElement).options[0].value).toBe('00');
  });
});
