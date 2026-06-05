import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RepsView } from '../src/ui/RepsView';
import type { RepsViewProps } from '../src/ui/RepsView';
import type { Scan } from '../src/domain/types';
import { createRef } from 'react';

function makeScan(id: string, code: string, source: 'ocr' | 'manual' = 'ocr'): Scan {
  return {
    id, sessionId: 's1', normalizedCode: code, source,
    confidence: 1, capturedAt: '2026-06-04T00:00:00.000Z',
    createdAt: '2026-06-04T00:00:00.000Z', updatedAt: '2026-06-04T00:00:00.000Z',
  };
}

const baseProps: RepsViewProps = {
  scans: [],
  thumbnails: {},
  detection: null,
  noDetection: false,
  scanning: false,
  cameraPaused: false,
  videoMode: false,
  orientation: 'portrait',
  size: 0.8,
  targeted: false,
  videoRef: createRef(),
  onCapture: vi.fn(),
  onResumeCamera: vi.fn(),
  onPauseCamera: vi.fn(),
  onToggleVideoMode: vi.fn(),
  onConfirm: vi.fn(),
  onCorrect: vi.fn(),
  onSkip: vi.fn(),
  onRescan: vi.fn(),
  onManualAdd: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onExportText: vi.fn(),
  onExportJson: vi.fn(),
  onSetOrientation: vi.fn(),
  onSetSize: vi.fn(),
};

describe('RepsView export section', () => {
  it('shows scan summary: total, unique, duplicate count', () => {
    render(
      <RepsView
        {...baseProps}
        scans={[makeScan('a', 'ARG01'), makeScan('b', 'ARG01'), makeScan('c', 'USA13')]}
      />,
    );
    const summary = screen.getByRole('paragraph', { name: /export summary/i });
    expect(summary).toHaveTextContent('3 scans');
    expect(summary).toHaveTextContent('2 unique');
    expect(summary).toHaveTextContent('1 duplicates');
  });

  it('shows privacy note near the JSON export button', () => {
    render(<RepsView {...baseProps} />);
    expect(screen.getByText(/personal backup/i)).toBeInTheDocument();
  });

  it('shows camera pause controls and auto collect toggle', () => {
    render(<RepsView {...baseProps} cameraPaused />);
    expect(screen.getByText(/camera paused/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resume camera/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /auto collect/i })).toBeInTheDocument();
  });
});
