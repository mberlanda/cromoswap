import maskConfig from '../assets/mask-config.json';

type Orientation = keyof typeof maskConfig.orientations;

interface MaskOverlayProps {
  orientation: Orientation;
}

/**
 * Draws the scan-area guide with an emphasized top-right ROI target box,
 * positioned from the corpus-derived mask config for the given orientation.
 */
export function MaskOverlay({ orientation }: MaskOverlayProps) {
  const roi = maskConfig.orientations[orientation].roi;
  return (
    <div className="mask-overlay" aria-hidden="true">
      <div
        data-testid="roi-box"
        className="roi-box"
        style={{
          position: 'absolute',
          left: `${roi.x * 100}%`,
          top: `${roi.y * 100}%`,
          width: `${roi.w * 100}%`,
          height: `${roi.h * 100}%`,
        }}
      />
    </div>
  );
}
