import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RepsGrid } from '../src/ui/RepsGrid';

function chip(label: string): HTMLButtonElement {
  const el = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  expect(el).toBeInTheDocument();
  return el!;
}

describe('RepsGrid', () => {
  it('renders a chip for every team number, zero copies by default', () => {
    render(<RepsGrid counts={{}} onTap={vi.fn()} />);
    expect(chip('FWC00, no copies')).toBeInTheDocument();
    expect(chip('CRO20, no copies')).toBeInTheDocument();
  });

  it('shows the copy count and a badge for stickers with 2 or more', () => {
    render(<RepsGrid counts={{ CRO02: 3, CRO05: 1 }} onTap={vi.fn()} />);
    expect(chip('CRO02, 3 copies')).toBeInTheDocument();
    expect(chip('CRO02, 3 copies')).toHaveTextContent('3'); // badge
    // single copy: marked owned but no numeric badge text beyond the number
    expect(chip('CRO05, 1 copy')).toBeInTheDocument();
  });

  it('calls onTap with the code when a chip is tapped', async () => {
    const onTap = vi.fn();
    render(<RepsGrid counts={{}} onTap={onTap} />);
    await userEvent.click(chip('CRO05, no copies'));
    expect(onTap).toHaveBeenCalledWith('CRO05');
  });

  it('marks a chip at the cap of 7 with a cap indicator', () => {
    render(<RepsGrid counts={{ CRO02: 7 }} onTap={vi.fn()} />);
    const el = chip('CRO02, 7 copies');
    expect(el.className).toContain('rchip-cap');
  });
});
