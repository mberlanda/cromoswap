import { CAMERA_QUALITY_PRESETS, type CameraQuality } from './camera-permission';

interface CameraQualitySelectProps {
  value: CameraQuality;
  onChange: (quality: CameraQuality) => void;
}

/**
 * Capture-resolution picker for the scanner. Higher presets give OCR more
 * pixels of the code pill (better recognition) at the cost of slower frames
 * on low-end devices; the camera restarts when the value changes.
 */
export function CameraQualitySelect({ value, onChange }: CameraQualitySelectProps) {
  return (
    <label className="toggle-control camera-quality">
      <span>Camera quality</span>
      <select
        aria-label="Camera quality"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value as CameraQuality)}
      >
        {Object.entries(CAMERA_QUALITY_PRESETS).map(([key, preset]) => (
          <option key={key} value={key}>
            {preset.label}
          </option>
        ))}
      </select>
    </label>
  );
}
