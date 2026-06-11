import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CameraQualitySelect } from '../src/ui/CameraQualitySelect';

describe('CameraQualitySelect', () => {
  it('lists the named presets and marks the current one selected', () => {
    render(<CameraQualitySelect value="fhd" onChange={() => {}} />);
    const select = screen.getByLabelText('Camera quality') as HTMLSelectElement;
    expect(select.value).toBe('fhd');
    const labels = [...select.options].map((o) => o.textContent);
    expect(labels).toEqual(['SD (640×480)', 'HD (1280×720)', 'Full HD (1920×1080)']);
  });

  it('reports the chosen preset', async () => {
    const onChange = vi.fn();
    render(<CameraQualitySelect value="fhd" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Camera quality'), 'hd');
    expect(onChange).toHaveBeenCalledWith('hd');
  });
});
