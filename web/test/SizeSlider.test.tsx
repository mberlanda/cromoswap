import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { SizeSlider } from '../src/ui/SizeSlider';

describe('SizeSlider', () => {
  it('renders a labeled range reflecting the current value', () => {
    render(<SizeSlider value={0.8} onChange={vi.fn()} />);
    const slider = screen.getByRole('slider', { name: /frame size/i });
    expect(slider).toHaveValue('0.8');
    expect(slider).toHaveAttribute('min', '0.4');
    expect(slider).toHaveAttribute('max', '0.95');
  });

  it('reports the new numeric value on change', () => {
    const onChange = vi.fn();
    render(<SizeSlider value={0.8} onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider', { name: /frame size/i }), {
      target: { value: '0.6' },
    });
    expect(onChange).toHaveBeenCalledWith(0.6);
  });
});
