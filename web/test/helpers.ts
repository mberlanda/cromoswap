import { expect } from 'vitest';
import { waitFor } from '@testing-library/react';

/** Wait for and return a <button> by its exact aria-label. */
export async function findByAriaLabel(label: string): Promise<HTMLButtonElement> {
  let button: HTMLButtonElement | null = null;
  await waitFor(() => {
    button = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    expect(button).toBeInTheDocument();
  });
  return button!;
}
