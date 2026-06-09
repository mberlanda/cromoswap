import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionGate } from '../src/ui/SessionGate';
import type { Session } from '../src/domain/types';
import type { AuthClient, TokenClaims } from '../src/auth/auth';

const existing: Session = {
  id: 'sess-1',
  userName: 'Mauro',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

function makeAuth(user: TokenClaims | null, over: Partial<AuthClient> = {}): AuthClient {
  return {
    register: vi.fn(),
    login: vi.fn(),
    changePassword: vi.fn(async () => undefined),
    currentUser: vi.fn(() => user),
    logout: vi.fn(),
    ...over,
  };
}

describe('SessionGate', () => {
  it('creates a session with the entered name', async () => {
    const onCreate = vi.fn();
    render(<SessionGate sessions={[]} onCreate={onCreate} onResume={vi.fn()} />);

    const button = screen.getByRole('button', { name: /start/i });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/your name/i), 'Mauro');
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onCreate).toHaveBeenCalledWith('Mauro');
  });

  it('shows a leaderboard tab only when onOpenBoard is provided', async () => {
    const onOpenBoard = vi.fn();
    const { rerender } = render(
      <SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} />,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /leaderboard/i })).not.toBeInTheDocument();

    rerender(
      <SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} onOpenBoard={onOpenBoard} />,
    );
    await userEvent.click(screen.getByRole('tab', { name: /leaderboard/i }));
    expect(onOpenBoard).toHaveBeenCalled();
  });

  it('opens the navigation menu and navigates to leaderboard', async () => {
    const onOpenBoard = vi.fn();
    render(<SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} onOpenBoard={onOpenBoard} />);

    await userEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: /leaderboard/i }));

    expect(onOpenBoard).toHaveBeenCalled();
  });

  it('lets the user resume an existing session', async () => {
    const onResume = vi.fn();
    render(<SessionGate sessions={[existing]} onCreate={vi.fn()} onResume={onResume} />);
    await userEvent.click(screen.getByRole('button', { name: /^resume$/i }));
    expect(onResume).toHaveBeenCalledWith('sess-1');
  });

  it('does not show a resume section when there are no sessions', () => {
    render(<SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} />);
    expect(screen.queryByText(/resume/i)).not.toBeInTheDocument();
  });

  it('shows scan count on each resume card', () => {
    render(
      <SessionGate
        sessions={[existing]}
        onCreate={vi.fn()}
        onResume={vi.fn()}
        scanCounts={{ 'sess-1': 12 }}
      />,
    );
    expect(screen.getByText(/12 scans/i)).toBeInTheDocument();
  });

  it('shows owned and missing sticker counts when albumCounts provided', () => {
    render(
      <SessionGate
        sessions={[existing]}
        onCreate={vi.fn()}
        onResume={vi.fn()}
        albumCounts={{ 'sess-1': { owned: 45, missing: 935 } }}
      />,
    );
    expect(screen.getByText(/45 owned/i)).toBeInTheDocument();
    expect(screen.getByText(/935 missing/i)).toBeInTheDocument();
  });

  it('omits owned/missing when albumCounts not provided', () => {
    render(<SessionGate sessions={[existing]} onCreate={vi.fn()} onResume={vi.fn()} />);
    expect(screen.queryByText(/owned/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/missing/i)).not.toBeInTheDocument();
  });

  it('shows an alert when an imported JSON backup is malformed', async () => {
    render(
      <SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} onImportJson={vi.fn()} />,
    );
    const file = new File(['definitely not json'], 'backup.json', { type: 'application/json' });
    await userEvent.upload(screen.getByLabelText(/restore a full backup/i), file);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('imports an owned list and reports the result', async () => {
    const onImportAlbum = vi.fn();
    render(
      <SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} onImportAlbum={onImportAlbum} />,
    );
    await userEvent.type(screen.getByLabelText(/collector name/i), 'Mauro');
    const file = new File(['ARG01, BRA05'], 'list.txt', { type: 'text/plain' });
    await userEvent.upload(screen.getByLabelText(/choose a .txt/i), file);

    expect(onImportAlbum).toHaveBeenCalledWith({ userName: 'Mauro', ownedCodes: ['ARG01', 'BRA05'] });
    expect(await screen.findByText(/imported 2 owned/i)).toBeInTheDocument();
  });

  it('requires a collector name before importing a list', async () => {
    render(
      <SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} onImportAlbum={vi.fn()} />,
    );
    const file = new File(['ARG01'], 'list.txt', { type: 'text/plain' });
    await userEvent.upload(screen.getByLabelText(/choose a .txt/i), file);
    expect(await screen.findByRole('alert')).toHaveTextContent(/collector name/i);
  });

  it('shows the local vs cloud privacy note based on storage mode', () => {
    const { rerender } = render(
      <SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} storageMode="local" onChangeMode={vi.fn()} />,
    );
    expect(screen.getByText(/stored locally on this device/i)).toBeInTheDocument();

    rerender(
      <SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} storageMode="cloud" onChangeMode={vi.fn()} />,
    );
    expect(screen.getByText(/synced to the server/i)).toBeInTheDocument();
  });

  describe('cloud auth', () => {
    it('shows the auth panel (not the name form) when logged out in cloud mode', () => {
      render(
        <SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} auth={makeAuth(null)} onAuthenticated={vi.fn()} />,
      );
      expect(screen.getByRole('tab', { name: 'Register' })).toBeInTheDocument();
      expect(screen.queryByLabelText(/your name/i)).not.toBeInTheDocument();
    });

    it('still lets a logged-out user browse the board', async () => {
      const onOpenBoard = vi.fn();
      render(
        <SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} auth={makeAuth(null)} onOpenBoard={onOpenBoard} />,
      );
      await userEvent.click(screen.getByRole('tab', { name: /leaderboard/i }));
      expect(onOpenBoard).toHaveBeenCalled();
    });

    it('shows the account bar and logs out when authenticated', async () => {
      const onLogout = vi.fn();
      const auth = makeAuth({ userId: 'u1', exp: 9999999999 });
      render(
        <SessionGate sessions={[existing]} onCreate={vi.fn()} onResume={vi.fn()} auth={auth} onLogout={onLogout} />,
      );
      // name form hidden, resume still available
      expect(screen.queryByLabelText(/your name/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^resume$/i })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /log out/i }));
      expect(onLogout).toHaveBeenCalled();
    });

    it('falls back to auth.logout() when no onLogout is provided', async () => {
      const auth = makeAuth({ userId: 'u1', exp: 9999999999 });
      render(<SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} auth={auth} />);
      await userEvent.click(screen.getByRole('button', { name: /log out/i }));
      expect(auth.logout).toHaveBeenCalled();
    });

    it('toggles the password-change form and submits via the auth client', async () => {
      const auth = makeAuth({ userId: 'u1', exp: 9999999999 });
      render(<SessionGate sessions={[]} onCreate={vi.fn()} onResume={vi.fn()} auth={auth} />);

      // Toggle reads "Change password"; after opening it becomes "Hide password
      // form", so the only remaining "Change password" button is the submit.
      await userEvent.click(screen.getByRole('button', { name: 'Change password' }));
      await userEvent.type(screen.getByLabelText('Current password'), 'oldpassword');
      await userEvent.type(screen.getByLabelText('New password'), 'brandnew123');
      await userEvent.click(screen.getByRole('button', { name: 'Change password' }));

      expect(auth.changePassword).toHaveBeenCalledWith('oldpassword', 'brandnew123');
    });
  });
});
