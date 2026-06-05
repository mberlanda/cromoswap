import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MaskOverlay } from '../src/ui/MaskOverlay';
import maskConfig from '../src/assets/mask-config.json';
import { centeredRect, PREVIEW_BOX_ASPECT } from '../src/ocr/geometry';

describe('MaskOverlay', () => {
  it('positions the ROI box from the portrait mask config (relative to the frame)', () => {
    render(<MaskOverlay orientation="portrait" size={0.8} />);
    const box = screen.getByTestId('roi-box');
    const roi = maskConfig.orientations.portrait.roi;
    expect(box.style.left).toBe(`${roi.x * 100}%`);
    expect(box.style.width).toBe(`${roi.w * 100}%`);
  });

  it('positions the ROI box from the landscape mask config', () => {
    render(<MaskOverlay orientation="landscape" size={0.8} />);
    const box = screen.getByTestId('roi-box');
    const roi = maskConfig.orientations.landscape.roi;
    expect(box.style.top).toBe(`${roi.y * 100}%`);
  });

  it('draws a centered sticker frame sized from the geometry helper', () => {
    render(<MaskOverlay orientation="portrait" size={0.8} />);
    const frame = screen.getByTestId('sticker-frame');
    const rect = centeredRect('portrait', 0.8, PREVIEW_BOX_ASPECT);
    expect(frame.style.left).toBe(`${rect.x * 100}%`);
    expect(frame.style.width).toBe(`${rect.w * 100}%`);
    expect(frame.style.height).toBe(`${rect.h * 100}%`);
  });

  it('flips the frame to the targeted state only when targeted', () => {
    const { rerender } = render(<MaskOverlay orientation="portrait" size={0.8} targeted={false} />);
    expect(screen.getByTestId('sticker-frame').className).not.toContain('targeted');
    rerender(<MaskOverlay orientation="portrait" size={0.8} targeted />);
    expect(screen.getByTestId('sticker-frame').className).toContain('targeted');
  });
});
