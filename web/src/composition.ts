import maskConfig from './assets/mask-config.json';
import type { AppDeps, Detection } from './ui/App';
import { openStickerDb } from './storage/db';
import { IdbSessionRepo, IdbScanRepo, IdbImageStore, IdbAlbumRepo } from './storage/idb-repos';
import { TesseractAdapter } from './ocr/tesseract-adapter';
import { runPipelineMultiOrientation } from './ocr/pipeline';
import { BrightnessLocalizer } from './ocr/localizer';
import { requestCamera } from './ui/camera-permission';
import { pushSession } from './storage/sync-client';
import type { RgbaImage } from './ocr/image';

// Empty base URL means same-origin (relative `/api/...`), which is how the
// production build is served by Rails. Sync is enabled when explicitly
// configured, or implicitly for the bundled production build.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const SYNC_ENABLED = API_BASE_URL !== '' || import.meta.env.PROD;

/**
 * Composition root: wires real IndexedDB repos, the camera, and the Tesseract
 * pipeline into the dependency object the App consumes. Browser-only glue,
 * excluded from coverage; the units it composes are tested independently.
 */

const uuid = (): string => crypto.randomUUID();
const nowIso = (): string => new Date().toISOString();

function triggerDownload(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function captureFrame(video: HTMLVideoElement): { image: RgbaImage; dataUrl: string } | null {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  if (canvas.width === 0 || canvas.height === 0) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return {
    image: { width: imageData.width, height: imageData.height, data: imageData.data },
    dataUrl: canvas.toDataURL('image/png'),
  };
}

export async function createAppDeps(): Promise<AppDeps> {
  const db = await openStickerDb();
  const ocr = new TesseractAdapter();
  const localizer = new BrightnessLocalizer();

  // The App binds its <video> via attachVideo; we start the camera once it does.
  let video: HTMLVideoElement | null = null;
  let cameraStarted = false;

  const attachVideo = (element: HTMLVideoElement | null): void => {
    video = element;
    if (!element || cameraStarted) return;
    cameraStarted = true;
    void requestCamera((c) => navigator.mediaDevices.getUserMedia(c)).then((camera) => {
      if (camera.state === 'granted') {
        element.srcObject = camera.stream;
        void element.play();
      }
    });
  };

  const scanOnce = async (orientation: 'portrait' | 'landscape'): Promise<Detection | null> => {
    if (!video) return null;
    const captured = captureFrame(video);
    if (!captured) return null;
    const roi = maskConfig.orientations[orientation].roi;
    const ranked = await runPipelineMultiOrientation(captured.image, {
      ocr,
      roi,
      threshold: 128,
      localizer,
    });
    if (ranked.length === 0) return null;
    return { candidate: ranked[0], imageDataUrl: captured.dataUrl };
  };

  return {
    sessionRepo: new IdbSessionRepo(db, uuid, nowIso),
    scanRepo: new IdbScanRepo(db, uuid, nowIso),
    imageStore: new IdbImageStore(db),
    albumRepo: new IdbAlbumRepo(db, uuid, nowIso),
    scanOnce,
    attachVideo,
    now: nowIso,
    downloadText: (name, content) => triggerDownload(name, content, 'text/plain'),
    downloadJson: (name, content) => triggerDownload(name, content, 'application/json'),
    syncSession: SYNC_ENABLED
      ? (session, scans) => pushSession(session, scans, API_BASE_URL, (url, init) => fetch(url, init))
      : undefined,
  };
}
