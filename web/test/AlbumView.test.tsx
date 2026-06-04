import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('AlbumView', () => {
  it('renders chip buttons for FWC00 through FWC19', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={vi.fn()} now={now} />);
    expect(await screen.findByRole('button', { name: /FWC00 not owned/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /FWC19 not owned/i })).toBeInTheDocument();
  });

  it('toggling a chip marks it owned then back to not owned', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={vi.fn()} now={now} />);
    const chip = await screen.findByRole('button', { name: /FWC00 not owned/i });
    await userEvent.click(chip);
    expect(screen.getByRole('button', { name: /FWC00 owned/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /FWC00 owned/i }));
    expect(screen.getByRole('button', { name: /FWC00 not owned/i })).toBeInTheDocument();
  });

  it('loads previously owned stickers from the repo on mount', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    await repo.toggle('Mauro', 'ARG07');
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={vi.fn()} now={now} />);
    expect(await screen.findByRole('button', { name: /ARG07 owned/i })).toBeInTheDocument();
  });

  it('calls downloadText for Export owned', async () => {
    const downloadText = vi.fn();
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={downloadText} now={now} />);
    await screen.findByRole('button', { name: /FWC00 not owned/i }); // wait for mount
    await userEvent.click(screen.getByRole('button', { name: /export owned/i }));
    expect(downloadText).toHaveBeenCalledOnce();
    expect(downloadText.mock.calls[0][0]).toContain('owned');
    expect(downloadText.mock.calls[0][1]).toContain('user: Mauro');
  });

  it('calls downloadText for Export missing', async () => {
    const downloadText = vi.fn();
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={downloadText} now={now} />);
    await screen.findByRole('button', { name: /FWC00 not owned/i });
    await userEvent.click(screen.getByRole('button', { name: /export missing/i }));
    expect(downloadText).toHaveBeenCalledOnce();
    expect(downloadText.mock.calls[0][0]).toContain('missing');
    expect(downloadText.mock.calls[0][1]).toContain('missing: 980');
  });
});
