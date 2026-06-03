import maskConfig from './assets/mask-config.json';
import type { AppDeps, Detection } from './ui/App';
import { openStickerDb } from './storage/db';
import { IdbSessionRepo, IdbScanRepo, IdbImageStore } from './storage/idb-repos';
import { TesseractAdapter } from './ocr/tesseract-adapter';
import { runPipeline } from './ocr/pipeline';
import { requestCamera } from './ui/camera-permission';
import type { RgbaImage } from './ocr/image';

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

export async function createAppDeps(video: HTMLVideoElement): Promise<AppDeps> {
  const db = await openStickerDb();
  const ocr = new TesseractAdapter();
  const roi = maskConfig.orientations.portrait.roi;

  const camera = await requestCamera((c) => navigator.mediaDevices.getUserMedia(c));
  if (camera.state === 'granted') {
    video.srcObject = camera.stream;
    await video.play();
  }

  const scanOnce = async (): Promise<Detection | null> => {
    const captured = captureFrame(video);
    if (!captured) return null;
    const ranked = await runPipeline(captured.image, { ocr, roi, threshold: 128 });
    if (ranked.length === 0) return null;
    return { candidate: ranked[0], imageDataUrl: captured.dataUrl };
  };

  return {
    sessionRepo: new IdbSessionRepo(db, uuid, nowIso),
    scanRepo: new IdbScanRepo(db, uuid, nowIso),
    imageStore: new IdbImageStore(db),
    scanOnce,
    now: nowIso,
    downloadText: (name, content) => triggerDownload(name, content, 'text/plain'),
    downloadJson: (name, content) => triggerDownload(name, content, 'application/json'),
  };
}
