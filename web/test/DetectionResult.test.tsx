import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DetectionResult } from '../src/ui/DetectionResult';

const candidate = { code: { prefix: 'ARG', number: 1, canonical: 'ARG01' }, confidence: 0.83 };

describe('DetectionResult', () => {
  it('shows the proposed code, confidence, and thumbnail', () => {
    render(
      <DetectionResult
        candidate={candidate}
        imageDataUrl="data:image/png;base64,AAAA"
        onConfirm={vi.fn()}
        onCorrect={vi.fn()}
        onSkip={vi.fn()}
        onRescan={vi.fn()}
      />,
    );
    expect(screen.getByText('ARG01')).toBeInTheDocument();
    expect(screen.getByText(/83%/)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,AAAA');
  });

  it('calls onConfirm with the canonical code', async () => {
    const onConfirm = vi.fn();
    render(
      <DetectionResult
        candidate={candidate}
        imageDataUrl="data:image/png;base64,AAAA"
        onConfirm={onConfirm}
        onCorrect={vi.fn()}
        onSkip={vi.fn()}
        onRescan={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledWith('ARG01');
  });

  it('wires skip and rescan actions', async () => {
    const onSkip = vi.fn();
    const onRescan = vi.fn();
    render(
      <DetectionResult
        candidate={candidate}
        imageDataUrl="data:image/png;base64,AAAA"
        onConfirm={vi.fn()}
        onCorrect={vi.fn()}
        onSkip={onSkip}
        onRescan={onRescan}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /skip/i }));
    await userEvent.click(screen.getByRole('button', { name: /rescan/i }));
    expect(onSkip).toHaveBeenCalledOnce();
    expect(onRescan).toHaveBeenCalledOnce();
  });

  it('lets the user correct the code before confirming', async () => {
    const onCorrect = vi.fn();
    render(
      <DetectionResult
        candidate={candidate}
        imageDataUrl="data:image/png;base64,AAAA"
        onConfirm={vi.fn()}
        onCorrect={onCorrect}
        onSkip={vi.fn()}
        onRescan={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /correct/i }));
    expect(onCorrect).toHaveBeenCalledWith('ARG01');
  });
});
