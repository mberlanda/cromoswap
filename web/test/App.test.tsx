import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/ui/App';
import {
  MemorySessionRepo,
  MemoryScanRepo,
  MemoryImageStore,
} from '../src/storage/memory-repos';
import type { AppDeps } from '../src/ui/App';

let seq: number;
const ids = () => `id-${++seq}`;
const clock = () => '2026-06-04T00:00:00.000Z';

function makeDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    sessionRepo: new MemorySessionRepo(ids, clock),
    scanRepo: new MemoryScanRepo(ids, clock),
    imageStore: new MemoryImageStore(),
    scanOnce: vi.fn(async () => ({
      candidate: { code: { prefix: 'ARG', number: 1, canonical: 'ARG01' }, confidence: 0.9 },
      imageDataUrl: 'data:image/png;base64,AAAA',
    })),
    now: () => '2026-06-04T12:00:00.000Z',
    downloadText: vi.fn(),
    downloadJson: vi.fn(),
    ...overrides,
  };
}

async function startSession(name = 'Mauro') {
  await userEvent.type(screen.getByLabelText(/name/i), name);
  await userEvent.click(screen.getByRole('button', { name: /start/i }));
}

beforeEach(() => {
  seq = 0;
});

describe('App', () => {
  it('creates a session then shows the scanner', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument();
  });

  it('captures, confirms, and stores a scan that appears in the collection', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    await userEvent.click(screen.getByRole('button', { name: /capture/i }));
    expect(await screen.findByText('ARG01')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));

    const collection = screen.getByRole('list', { name: /collection/i });
    expect(within(collection).getByText('ARG01')).toBeInTheDocument();
  });

  it('captures using the selected orientation', async () => {
    const scanOnce = vi.fn(async () => null);
    render(<App deps={makeDeps({ scanOnce })} />);
    await startSession();

    // Defaults to portrait.
    await userEvent.click(screen.getByRole('button', { name: /capture/i }));
    expect(scanOnce).toHaveBeenLastCalledWith('portrait');

    // Switch to landscape and capture again.
    await userEvent.click(screen.getByRole('radio', { name: /landscape/i }));
    await userEvent.click(screen.getByRole('button', { name: /capture/i }));
    expect(scanOnce).toHaveBeenLastCalledWith('landscape');
  });

  it('shows a message when no code is detected', async () => {
    render(<App deps={makeDeps({ scanOnce: vi.fn(async () => null) })} />);
    await startSession();
    await userEvent.click(screen.getByRole('button', { name: /capture/i }));
    expect(await screen.findByText(/no code detected/i)).toBeInTheDocument();
  });

  it('adds, edits, and deletes scans manually', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();

    // Manual add
    await userEvent.type(screen.getByLabelText(/^code$/i), 'USA13');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    const collection = screen.getByRole('list', { name: /collection/i });
    expect(within(collection).getByText('USA13')).toBeInTheDocument();

    // Edit
    await userEvent.click(within(collection).getByRole('button', { name: /edit/i }));
    const editInput = within(collection).getByLabelText(/edit code/i);
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'USA14');
    await userEvent.click(within(collection).getByRole('button', { name: /save/i }));
    expect(within(collection).getByText('USA14')).toBeInTheDocument();

    // Delete
    await userEvent.click(within(collection).getByRole('button', { name: /delete/i }));
    expect(within(collection).queryByText('USA14')).not.toBeInTheDocument();
  });

  it('exports the confirmed codes as text', async () => {
    const deps = makeDeps();
    render(<App deps={deps} />);
    await startSession();
    await userEvent.type(screen.getByLabelText(/^code$/i), 'USA13');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await userEvent.click(screen.getByRole('button', { name: /export text/i }));
    expect(deps.downloadText).toHaveBeenCalledOnce();
    const [, content] = (deps.downloadText as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(content).toContain('USA13');
  });

  it('stores a corrected detection with its captured image', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    await userEvent.click(screen.getByRole('button', { name: /capture/i }));
    await screen.findByText('ARG01');
    await userEvent.click(screen.getByRole('button', { name: /correct/i }));

    const collection = screen.getByRole('list', { name: /collection/i });
    expect(within(collection).getByText('ARG01')).toBeInTheDocument();
    expect(within(collection).getByRole('img')).toHaveAttribute(
      'src',
      'data:image/png;base64,AAAA',
    );
  });

  it('skips a detection without storing it', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    await userEvent.click(screen.getByRole('button', { name: /capture/i }));
    await screen.findByText('ARG01');
    await userEvent.click(screen.getByRole('button', { name: /skip/i }));

    const collection = screen.getByRole('list', { name: /collection/i });
    expect(within(collection).queryByText('ARG01')).not.toBeInTheDocument();
  });

  it('exports the collection as JSON', async () => {
    const deps = makeDeps();
    render(<App deps={deps} />);
    await startSession();
    await userEvent.type(screen.getByLabelText(/^code$/i), 'USA13');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await userEvent.click(screen.getByRole('button', { name: /export json/i }));
    expect(deps.downloadJson).toHaveBeenCalledOnce();
    const [, content] = (deps.downloadJson as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(content).toContain('USA13');
  });

  it('best-effort syncs the session and scans after a change', async () => {
    const syncSession = vi.fn();
    render(<App deps={makeDeps({ syncSession })} />);
    await startSession('Mauro');
    await userEvent.type(screen.getByLabelText(/^code$/i), 'USA13');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    const lastCall = syncSession.mock.calls.at(-1);
    expect(lastCall?.[0]).toMatchObject({ userName: 'Mauro' });
    expect(lastCall?.[1].map((s: { normalizedCode: string }) => s.normalizedCode)).toContain(
      'USA13',
    );
  });

  it('resumes an existing session and shows its scans', async () => {
    const deps = makeDeps();
    const { unmount } = render(<App deps={deps} />);
    await startSession('Mauro');
    await userEvent.type(screen.getByLabelText(/^code$/i), 'USA13');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    unmount();

    render(<App deps={deps} />);
    await userEvent.click(await screen.findByRole('button', { name: /resume.*mauro/i }));
    const collection = screen.getByRole('list', { name: /collection/i });
    expect(within(collection).getByText('USA13')).toBeInTheDocument();
  });
});
