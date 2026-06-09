import { useEffect, useMemo, useState } from 'react';
import { ALBUM_ORDER, stickerNumbers } from '../domain/album-config';
import type { AlbumRepo } from '../storage/types';

const MAX_SCALE = 20;

interface StickerStatsTabProps {
  albumRepo: AlbumRepo;
  playerNames: readonly string[];
  defaultPlayerName: string;
}

function allStickerCodes(): string[] {
  const codes: string[] = [];
  for (const prefix of ALBUM_ORDER) {
    for (const num of stickerNumbers(prefix)) {
      codes.push(`${prefix}${num}`);
    }
  }
  return codes;
}

function buildHistogram(entries: string[]): number[] {
  const countsByCode = new Map<string, number>();
  for (const code of entries) {
    countsByCode.set(code, (countsByCode.get(code) ?? 0) + 1);
  }

  const bins = Array.from({ length: MAX_SCALE + 1 }, () => 0);
  for (const code of allStickerCodes()) {
    const count = countsByCode.get(code) ?? 0;
    const bucket = Math.min(MAX_SCALE, count);
    bins[bucket] += 1;
  }
  return bins;
}

export function StickerStatsTab({ albumRepo, playerNames, defaultPlayerName }: StickerStatsTabProps) {
  const [selectedPlayer, setSelectedPlayer] = useState(defaultPlayerName);
  const [histogram, setHistogram] = useState<number[]>(Array.from({ length: MAX_SCALE + 1 }, () => 0));
  const [loading, setLoading] = useState(true);

  const sortedPlayers = useMemo(
    () => [...new Set(playerNames)].sort((a, b) => a.localeCompare(b)),
    [playerNames],
  );

  const effectivePlayer = sortedPlayers.includes(selectedPlayer)
    ? selectedPlayer
    : (sortedPlayers[0] ?? defaultPlayerName);

  useEffect(() => {
    let cancelled = false;

    async function loadHistogram() {
      setLoading(true);
      try {
        const entries = await albumRepo.listByUser(effectivePlayer);
        if (cancelled) return;
        setHistogram(buildHistogram(entries.map((e) => e.normalizedCode)));
      } catch {
        if (cancelled) return;
        setHistogram(Array.from({ length: MAX_SCALE + 1 }, () => 0));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHistogram();
    return () => {
      cancelled = true;
    };
  }, [albumRepo, effectivePlayer]);

  const maxBin = Math.max(...histogram, 1);
  const totalOwned = histogram.reduce((acc, count, copies) => acc + count * copies, 0);
  const stickerLabel = totalOwned === 1 ? 'sticker' : 'stickers';

  return (
    <section aria-label="Sticker stats" className="stats-tab">
      <div className="stats-tab-header">
        <h2 className="stats-title">Sticker Histogram</h2>
        <label htmlFor="stats-player" className="stats-player-label">
          Player
        </label>
        <select
          id="stats-player"
          data-test-id="stats-player-select"
          value={effectivePlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          aria-label="Select player"
        >
          {sortedPlayers.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <p className="stats-summary" data-test-id="stats-summary" data-testid="stats-summary">
        {effectivePlayer}: {totalOwned} owned {stickerLabel}
      </p>

      {loading ? (
        <p className="stats-chart-empty">Loading stats...</p>
      ) : (
        <div className="histogram" role="list" aria-label="Sticker copies histogram">
          {histogram.map((count, copies) => (
            <div
              key={copies}
              role="listitem"
              className="histogram-row"
              data-test-id={`hist-row-${copies}`}
              data-testid={`hist-row-${copies}`}
            >
              <span className="histogram-label">{copies}</span>
              <div className="histogram-track" aria-hidden="true">
                <div
                  className="histogram-bar"
                  style={{ width: `${(count / maxBin) * 100}%` }}
                />
              </div>
              <span className="histogram-value">{count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
