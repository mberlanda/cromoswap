import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CameraPermissionPanel } from '../src/ui/CameraPermissionPanel';

describe('CameraPermissionPanel', () => {
  it('idle state: shows explanation and Allow camera + Enter manually buttons', () => {
    render(<CameraPermissionPanel state="idle" onRequest={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByRole('button', { name: /allow camera/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter manually/i })).toBeInTheDocument();
    expect(screen.queryByText(/blocked/i)).not.toBeInTheDocument();
  });

  it('idle state: clicking Allow camera calls onRequest', async () => {
    const onRequest = vi.fn();
    render(<CameraPermissionPanel state="idle" onRequest={onRequest} onSkip={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /allow camera/i }));
    expect(onRequest).toHaveBeenCalledOnce();
  });

  it('idle state: clicking Enter manually calls onSkip', async () => {
    const onSkip = vi.fn();
    render(<CameraPermissionPanel state="idle" onRequest={vi.fn()} onSkip={onSkip} />);
    await userEvent.click(screen.getByRole('button', { name: /enter manually/i }));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('denied state: shows blocked message and Enter manually only', () => {
    render(<CameraPermissionPanel state="denied" onRequest={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/blocked/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /allow camera/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter manually/i })).toBeInTheDocument();
  });

  it('no-camera state: shows no camera message and Enter manually only', () => {
    render(<CameraPermissionPanel state="no-camera" onRequest={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/no camera/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /allow camera/i })).not.toBeInTheDocument();
  });

  it('error state: shows no camera message', () => {
    render(<CameraPermissionPanel state="error" onRequest={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/no camera/i)).toBeInTheDocument();
  });
});
