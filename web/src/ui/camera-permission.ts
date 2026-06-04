export type CameraState = 'idle' | 'granted' | 'denied' | 'no-camera' | 'error';

export type CameraResult =
  | { state: 'granted'; stream: MediaStream }
  | { state: 'denied' }
  | { state: 'no-camera' }
  | { state: 'error'; message: string };

export type GetUserMedia = (constraints: MediaStreamConstraints) => Promise<MediaStream>;

const REAR_CAMERA: MediaStreamConstraints = {
  video: { facingMode: 'environment' },
  audio: false,
};

/**
 * Request camera access and map success/failure to a discriminated result so
 * the UI can render useful states. Injectable getUserMedia for testing.
 */
export async function requestCamera(getUserMedia: GetUserMedia): Promise<CameraResult> {
  try {
    const stream = await getUserMedia(REAR_CAMERA);
    return { state: 'granted', stream };
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'NotAllowedError') return { state: 'denied' };
    if (name === 'NotFoundError') return { state: 'no-camera' };
    return { state: 'error', message: err instanceof Error ? err.message : 'Unknown error' };
  }
}
