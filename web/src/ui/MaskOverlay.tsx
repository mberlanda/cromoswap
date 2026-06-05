import maskConfig from '../assets/mask-config.json';
import { centeredRect, PREVIEW_BOX_ASPECT, type Orientation } from '../ocr/geometry';

interface MaskOverlayProps {
  orientation: Orientation;
  /** Guide size: longer side as a fraction of the matching box dimension. */
  size: number;
  /** True when a sticker is well framed; flips the frame border green. */
  targeted?: boolean;
}

/**
 * Draws the scan guide: a centered rectangle locked to the sticker's physical
 * aspect ratio (3:4 portrait / 4:3 landscape), with the top-right OCR ROI box
 * nested inside it. The frame border turns green when `targeted`.
 */
export function MaskOverlay({ orientation, size, targeted = false }: MaskOverlayProps) {
  const frame = centeredRect(orientation, size, PREVIEW_BOX_ASPECT);
  const roi = maskConfig.orientations[orientation].roi;
  return (
    <div className="mask-overlay" aria-hidden="true">
      <div
        data-testid="sticker-frame"
        className={`sticker-frame${targeted ? ' targeted' : ''}`}
        style={{
          position: 'absolute',
          left: `${frame.x * 100}%`,
          top: `${frame.y * 100}%`,
          width: `${frame.w * 100}%`,
          height: `${frame.h * 100}%`,
        }}
      >
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
    </div>
  );
}
