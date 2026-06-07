import maskConfig from './assets/mask-config.json';
import type { AppDeps, Detection } from './ui/App';
import { openStickerDb } from './storage/db';
import { IdbSessionRepo, IdbScanRepo, IdbImageStore, IdbAlbumRepo } from './storage/idb-repos';
import { ApiSessionRepo, ApiScanRepo, ApiAlbumRepo } from './storage/api-repos';
import { fetchLeaderboard as fetchLeaderboardClient } from './storage/sync-client';
import { getToken } from './auth/auth';
import { TesseractAdapter } from './ocr/tesseract-adapter';
import { runPipelineMultiOrientation } from './ocr/pipeline';
import { BrightnessLocalizer } from './ocr/localizer';
import { cropRoi } from './ocr/roi-cropper';
import {
  centeredRect,
  coverMapRect,
  isWellTargeted,
  PREVIEW_BOX_ASPECT,
  type Orientation,
} from './ocr/geometry';
import { requestCamera, type CameraResult } from './ui/camera-permission';
import type { RgbaImage } from './ocr/image';

// Empty string means same-origin (relative `/api/...`), which is how the
// production build is served by Rails.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const LEADERBOARD_ENABLED = API_BASE_URL !== '' || import.meta.env.PROD;

export type StorageMode = 'local' | 'cloud';
const STORAGE_MODE_KEY = 'wc-storage-mode';

export function getStorageMode(): StorageMode {
  try {
    const v = localStorage.getItem(STORAGE_MODE_KEY);
    return v === 'local' || v === 'cloud' ? v : 'cloud';
  } catch {
    return 'cloud';
  }
}

export function setStorageMode(mode: StorageMode): void {
  try {
    localStorage.setItem(STORAGE_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

const nowIso = (): string => new Date().toISOString();
const uuid = (): string => crypto.randomUUID();

function triggerDownload(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// Draw the current video frame to a canvas; returns the canvas (and its pixels)
// so callers can optionally encode a dataURL — the live targeting loop skips the
// expensive PNG encode and only reads pixels.
function drawFrame(
  video: HTMLVideoElement,
): { image: RgbaImage; canvas: HTMLCanvasElement } | null {
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
    canvas,
  };
}

export function createCameraBinding(
  request: () => Promise<CameraResult>,
): Pick<AppDeps, 'attachVideo' | 'startCamera' | 'stopCamera'> {
  let video: HTMLVideoElement | null = null;
  let cameraStream: MediaStream | null = null;

  const attachStreamToVideo = (element: HTMLVideoElement, stream: MediaStream): void => {
    if (element.srcObject !== stream) element.srcObject = stream;
    void element.play().catch(() => undefined);
  };

  const attachVideo = (element: HTMLVideoElement | null): void => {
    video = element;
    if (video && cameraStream) attachStreamToVideo(video, cameraStream);
  };

  const startCamera = async () => {
    const camera = await request();
    if (camera.state === 'granted') {
      cameraStream = camera.stream;
      if (video) attachStreamToVideo(video, cameraStream);
    }
    return camera;
  };

  const stopCamera = (): void => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    if (video) video.srcObject = null;
  };

  return { attachVideo, startCamera, stopCamera };
}

export async function createAppDeps(mode: StorageMode = getStorageMode()): Promise<AppDeps> {
  const db = await openStickerDb();
  const ocr = new TesseractAdapter();
  const localizer = new BrightnessLocalizer();

  let video: HTMLVideoElement | null = null;
  const camera = createCameraBinding(() =>
    requestCamera((c) => navigator.mediaDevices.getUserMedia(c)),
  );
  const attachVideo = (element: HTMLVideoElement | null): void => {
    video = element;
    camera.attachVideo?.(element);
  };

  // The frame region (in captured-frame coords) the user has aligned the
  // sticker into: the centered guide, mapped through the cover-crop.
  const framedRegion = (image: RgbaImage, orientation: Orientation, size: number) => {
    const guide = centeredRect(orientation, size, PREVIEW_BOX_ASPECT);
    return coverMapRect(guide, image.width, image.height, PREVIEW_BOX_ASPECT);
  };

  const scanOnce = async (orientation: Orientation, size: number): Promise<Detection | null> => {
    if (!video) return null;
    const captured = drawFrame(video);
    if (!captured) return null;
    const cropped = cropRoi(captured.image, framedRegion(captured.image, orientation, size));
    const roi = maskConfig.orientations[orientation].roi;
    const ranked = await runPipelineMultiOrientation(cropped, {
      ocr,
      roi,
      threshold: 128,
      localizer,
    });
    if (ranked.length === 0) return null;
    return { candidate: ranked[0], imageDataUrl: captured.canvas.toDataURL('image/png') };
  };

  const detectTargeted = async (orientation: Orientation, size: number): Promise<boolean> => {
    if (!video) return false;
    const captured = drawFrame(video);
    if (!captured) return false;
    const crop = cropRoi(captured.image, framedRegion(captured.image, orientation, size));
    if (crop.width === 0 || crop.height === 0) return false;
    const bbox = localizer.locate(crop);
    if (!bbox) return false;
    return isWellTargeted(bbox, crop.width / crop.height);
  };

  const sessionRepo =
    mode === 'cloud'
      ? new ApiSessionRepo(API_BASE_URL, getToken)
      : new IdbSessionRepo(db, uuid, nowIso);

  const scanRepo =
    mode === 'cloud'
      ? new ApiScanRepo(API_BASE_URL, getToken)
      : new IdbScanRepo(db, uuid, nowIso);

  const albumRepo =
    mode === 'cloud'
      ? new ApiAlbumRepo(API_BASE_URL, getToken)
      : new IdbAlbumRepo(db, uuid, nowIso);

  return {
    sessionRepo,
    scanRepo,
    imageStore: new IdbImageStore(db),
    albumRepo,
    scanOnce,
    detectTargeted,
    attachVideo,
    startCamera: camera.startCamera,
    stopCamera: camera.stopCamera,
    now: nowIso,
    downloadText: (name, content) => triggerDownload(name, content, 'text/plain'),
    downloadJson: (name, content) => triggerDownload(name, content, 'application/json'),
    fetchLeaderboard:
      mode === 'cloud' && LEADERBOARD_ENABLED
        ? () => fetchLeaderboardClient(API_BASE_URL, (url, init) => fetch(url, init))
        : undefined,
  };
}
