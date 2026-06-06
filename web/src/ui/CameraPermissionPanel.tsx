import type { CameraState } from './camera-permission';

interface CameraPermissionPanelProps {
  state: CameraState;
  onRequest: () => void;
  onSkip: () => void;
}

export function CameraPermissionPanel({ state, onRequest, onSkip }: CameraPermissionPanelProps) {
  return (
    <section aria-label="Camera access" className="camera-permission-panel">
      {state === 'idle' && (
        <>
          <p className="camera-permission-msg">
            Point your camera at the back of a sticker to scan its code automatically.
          </p>
          <button type="button" className="primary full" onClick={onRequest} data-test-id="allow-camera">
            Allow camera
          </button>
          <button type="button" className="secondary full" onClick={onSkip} data-test-id="enter-manually">
            Enter manually
          </button>
        </>
      )}
      {state === 'denied' && (
        <>
          <p className="camera-permission-msg">
            Camera access was blocked. Open your browser settings to allow it, or enter
            codes manually.
          </p>
          <button type="button" className="primary full" onClick={onSkip} data-test-id="enter-manually">
            Enter manually
          </button>
        </>
      )}
      {(state === 'no-camera' || state === 'error') && (
        <>
          <p className="camera-permission-msg">
            No camera found on this device. You can still add sticker codes manually.
          </p>
          <button type="button" className="primary full" onClick={onSkip} data-test-id="enter-manually">
            Enter manually
          </button>
        </>
      )}
    </section>
  );
}
