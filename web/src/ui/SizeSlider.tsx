export const SIZE_MIN = 0.4;
export const SIZE_MAX = 0.95;
export const SIZE_DEFAULT = 0.8;

interface SizeSliderProps {
  value: number;
  onChange: (size: number) => void;
}

/**
 * Tuning control for the scan guide: scales the centered frame between
 * SIZE_MIN and SIZE_MAX (fraction of the matching preview-box dimension).
 */
export function SizeSlider({ value, onChange }: SizeSliderProps) {
  return (
    <label className="size-slider">
      <span className="size-slider-label">Frame size</span>
      <input
        type="range"
        min={SIZE_MIN}
        max={SIZE_MAX}
        step={0.01}
        value={value}
        aria-label="Frame size"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
