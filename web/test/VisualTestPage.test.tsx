import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisualTestPage } from '../src/ui/VisualTestPage';

describe('VisualTestPage', () => {
  it('renders mocked styled components for screenshot capture', async () => {
    render(<VisualTestPage />);

    expect(screen.getByRole('main', { name: /visual component showcase/i })).toBeInTheDocument();
    expect(screen.getByText(/visual component showcase/i)).toBeInTheDocument();
    expect(screen.getAllByRole('tablist').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('button', { name: /grid/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /cumulative owned stickers over time/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: /cloud/i }));
  });
});
