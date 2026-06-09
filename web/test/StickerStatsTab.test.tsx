import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StickerStatsTab } from '../src/ui/StickerStatsTab';
import type { AlbumRepo } from '../src/storage/types';

function makeAlbumRepo(): AlbumRepo {
  return {
    toggle: vi.fn(async () => 'added'),
    setMany: vi.fn(async () => {}),
    listByUser: vi.fn(async (userName: string) => {
      if (userName === 'Mauro') {
        return [
          { id: '1', userName, normalizedCode: 'ARG01', ownedAt: '2026-06-01T12:00:00.000Z' },
          { id: '2', userName, normalizedCode: 'ARG01', ownedAt: '2026-06-01T13:00:00.000Z' },
          { id: '3', userName, normalizedCode: 'BRA05', ownedAt: '2026-06-01T14:00:00.000Z' },
        ];
      }
      return [
        { id: '4', userName, normalizedCode: 'ARG01', ownedAt: '2026-06-01T12:00:00.000Z' },
      ];
    }),
  };
}

describe('StickerStatsTab', () => {
  it('renders a 0..20 horizontal histogram and summary for the selected player', async () => {
    render(
      <StickerStatsTab
        albumRepo={makeAlbumRepo()}
        defaultPlayerName="Mauro"
        playerNames={['Mauro', 'Luca']}
      />,
    );

    expect(await screen.findByTestId('stats-summary')).toHaveTextContent('Mauro: 3 owned stickers');
    expect(screen.getByTestId('hist-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('hist-row-20')).toBeInTheDocument();
  });

  it('allows selecting another player (read-only)', async () => {
    const user = userEvent.setup();

    render(
      <StickerStatsTab
        albumRepo={makeAlbumRepo()}
        defaultPlayerName="Mauro"
        playerNames={['Mauro', 'Luca']}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/select player/i), 'Luca');
    expect(await screen.findByTestId('stats-summary')).toHaveTextContent('Luca: 1 owned sticker');
  });
});
