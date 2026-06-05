import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionGate } from '../src/ui/SessionGate';
import type { Session } from '../src/domain/types';

const existing: Session = {
  id: 'sess-1',
  userName: 'Mauro',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

describe('SessionGate', () => {
  it('creates a session with the entered name', async () => {
    const onCreate = vi.fn();
    render(<SessionGate sessions={[]} onCreate={onCreate} onResume={vi.fn()} />);

    const button = screen.getByRole('button', { name: /start/i });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/name/i), 'Mauro');
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onCreate).toHaveBeenCalledWith('Mauro');
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
});
