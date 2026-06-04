import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollectionList } from '../src/ui/CollectionList';
import type { Scan } from '../src/domain/types';

function scan(id: string, code: string): Scan {
  return {
    id,
    sessionId: 's1',
    normalizedCode: code,
    source: 'ocr',
    confidence: 1,
    capturedAt: '2026-06-04T00:00:00.000Z',
    createdAt: '2026-06-04T00:00:00.000Z',
    updatedAt: '2026-06-04T00:00:00.000Z',
  };
}

describe('CollectionList', () => {
  it('renders a row per scan with a duplicate badge when count > 1', () => {
    render(
      <CollectionList
        scans={[scan('a', 'ARG01'), scan('b', 'ARG01'), scan('c', 'USA13')]}
        thumbnails={{}}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    // ARG01 appears twice -> a "x2" badge somewhere
    expect(screen.getAllByText(/×2/).length).toBeGreaterThanOrEqual(1);
  });

  it('deletes a scan', async () => {
    const onDelete = vi.fn();
    render(
      <CollectionList
        scans={[scan('a', 'ARG01')]}
        thumbnails={{}}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('a');
  });

  it('edits a code to a new normalized value', async () => {
    const onEdit = vi.fn();
    render(
      <CollectionList
        scans={[scan('a', 'ARG01')]}
        thumbnails={{}}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    const row = screen.getByRole('listitem');
    const input = within(row).getByLabelText(/edit code/i);
    await userEvent.clear(input);
    await userEvent.type(input, 'arg 2');
    await userEvent.click(within(row).getByRole('button', { name: /save/i }));
    expect(onEdit).toHaveBeenCalledWith('a', 'ARG02');
  });

  it('shows a thumbnail when available', () => {
    render(
      <CollectionList
        scans={[scan('a', 'ARG01')]}
        thumbnails={{ a: 'data:image/png;base64,AAAA' }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,AAAA');
  });
});
