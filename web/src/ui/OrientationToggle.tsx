export type Orientation = 'portrait' | 'landscape';

interface OrientationToggleProps {
  value: Orientation;
  onChange: (o: Orientation) => void;
}

export function OrientationToggle({ value, onChange }: OrientationToggleProps) {
  return (
    <div role="group" aria-label="Sticker orientation" className="orientation-toggle">
      <button
        type="button"
        className={`seg-btn${value === 'portrait' ? ' active' : ''}`}
        aria-pressed={value === 'portrait'}
        onClick={() => { if (value !== 'portrait') onChange('portrait'); }}
      >
        Portrait
      </button>
      <button
        type="button"
        className={`seg-btn${value === 'landscape' ? ' active' : ''}`}
        aria-pressed={value === 'landscape'}
        onClick={() => { if (value !== 'landscape') onChange('landscape'); }}
      >
        Landscape
      </button>
    </div>
  );
}
