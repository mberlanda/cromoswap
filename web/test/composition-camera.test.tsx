import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/ui/App';
import { openStickerDb } from '../src/storage/db';
import { IdbImageStore } from '../src/storage/idb-repos';
import { MemorySessionRepo, MemoryScanRepo, MemoryAlbumRepo } from '../src/storage/memory-repos';
import { createCameraBinding } from '../src/composition';
import { requestCamera } from '../src/ui/camera-permission';
import type { AppDeps } from '../src/ui/App';

// Builds camera-focused deps: memory repos for data, real camera wiring from
// the composition helper so we can assert on stream attachment.
async function buildCameraDeps(): Promise<AppDeps> {
  const db = await openStickerDb();
  const cam = createCameraBinding(() =>
    requestCamera((c) => navigator.mediaDevices.getUserMedia(c)),
  );

  let seq = 0;
  const ids = () => `id-${++seq}`;
  const clock = () => new Date().toISOString();

  return {
    sessionRepo: new MemorySessionRepo(ids, clock),
    scanRepo: new MemoryScanRepo(ids, clock),
    imageStore: new IdbImageStore(db),
    albumRepo: new MemoryAlbumRepo(ids, clock),
    scanOnce: async () => null,
    attachVideo: cam.attachVideo,
    startCamera: cam.startCamera,
    now: clock,
    downloadText: vi.fn(),
    downloadJson: vi.fn(),
  };
}

describe('composition camera binding', () => {
  const originalMediaDevices = navigator.mediaDevices;

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn() },
    });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
  });

  it('attaches a granted camera stream when the video mounts after permission', async () => {
    const stream = {} as MediaStream;
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(stream);
    const deps = await buildCameraDeps();

    render(<App deps={deps} />);
    await userEvent.type(screen.getByLabelText(/your name/i), 'Mauro');
    await userEvent.click(screen.getByRole('button', { name: /start/i }));
    await userEvent.click(screen.getByRole('button', { name: /^scan$/i }));
    await userEvent.click(await screen.findByRole('button', { name: /allow camera/i }));

    await waitFor(() => {
      const video = document.querySelector('video') as HTMLVideoElement | null;
      expect(video?.srcObject).toBe(stream);
    });
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('stops tracks and detaches the stream when camera is stopped', async () => {
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(stream);
    const cam = createCameraBinding(() =>
      requestCamera((c) => navigator.mediaDevices.getUserMedia(c)),
    );
    const video = document.createElement('video');

    cam.attachVideo(video);
    await cam.startCamera();
    expect(video.srcObject).toBe(stream);

    cam.stopCamera();

    expect(stop).toHaveBeenCalledOnce();
    expect(video.srcObject).toBeNull();
  });

  it('persists a camera-quality change and restarts the stream with it', async () => {
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValue(stream);
    const setCameraQuality = vi.fn();
    const deps = await buildCameraDeps();
    deps.stopCamera = () => stream.getTracks().forEach((t) => t.stop());
    deps.getCameraQuality = () => 'fhd';
    deps.setCameraQuality = setCameraQuality;

    render(<App deps={deps} />);
    await userEvent.type(screen.getByLabelText(/your name/i), 'Mauro');
    await userEvent.click(screen.getByRole('button', { name: /start/i }));
    await userEvent.click(screen.getByRole('button', { name: /^scan$/i }));
    await userEvent.click(await screen.findByRole('button', { name: /allow camera/i }));
    await screen.findByLabelText('Camera quality');

    const callsBefore = vi.mocked(navigator.mediaDevices.getUserMedia).mock.calls.length;
    await userEvent.selectOptions(screen.getByLabelText('Camera quality'), 'hd');

    expect(setCameraQuality).toHaveBeenCalledWith('hd');
    // Old tracks stopped, stream re-requested (composition reads the persisted
    // quality at request time, so the new constraints apply on restart).
    expect(stop).toHaveBeenCalled();
    await waitFor(() => {
      expect(vi.mocked(navigator.mediaDevices.getUserMedia).mock.calls.length).toBeGreaterThan(
        callsBefore,
      );
    });
  });
});
