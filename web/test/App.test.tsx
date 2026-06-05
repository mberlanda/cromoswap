import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/ui/App';
import {
  MemorySessionRepo,
  MemoryScanRepo,
  MemoryImageStore,
  MemoryAlbumRepo,
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
    albumRepo: new MemoryAlbumRepo(ids, clock),
    scanOnce: vi.fn(async () => ({
      candidate: { code: { prefix: 'ARG', number: 1, canonical: 'ARG01' }, confidence: 0.9 },
      imageDataUrl: 'data:image/png;base64,AAAA',
    })),
    now: () => '2026-06-04T12:00:00.000Z',
    downloadText: vi.fn(),
    downloadJson: vi.fn(),
    // Fast, deterministic scan-loop timing for tests.
    delay: async () => {},
    nowMs: (() => {
      let t = 0;
      return () => (t += 300);
    })(),
    scanTimeoutMs: 1500,
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
    expect(screen.getByRole('button', { name: /scan sticker/i })).toBeInTheDocument();
  });

  it('captures, confirms, and stores a scan that appears in the collection', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));
    expect(await screen.findByText('ARG01')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    const collection = screen.getByRole('list', { name: /collection/i });
    expect(within(collection).getByText('ARG01')).toBeInTheDocument();
  });

  it('renders the camera preview with the mask overlay over it', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    const scan = screen.getByRole('region', { name: /scan/i });
    expect(scan.querySelector('video')).toBeInTheDocument();
    expect(within(scan).getByTestId('roi-box')).toBeInTheDocument();
  });

  it('attaches the camera video element so the composition can wire it', async () => {
    const attachVideo = vi.fn();
    render(<App deps={makeDeps({ attachVideo })} />);
    await startSession();
    expect(attachVideo).toHaveBeenCalled();
    expect(attachVideo.mock.calls.at(-1)?.[0]?.tagName).toBe('VIDEO');
  });

  it('attaches the camera video element after permission is granted', async () => {
    const attachVideo = vi.fn();
    const startCamera = vi.fn(async () => ({ state: 'granted' as const, stream: {} as MediaStream }));
    render(<App deps={makeDeps({ attachVideo, startCamera })} />);

    await startSession();
    expect(screen.queryByRole('button', { name: /scan sticker/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /allow camera/i }));

    expect(await screen.findByRole('button', { name: /scan sticker/i })).toBeInTheDocument();
    expect(attachVideo.mock.calls.at(-1)?.[0]?.tagName).toBe('VIDEO');
  });

  it('shows the session name and scan count in the header after creating a session', async () => {
    const deps = makeDeps();
    render(<App deps={deps} />);
    await userEvent.type(screen.getByLabelText(/name/i), 'Mauro');
    await userEvent.click(screen.getByRole('button', { name: /start/i }));
    const header = screen.getByRole('heading', { name: /mauro/i }).closest('.app-header');
    expect(header).toBeInTheDocument();
    expect(within(header!).getByText(/0 scans/i)).toBeInTheDocument();
  });

  it('captures using the selected orientation', async () => {
    const scanOnce = vi.fn(async () => ({
      candidate: { code: { prefix: 'ARG', number: 1, canonical: 'ARG01' }, confidence: 0.9 },
      imageDataUrl: 'data:image/png;base64,AAAA',
    }));
    render(<App deps={makeDeps({ scanOnce })} />);
    await startSession();

    // Defaults to portrait, with the current frame size.
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));
    expect(await screen.findByText('ARG01')).toBeInTheDocument();
    expect(scanOnce).toHaveBeenLastCalledWith('portrait', 0.8);

    // Switch to landscape and capture again.
    await userEvent.click(screen.getByRole('button', { name: /landscape/i }));
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));
    await screen.findByText('ARG01');
    expect(scanOnce).toHaveBeenLastCalledWith('landscape', 0.8);
  });

  it('flips the scan frame to targeted when live detection succeeds', async () => {
    const detectTargeted = vi.fn(async () => true);
    render(<App deps={makeDeps({ detectTargeted, targetIntervalMs: 10 })} />);
    await startSession();

    const frame = await screen.findByTestId('sticker-frame');
    await vi.waitFor(() => expect(frame.className).toContain('targeted'));
    expect(detectTargeted).toHaveBeenCalledWith('portrait', 0.8);
  });

  it('keeps scanning until a code is recognized', async () => {
    const scanOnce = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({
        candidate: { code: { prefix: 'USA', number: 13, canonical: 'USA13' }, confidence: 0.8 },
        imageDataUrl: 'data:image/png;base64,AAAA',
      });
    render(<App deps={makeDeps({ scanOnce })} />);
    await startSession();
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));

    expect(await screen.findByText('USA13')).toBeInTheDocument();
    expect(scanOnce.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('fails after the timeout when nothing is recognized', async () => {
    const scanOnce = vi.fn(async () => null);
    render(<App deps={makeDeps({ scanOnce })} />);
    await startSession();
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));

    expect(await screen.findByText(/no code detected/i)).toBeInTheDocument();
    expect(scanOnce.mock.calls.length).toBeGreaterThan(1);
  });

  it('shows a message when no code is detected', async () => {
    render(<App deps={makeDeps({ scanOnce: vi.fn(async () => null) })} />);
    await startSession();
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));
    expect(await screen.findByText(/no code detected/i)).toBeInTheDocument();
  });

  it('adds, edits, and deletes scans manually', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();

    // Manual add
    await userEvent.type(screen.getByLabelText(/^prefix$/i), 'USA');
    await userEvent.selectOptions(screen.getByLabelText(/^number$/i), '13');
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
    await userEvent.type(screen.getByLabelText(/^prefix$/i), 'USA');
    await userEvent.selectOptions(screen.getByLabelText(/^number$/i), '13');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await userEvent.click(screen.getByRole('button', { name: /export text/i }));
    expect(deps.downloadText).toHaveBeenCalledOnce();
    const [, content] = (deps.downloadText as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(content).toContain('USA13');
  });

  it('stores a corrected detection with its captured image', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));
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
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));
    await screen.findByText('ARG01');
    await userEvent.click(screen.getByRole('button', { name: /skip/i }));

    const collection = screen.getByRole('list', { name: /collection/i });
    expect(within(collection).queryByText('ARG01')).not.toBeInTheDocument();
  });

  it('exports the collection as JSON', async () => {
    const deps = makeDeps();
    render(<App deps={deps} />);
    await startSession();
    await userEvent.type(screen.getByLabelText(/^prefix$/i), 'USA');
    await userEvent.selectOptions(screen.getByLabelText(/^number$/i), '13');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await userEvent.click(screen.getByRole('button', { name: /export json/i }));
    expect(deps.downloadJson).toHaveBeenCalledOnce();
    const [, content] = (deps.downloadJson as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(content).toContain('USA13');
  });


  it('resumes an existing session and shows its scans', async () => {
    const deps = makeDeps();
    const { unmount } = render(<App deps={deps} />);
    await startSession('Mauro');
    await userEvent.type(screen.getByLabelText(/^prefix$/i), 'USA');
    await userEvent.selectOptions(screen.getByLabelText(/^number$/i), '13');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    unmount();

    render(<App deps={deps} />);
    await userEvent.click(await screen.findByRole('button', { name: /^resume$/i }));
    const collection = screen.getByRole('list', { name: /collection/i });
    expect(within(collection).getByText('USA13')).toBeInTheDocument();
  });
});
