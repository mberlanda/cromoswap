import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlbumView } from '../src/ui/AlbumView';
import { MemoryAlbumRepo } from '../src/storage/memory-repos';

let seq: number;
const ids = () => `id-${++seq}`;
const clock = () => '2026-06-04T00:00:00.000Z';
const now = clock;

beforeEach(() => {
  seq = 0;
});

async function findChip(label: string): Promise<HTMLButtonElement> {
  let chip: HTMLButtonElement | null = null;
  await waitFor(() => {
    chip = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    expect(chip).toBeInTheDocument();
  });
  return chip!;
}

describe('AlbumView', () => {
  it('renders chip buttons for FWC00 through FWC19', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={vi.fn()} now={now} />);
    expect(await findChip('FWC00 not owned, tap to add')).toBeInTheDocument();
    expect(await findChip('FWC19 not owned, tap to add')).toBeInTheDocument();
  });

  it('toggling a chip marks it owned then back to not owned', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={vi.fn()} now={now} />);
    const chip = await findChip('FWC00 not owned, tap to add');
    await userEvent.click(chip);
    expect(await findChip('FWC00 owned, tap to remove')).toBeInTheDocument();
    await userEvent.click(await findChip('FWC00 owned, tap to remove'));
    expect(await findChip('FWC00 not owned, tap to add')).toBeInTheDocument();
  });

  it('loads previously owned stickers from the repo on mount', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    await repo.toggle('Mauro', 'ARG07');
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={vi.fn()} now={now} />);
    expect(await findChip('ARG07 owned, tap to remove')).toBeInTheDocument();
  });

  it('calls downloadText for Export owned', async () => {
    const downloadText = vi.fn();
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={downloadText} now={now} />);
    await findChip('FWC00 not owned, tap to add'); // wait for mount
    await userEvent.click(screen.getByText('Export owned', { selector: 'button' }));
    expect(downloadText).toHaveBeenCalledOnce();
    expect(downloadText.mock.calls[0][0]).toContain('owned');
    expect(downloadText.mock.calls[0][1]).toContain('user: Mauro');
  });

  it('calls downloadText for Export missing', async () => {
    const downloadText = vi.fn();
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={downloadText} now={now} />);
    await findChip('FWC00 not owned, tap to add');
    await userEvent.click(screen.getByText('Export missing', { selector: 'button' }));
    expect(downloadText).toHaveBeenCalledOnce();
    expect(downloadText.mock.calls[0][0]).toContain('missing');
    expect(downloadText.mock.calls[0][1]).toContain('missing: 980');
  });

  it('Select all marks every sticker in the team owned, then flips to Clear all', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={vi.fn()} now={now} />);
    await findChip('FWC00 not owned, tap to add'); // wait for mount

    const selectAll = document.querySelector<HTMLButtonElement>('button[aria-label="Select all FWC"]');
    expect(selectAll).toBeInTheDocument();
    await userEvent.click(selectAll!);

    expect(await findChip('FWC00 owned, tap to remove')).toBeInTheDocument();
    expect(await findChip('FWC19 owned, tap to remove')).toBeInTheDocument();
    expect((await repo.listByUser('Mauro'))).toHaveLength(20);

    const clearAll = await waitFor(() => {
      const btn = document.querySelector<HTMLButtonElement>('button[aria-label="Clear all FWC"]');
      expect(btn).toBeInTheDocument();
      return btn!;
    });
    await userEvent.click(clearAll);
    expect(await findChip('FWC00 not owned, tap to add')).toBeInTheDocument();
    expect(await repo.listByUser('Mauro')).toHaveLength(0);
  });

  it('hides the Select all control in read-only mode', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    render(
      <AlbumView userName="Alice" albumRepo={repo} downloadText={vi.fn()} now={now} readOnly />,
    );
    await findChip('FWC00 not owned');
    expect(document.querySelector('button[aria-label="Select all FWC"]')).not.toBeInTheDocument();
  });

  it('disables sticker changes when shown in read-only mode', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    const toggle = vi.spyOn(repo, 'toggle');
    render(
      <AlbumView
        userName="Alice"
        albumRepo={repo}
        downloadText={vi.fn()}
        now={now}
        readOnly
      />,
    );

    const chip = await findChip('FWC00 not owned');
    expect(chip).toBeDisabled();
    await userEvent.click(chip);

    expect(toggle).not.toHaveBeenCalled();
  });

  it('exports the viewed user selection in read-only mode', async () => {
    const downloadText = vi.fn();
    const repo = new MemoryAlbumRepo(ids, clock);
    await repo.toggle('Alice', 'ARG07');
    render(
      <AlbumView
        userName="Alice"
        albumRepo={repo}
        downloadText={downloadText}
        now={now}
        readOnly
      />,
    );

    await findChip('ARG07 owned');
    await userEvent.click(screen.getByText('Export owned', { selector: 'button' }));

    expect(downloadText.mock.calls[0][0]).toBe('Alice-album-owned.txt');
    expect(downloadText.mock.calls[0][1]).toContain('user: Alice');
    expect(downloadText.mock.calls[0][1]).toContain('ARG: 07');
  });
});
