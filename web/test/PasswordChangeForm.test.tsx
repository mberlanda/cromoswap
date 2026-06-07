import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordChangeForm } from '../src/ui/PasswordChangeForm';

const current = () => screen.getByLabelText('Current password');
const next = () => screen.getByLabelText('New password');
const submit = () => screen.getByRole('button', { name: /change password/i });

describe('PasswordChangeForm', () => {
  it('submits current + new password and shows success', async () => {
    const onSubmit = vi.fn(async () => undefined);
    render(<PasswordChangeForm onSubmit={onSubmit} />);

    await userEvent.type(current(), 'oldpassword');
    await userEvent.type(next(), 'brandnew123');
    await userEvent.click(submit());

    expect(onSubmit).toHaveBeenCalledWith('oldpassword', 'brandnew123');
    expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
  });

  it('keeps submit disabled until the new password is 8+ chars', async () => {
    render(<PasswordChangeForm onSubmit={vi.fn()} />);
    await userEvent.type(current(), 'oldpassword');
    await userEvent.type(next(), 'short');
    expect(submit()).toBeDisabled();
    await userEvent.type(next(), '123');
    expect(submit()).toBeEnabled();
  });

  it('shows the server error on failure', async () => {
    const onSubmit = vi.fn(async () => { throw new Error('current password is incorrect'); });
    render(<PasswordChangeForm onSubmit={onSubmit} />);
    await userEvent.type(current(), 'wrong');
    await userEvent.type(next(), 'brandnew123');
    await userEvent.click(submit());
    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect/);
  });
});
