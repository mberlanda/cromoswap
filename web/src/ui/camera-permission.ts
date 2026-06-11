export type CameraState = 'idle' | 'granted' | 'denied' | 'no-camera' | 'error';

export type CameraResult =
  | { state: 'granted'; stream: MediaStream }
  | { state: 'denied' }
  | { state: 'no-camera' }
  | { state: 'error'; message: string };

export type GetUserMedia = (constraints: MediaStreamConstraints) => Promise<MediaStream>;

/**
 * Named capture-resolution presets (see docs/ocr-recognition.md): the code
 * pill is a small fraction of the frame, so resolution directly bounds how
 * many pixels OCR gets. Requested as `ideal` so cameras that can't deliver
 * fall back to their best mode instead of failing.
 */
export type CameraQuality = 'sd' | 'hd' | 'fhd';

export const CAMERA_QUALITY_PRESETS: Record<
  CameraQuality,
  { label: string; width: number; height: number }
> = {
  sd: { label: 'SD (640×480)', width: 640, height: 480 },
  hd: { label: 'HD (1280×720)', width: 1280, height: 720 },
  fhd: { label: 'Full HD (1920×1080)', width: 1920, height: 1080 },
};

export const DEFAULT_CAMERA_QUALITY: CameraQuality = 'fhd';

export function cameraConstraints(quality: CameraQuality): MediaStreamConstraints {
  const { width, height } = CAMERA_QUALITY_PRESETS[quality];
  return {
    video: {
      facingMode: 'environment',
      width: { ideal: width },
      height: { ideal: height },
    },
    audio: false,
  };
}

/**
 * Request camera access and map success/failure to a discriminated result so
 * the UI can render useful states. Injectable getUserMedia for testing.
 */
export async function requestCamera(
  getUserMedia: GetUserMedia,
  quality: CameraQuality = DEFAULT_CAMERA_QUALITY,
): Promise<CameraResult> {
  try {
    const stream = await getUserMedia(cameraConstraints(quality));
    return { state: 'granted', stream };
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'NotAllowedError') return { state: 'denied' };
    if (name === 'NotFoundError') return { state: 'no-camera' };
    return { state: 'error', message: err instanceof Error ? err.message : 'Unknown error' };
  }
}
