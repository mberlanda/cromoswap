import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SyncIndicator } from '../src/ui/SyncIndicator';

describe('SyncIndicator', () => {
  it('shows "Local only" when status is local', () => {
    render(<SyncIndicator status="local" />);
    expect(screen.getByText(/local only/i)).toBeInTheDocument();
  });

  it('shows "Syncing…" when status is pending', () => {
    render(<SyncIndicator status="pending" />);
    expect(screen.getByText(/syncing/i)).toBeInTheDocument();
  });

  it('renders nothing when status is synced', () => {
    const { container } = render(<SyncIndicator status="synced" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows "Sync failed" with a retry button when status is failed', async () => {
    const onRetry = vi.fn();
    render(<SyncIndicator status="failed" onRetry={onRetry} />);
    expect(screen.getByText(/sync failed/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows "Sync failed" without retry button when onRetry is not provided', () => {
    render(<SyncIndicator status="failed" />);
    expect(screen.getByText(/sync failed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });
});
