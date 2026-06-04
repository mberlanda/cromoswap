import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualEntry } from '../src/ui/ManualEntry';

describe('ManualEntry', () => {
  it('disables submit until a valid code is entered', async () => {
    const onAdd = vi.fn();
    render(<ManualEntry onAdd={onAdd} />);
    const submit = screen.getByRole('button', { name: /add/i });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/code/i), 'ZZZ99');
    expect(submit).toBeDisabled();
    expect(screen.getByText(/invalid code/i)).toBeInTheDocument();
  });

  it('adds a normalized code and clears the field', async () => {
    const onAdd = vi.fn();
    render(<ManualEntry onAdd={onAdd} />);
    const input = screen.getByLabelText(/code/i);

    await userEvent.type(input, 'arg 1');
    const submit = screen.getByRole('button', { name: /add/i });
    expect(submit).toBeEnabled();
    await userEvent.click(submit);

    expect(onAdd).toHaveBeenCalledWith('ARG01');
    expect(input).toHaveValue('');
  });
});
