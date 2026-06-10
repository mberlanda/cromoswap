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

function makeCappedAlbumRepo(): AlbumRepo {
  return {
    toggle: vi.fn(async () => 'added'),
    setMany: vi.fn(async () => {}),
    listByUser: vi.fn(async (userName: string) => {
      if (userName !== 'Mauro') return [];
      return Array.from({ length: 25 }, (_, idx) => ({
        id: `c-${idx}`,
        userName,
        normalizedCode: 'ARG01',
        ownedAt: `2026-06-01T12:${idx.toString().padStart(2, '0')}:00.000Z`,
      }));
    }),
  };
}

describe('StickerStatsTab', () => {
  it('renders category progress rows and summary for the selected player', async () => {
    render(
      <StickerStatsTab
        albumRepo={makeAlbumRepo()}
        defaultPlayerName="Mauro"
        playerNames={['Mauro', 'Luca']}
      />,
    );

    expect(await screen.findByTestId('stats-summary')).toHaveTextContent('Mauro: 3 owned stickers');
    expect(screen.getByTestId('stats-row-ARG')).toBeInTheDocument();
    expect(screen.getByTestId('stats-row-FWC')).toBeInTheDocument();
    expect(screen.getByTestId('stats-top-completion')).toHaveTextContent('Top completion:');
    expect(screen.getByTestId('stats-top-missing')).toHaveTextContent('Biggest gap:');
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

  it('supports sorting and caps category completion at 20', async () => {
    const user = userEvent.setup();

    render(
      <StickerStatsTab
        albumRepo={makeCappedAlbumRepo()}
        defaultPlayerName="Mauro"
        playerNames={['Mauro']}
      />,
    );

    expect(await screen.findByTestId('stats-summary')).toHaveTextContent('Mauro: 20 owned stickers');
    expect(screen.getByTestId('stats-row-ARG')).toHaveTextContent('20/20');

    await user.selectOptions(screen.getByTestId('stats-sort-select'), 'completion-desc');
    expect(screen.getByTestId('stats-top-completion')).toHaveTextContent('ARG 20/20');
  });
});
