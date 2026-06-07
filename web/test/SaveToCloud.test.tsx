import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveToCloud } from '../src/ui/SaveToCloud';
import type { CloudSaver } from '../src/storage/save-to-cloud';
import type { AuthResponse } from '../src/auth/auth';
import type { Scan, Session } from '../src/domain/types';

const session: Session = {
  id: 'local-1',
  userName: 'Mauro',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

const scans: Scan[] = [
  {
    id: 'scan-1',
    sessionId: 'local-1',
    normalizedCode: 'ARG01',
    source: 'ocr',
    confidence: 0.9,
    capturedAt: '2026-06-04T00:00:00.000Z',
    createdAt: '2026-06-04T00:00:00.000Z',
    updatedAt: '2026-06-04T00:00:00.000Z',
  },
];

const response: AuthResponse = {
  token: 't',
  user: { id: 'u1', username: 'mauro' },
  session: { id: 'cloud-1', userName: 'mauro' },
};

function makeSaver(over: Partial<CloudSaver> = {}): CloudSaver {
  return {
    auth: {
      register: vi.fn(async () => response),
      login: vi.fn(async () => response),
      changePassword: vi.fn(),
      currentUser: vi.fn(() => null),
      logout: vi.fn(),
    },
    upload: vi.fn(async () => ({ ok: true })),
    ...over,
  };
}

describe('SaveToCloud', () => {
  const snapshot = { session, scans, ownedCodes: ['ARG01', 'BRA07'] };
  const resolveSnapshot = () => Promise.resolve(snapshot);

  it('reveals the auth panel when the save button is clicked', async () => {
    render(<SaveToCloud saver={makeSaver()} resolveSnapshot={resolveSnapshot} />);
    expect(screen.queryByRole('tab', { name: 'Register' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /save to cloud/i }));
    expect(screen.getByRole('tab', { name: 'Register' })).toBeInTheDocument();
  });

  it('uploads the resolved snapshot after authenticating and reports success', async () => {
    const saver = makeSaver();
    render(<SaveToCloud saver={saver} resolveSnapshot={resolveSnapshot} />);

    await userEvent.click(screen.getByRole('button', { name: /save to cloud/i }));
    await userEvent.type(screen.getByLabelText('Username'), 'mauro');
    await userEvent.type(screen.getByLabelText('Password'), 'supersecret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(saver.upload).toHaveBeenCalledWith(session, scans, ['ARG01', 'BRA07'], 'mauro');
    expect(await screen.findByText(/saved to the cloud/i)).toBeInTheDocument();
  });

  it('shows an error when the upload fails', async () => {
    const saver = makeSaver({ upload: vi.fn(async () => ({ ok: false })) });
    render(<SaveToCloud saver={saver} resolveSnapshot={resolveSnapshot} />);

    await userEvent.click(screen.getByRole('button', { name: /save to cloud/i }));
    await userEvent.type(screen.getByLabelText('Username'), 'mauro');
    await userEvent.type(screen.getByLabelText('Password'), 'supersecret');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.?t save/i);
  });
});
