import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScanStatus } from '../src/ui/ScanStatus';

describe('ScanStatus', () => {
  it('renders nothing in idle state', () => {
    const { container } = render(<ScanStatus state="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows scanning message with scanning class', () => {
    render(<ScanStatus state="scanning" />);
    const el = screen.getByRole('status');
    expect(el).toHaveTextContent('Scanning');
    expect(el).toHaveClass('scanning');
  });

  it('shows no-detection message with no-detection class', () => {
    render(<ScanStatus state="no-detection" />);
    const el = screen.getByRole('status');
    expect(el).toHaveTextContent('No code detected');
    expect(el).toHaveClass('no-detection');
  });
});
