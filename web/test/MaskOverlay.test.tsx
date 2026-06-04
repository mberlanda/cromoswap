import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MaskOverlay } from '../src/ui/MaskOverlay';
import maskConfig from '../src/assets/mask-config.json';

describe('MaskOverlay', () => {
  it('positions the ROI box from the portrait mask config', () => {
    render(<MaskOverlay orientation="portrait" />);
    const box = screen.getByTestId('roi-box');
    const roi = maskConfig.orientations.portrait.roi;
    expect(box.style.left).toBe(`${roi.x * 100}%`);
    expect(box.style.width).toBe(`${roi.w * 100}%`);
  });

  it('positions the ROI box from the landscape mask config', () => {
    render(<MaskOverlay orientation="landscape" />);
    const box = screen.getByTestId('roi-box');
    const roi = maskConfig.orientations.landscape.roi;
    expect(box.style.top).toBe(`${roi.y * 100}%`);
  });
});
