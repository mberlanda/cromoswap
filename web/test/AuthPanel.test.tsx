import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthPanel } from '../src/ui/AuthPanel';
import type { AuthClient, AuthResponse } from '../src/auth/auth';

function makeAuth(over: Partial<AuthClient> = {}): AuthClient {
  return {
    register: vi.fn(),
    login: vi.fn(),
    changePassword: vi.fn(),
    currentUser: vi.fn(() => null),
    logout: vi.fn(),
    ...over,
  };
}

const response: AuthResponse = {
  token: 't',
  user: { id: 'u1', username: 'mauro' },
  session: { id: 's1', userName: 'mauro' },
};

const username = () => screen.getByLabelText('Username');
const password = () => screen.getByLabelText('Password');

describe('AuthPanel', () => {
  it('defaults to the Log in tab and logs in', async () => {
    const login = vi.fn(async () => response);
    const onAuthenticated = vi.fn();
    render(<AuthPanel auth={makeAuth({ login })} onAuthenticated={onAuthenticated} />);

    await userEvent.type(username(), 'mauro');
    await userEvent.type(password(), 'supersecret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(login).toHaveBeenCalledWith('mauro', 'supersecret');
    expect(onAuthenticated).toHaveBeenCalledWith(response);
  });

  it('registers on the Register tab', async () => {
    const registerFn = vi.fn(async () => response);
    const onAuthenticated = vi.fn();
    render(<AuthPanel auth={makeAuth({ register: registerFn })} onAuthenticated={onAuthenticated} />);

    await userEvent.click(screen.getByRole('tab', { name: 'Register' }));
    await userEvent.type(username(), 'mauro');
    await userEvent.type(password(), 'supersecret');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(registerFn).toHaveBeenCalledWith('mauro', 'supersecret');
    expect(onAuthenticated).toHaveBeenCalledWith(response);
  });

  it('filters the username to lowercase alphanumeric as you type', async () => {
    render(<AuthPanel auth={makeAuth()} onAuthenticated={vi.fn()} />);
    await userEvent.type(username(), 'Ma u_ro!9');
    expect(username()).toHaveValue('mauro9');
  });

  it('keeps submit disabled until username ≥3 and password ≥8', async () => {
    render(<AuthPanel auth={makeAuth()} onAuthenticated={vi.fn()} />);
    const submit = () => screen.getByRole('button', { name: 'Log in' });
    expect(submit()).toBeDisabled();
    await userEvent.type(username(), 'ma');
    await userEvent.type(password(), 'short12');
    expect(submit()).toBeDisabled();
    await userEvent.type(username(), 'uro');
    await userEvent.type(password(), '8');
    expect(submit()).toBeEnabled();
  });

  it('shows the server error message on failure', async () => {
    const login = vi.fn(async () => { throw new Error('invalid credentials'); });
    render(<AuthPanel auth={makeAuth({ login })} onAuthenticated={vi.fn()} />);
    await userEvent.type(username(), 'mauro');
    await userEvent.type(password(), 'supersecret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials/);
  });
});
