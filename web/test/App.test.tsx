import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/ui/App';
import { findByAriaLabel as findButtonByAriaLabel } from './helpers';
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
  await userEvent.type(screen.getByLabelText(/your name/i), name);
  await userEvent.click(screen.getByRole('button', { name: /start/i }));
}

async function switchToScanView() {
  await userEvent.click(screen.getByRole('button', { name: /^scan$/i }));
}

async function switchToManualView() {
  await userEvent.click(screen.getByRole('button', { name: /^manual$/i }));
}

beforeEach(() => {
  seq = 0;
});

describe('App', () => {
  it('creates a session then shows the scanner', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    await switchToScanView();
    expect(screen.getByRole('button', { name: /scan sticker/i })).toBeInTheDocument();
  });

  it('allows manual entry without a camera', async () => {
    const startCamera = vi.fn(async () => ({ state: 'granted' as const, stream: {} as MediaStream }));
    render(<App deps={makeDeps({ startCamera })} />);
    await startSession();

    // idle -> permission panel; the user opts out of the camera.
    await userEvent.click(screen.getByRole('button', { name: /enter manually/i }));

    // Manual entry is reachable (and the camera scanner is not shown).
    expect(screen.queryByRole('button', { name: /scan sticker/i })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^prefix$/i), 'USA');
    await userEvent.selectOptions(screen.getByLabelText(/^number$/i), '13');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    const collection = screen.getByRole('list', { name: /collection/i });
    expect(within(collection).getByText('USA13')).toBeInTheDocument();
  });

  it('returns to the home screen via the header Home button without reload', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    await switchToScanView();
    expect(screen.getByRole('button', { name: /scan sticker/i })).toBeInTheDocument();

    await userEvent.click(await findButtonByAriaLabel('Home'));

    // Back on the session gate: the name field is shown again.
    expect(await screen.findByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /scan sticker/i })).not.toBeInTheDocument();
  });

  it('reps grid adds, removes, and clears copies via the tap mode', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();

    await userEvent.click(screen.getByRole('button', { name: /grid/i }));
    const tap = async (label: string) => userEvent.click(await findButtonByAriaLabel(label));

    // Default mode is +1 (add).
    await tap('CRO05, no copies');
    expect(await findButtonByAriaLabel('CRO05, 1 copy')).toBeInTheDocument();
    await tap('CRO05, 1 copy');
    expect(await findButtonByAriaLabel('CRO05, 2 copies')).toBeInTheDocument();

    // Give away → decrement.
    await userEvent.click(screen.getByRole('button', { name: /give away/i }));
    await tap('CRO05, 2 copies');
    expect(await findButtonByAriaLabel('CRO05, 1 copy')).toBeInTheDocument();

    // Clear → zero out.
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    await tap('CRO05, 1 copy');
    expect(await findButtonByAriaLabel('CRO05, no copies')).toBeInTheDocument();
  });

  it('reps grid caps a sticker at 7 copies', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    await userEvent.click(screen.getByRole('button', { name: /grid/i }));

    for (let i = 0; i < 8; i++) {
      const current =
        document.querySelector<HTMLButtonElement>('button[aria-label^="CRO05,"]')!;
      await userEvent.click(current);
    }
    expect(await findButtonByAriaLabel('CRO05, 7 copies')).toBeInTheDocument();
  });

  it('imports a JSON session export and shows it on the home screen', async () => {
    render(<App deps={makeDeps()} />);
    const json = JSON.stringify({
      session: { id: 'old', userName: 'Imported Guy', createdAt: 'c', updatedAt: 'u' },
      scans: [
        { id: 's1', sessionId: 'old', normalizedCode: 'ARG01', source: 'manual', confidence: 1, capturedAt: 'cap', createdAt: 'c', updatedAt: 'u' },
        { id: 's2', sessionId: 'old', normalizedCode: 'ARG01', source: 'manual', confidence: 1, capturedAt: 'cap', createdAt: 'c', updatedAt: 'u' },
      ],
      images: {},
      albumOwnedCodes: ['BRA05', 'BRA06'],
    });
    const file = new File([json], 'backup.json', { type: 'application/json' });

    await userEvent.upload(screen.getByLabelText(/restore a full backup/i), file);

    expect(await screen.findByText('Imported Guy')).toBeInTheDocument();
    expect(await screen.findByText(/2 scans/i)).toBeInTheDocument();
    expect(await screen.findByText(/2 owned/i)).toBeInTheDocument();
  });

  it('imports an owned album list via the form (flexible format)', async () => {
    render(<App deps={makeDeps()} />);
    await userEvent.type(screen.getByLabelText(/collector name/i), 'Mauro');
    // owned is the default kind; the file is plain one-per-line codes.
    const file = new File(['ARG01\narg 2\nBRA05'], 'list.txt', { type: 'text/plain' });

    await userEvent.upload(screen.getByLabelText(/choose a .txt/i), file);

    expect(await screen.findByText(/imported 3 owned/i)).toBeInTheDocument();
    expect(await screen.findByText('Mauro')).toBeInTheDocument();
  });

  it('reports a clear error when an imported file has no codes', async () => {
    render(<App deps={makeDeps()} />);
    await userEvent.type(screen.getByLabelText(/collector name/i), 'Mauro');
    const file = new File(['nothing useful here'], 'list.txt', { type: 'text/plain' });

    await userEvent.upload(screen.getByLabelText(/choose a .txt/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(/no sticker codes/i);
  });

  it('opens the board from the home gate without starting a session', async () => {
    const fetchLeaderboard = vi.fn(async () => [{ userName: 'Ana', owned: 3, missing: 977 }]);
    render(<App deps={makeDeps({ fetchLeaderboard })} />);

    await userEvent.click(screen.getByRole('button', { name: /view board/i }));
    expect(await screen.findByText('Ana')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /open ana selection/i }));
    expect(await screen.findByText(/Ana's selection/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /admin backoffice/i })).toHaveAttribute('href', '/admin');

    await userEvent.click(await findButtonByAriaLabel('Home'));
    expect(await screen.findByLabelText(/your name/i)).toBeInTheDocument();
  });

  it('captures, confirms, and stores a scan that appears in the collection', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    await switchToScanView();
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));
    expect(await screen.findByText('ARG01')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    const collection = screen.getByRole('list', { name: /collection/i });
    expect(within(collection).getByText('ARG01')).toBeInTheDocument();
  });

  it('pauses the camera after a successful scan and can resume it', async () => {
    const stopCamera = vi.fn();
    render(<App deps={makeDeps({ stopCamera })} />);
    await startSession();
    await switchToScanView();

    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));

    expect(await screen.findByText(/camera paused/i)).toBeInTheDocument();
    expect(stopCamera).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole('button', { name: /resume camera/i }));
    expect(screen.queryByText(/camera paused/i)).not.toBeInTheDocument();
  });

  it('auto-collects detected stickers in video mode without confirmation', async () => {
    const scanOnce = vi.fn(async () => ({
      candidate: { code: { prefix: 'USA', number: 13, canonical: 'USA13' }, confidence: 0.8 },
      imageDataUrl: 'data:image/png;base64,BBBB',
    }));
    render(<App deps={makeDeps({ scanOnce, videoScanIntervalMs: 50 })} />);
    await startSession();
    await switchToScanView();

    await userEvent.click(screen.getByRole('checkbox', { name: /auto collect/i }));

    const collection = screen.getByRole('list', { name: /collection/i });
    expect(await within(collection).findByText('USA13')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
  });

  it('renders the camera preview with the mask overlay over it', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    await switchToScanView();
    const scan = screen.getByRole('region', { name: /scan/i });
    expect(scan.querySelector('video')).toBeInTheDocument();
    expect(within(scan).getByTestId('roi-box')).toBeInTheDocument();
  });

  it('attaches the camera video element so the composition can wire it', async () => {
    const attachVideo = vi.fn();
    render(<App deps={makeDeps({ attachVideo })} />);
    await startSession();
    await switchToScanView();
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
    await switchToScanView();

    expect(await screen.findByRole('button', { name: /scan sticker/i })).toBeInTheDocument();
    expect(attachVideo.mock.calls.at(-1)?.[0]?.tagName).toBe('VIDEO');
  });

  it('shows the session name and scan count in the header after creating a session', async () => {
    const deps = makeDeps();
    render(<App deps={deps} />);
    await userEvent.type(screen.getByLabelText(/your name/i), 'Mauro');
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
    await switchToScanView();

    // Defaults to portrait, with the current frame size.
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));
    expect(await screen.findByText('ARG01')).toBeInTheDocument();
    expect(scanOnce).toHaveBeenLastCalledWith('portrait', 0.8);

    // Switch to landscape and capture again.
    await userEvent.click(screen.getByRole('button', { name: /resume camera/i }));
    await userEvent.click(screen.getByRole('button', { name: /landscape/i }));
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));
    await screen.findByText('ARG01');
    expect(scanOnce).toHaveBeenLastCalledWith('landscape', 0.8);
  });

  it('flips the scan frame to targeted when live detection succeeds', async () => {
    const detectTargeted = vi.fn(async () => true);
    render(<App deps={makeDeps({ detectTargeted, targetIntervalMs: 10 })} />);
    await startSession();
    await switchToScanView();

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
    await switchToScanView();
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));

    expect(await screen.findByText('USA13')).toBeInTheDocument();
    expect(scanOnce.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('fails after the timeout when nothing is recognized', async () => {
    const scanOnce = vi.fn(async () => null);
    render(<App deps={makeDeps({ scanOnce })} />);
    await startSession();
    await switchToScanView();
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));

    expect(await screen.findByText(/no code detected/i)).toBeInTheDocument();
    expect(scanOnce.mock.calls.length).toBeGreaterThan(1);
  });

  it('shows a message when no code is detected', async () => {
    render(<App deps={makeDeps({ scanOnce: vi.fn(async () => null) })} />);
    await startSession();
    await switchToScanView();
    await userEvent.click(screen.getByRole('button', { name: /scan sticker/i }));
    expect(await screen.findByText(/no code detected/i)).toBeInTheDocument();
  });

  it('adds, edits, and deletes scans manually', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    await switchToManualView();

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
    await switchToManualView();
    await userEvent.type(screen.getByLabelText(/^prefix$/i), 'USA');
    await userEvent.selectOptions(screen.getByLabelText(/^number$/i), '13');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await userEvent.click(screen.getByRole('button', { name: /export text/i }));
    expect(deps.downloadText).toHaveBeenCalledOnce();
    const [, content] = (deps.downloadText as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(content).toContain('USA13');
  });

  it('opens another collector album from the board in read-only mode and exports it', async () => {
    const albumRepo = new MemoryAlbumRepo(ids, clock);
    await albumRepo.toggle('Alice', 'ARG07');
    const deps = makeDeps({
      albumRepo,
      fetchLeaderboard: vi.fn(async () => [{ userName: 'Alice', owned: 1, missing: 979 }]),
    });
    render(<App deps={deps} />);
    await startSession('Mauro');

    await userEvent.click(screen.getByRole('tab', { name: /leaderboard/i }));
    await userEvent.click(await screen.findByRole('button', { name: /open alice selection/i }));

    const ownedChip = await findButtonByAriaLabel('ARG07 owned');
    expect(ownedChip).toBeDisabled();

    await userEvent.click(screen.getByText('Export owned', { selector: 'button' }));
    const [filename, content] = (deps.downloadText as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(filename).toBe('Alice-album-owned.txt');
    expect(content).toContain('user: Alice');
    expect(content).toContain('ARG: 07');
  });

  it('stores a corrected detection with its captured image', async () => {
    render(<App deps={makeDeps()} />);
    await startSession();
    await switchToScanView();
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
    await switchToScanView();
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
    await switchToManualView();
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
    await switchToManualView();
    await userEvent.type(screen.getByLabelText(/^prefix$/i), 'USA');
    await userEvent.selectOptions(screen.getByLabelText(/^number$/i), '13');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    unmount();

    render(<App deps={deps} />);
    await userEvent.click(await screen.findByRole('button', { name: /^resume$/i }));
    await switchToManualView();
    const collection = screen.getByRole('list', { name: /collection/i });
    expect(within(collection).getByText('USA13')).toBeInTheDocument();
  });
});
