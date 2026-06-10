import { useEffect, useMemo, useState } from 'react';
import { ALBUM_ORDER, teamFlag, teamFullName, teamGroup } from '../domain/album-config';
import type { AlbumRepo } from '../storage/types';

const CATEGORY_TARGET = 20;

type SortStrategy = 'missing-desc' | 'completion-desc' | 'owned-desc' | 'album-order';

interface PrefixProgress {
  prefix: string;
  flag: string;
  teamName: string;
  group: string;
  owned: number;
  missing: number;
  completion: number;
}

interface StickerStatsTabProps {
  albumRepo: AlbumRepo;
  playerNames: readonly string[];
  defaultPlayerName: string;
}

function buildPrefixProgress(entries: string[]): PrefixProgress[] {
  const countsByPrefix = new Map<string, number>();
  for (const prefix of ALBUM_ORDER) {
    countsByPrefix.set(prefix, 0);
  }

  for (const code of entries) {
    const prefix = code.slice(0, 3);
    if (!countsByPrefix.has(prefix)) continue;
    countsByPrefix.set(prefix, (countsByPrefix.get(prefix) ?? 0) + 1);
  }

  return ALBUM_ORDER.map((prefix) => {
    const owned = Math.min(CATEGORY_TARGET, countsByPrefix.get(prefix) ?? 0);
    const missing = Math.max(0, CATEGORY_TARGET - owned);
    return {
      prefix,
      flag: teamFlag(prefix),
      teamName: teamFullName(prefix),
      group: teamGroup(prefix) ?? 'FWC',
      owned,
      missing,
      completion: owned / CATEGORY_TARGET,
    };
  });
}

function sortProgress(progress: PrefixProgress[], strategy: SortStrategy): PrefixProgress[] {
  const albumIndex = new Map(ALBUM_ORDER.map((prefix, idx) => [prefix, idx]));
  return [...progress].sort((a, b) => {
    if (strategy === 'missing-desc') {
      if (b.missing !== a.missing) return b.missing - a.missing;
      if (a.owned !== b.owned) return a.owned - b.owned;
      return a.prefix.localeCompare(b.prefix);
    }
    if (strategy === 'completion-desc') {
      if (b.completion !== a.completion) return b.completion - a.completion;
      if (b.owned !== a.owned) return b.owned - a.owned;
      return a.prefix.localeCompare(b.prefix);
    }
    if (strategy === 'owned-desc') {
      if (b.owned !== a.owned) return b.owned - a.owned;
      if (a.missing !== b.missing) return a.missing - b.missing;
      return a.prefix.localeCompare(b.prefix);
    }
    return (albumIndex.get(a.prefix) ?? 0) - (albumIndex.get(b.prefix) ?? 0);
  });
}

export function StickerStatsTab({ albumRepo, playerNames, defaultPlayerName }: StickerStatsTabProps) {
  const [selectedPlayer, setSelectedPlayer] = useState(defaultPlayerName);
  const [sortStrategy, setSortStrategy] = useState<SortStrategy>('missing-desc');
  const [progressRows, setProgressRows] = useState<PrefixProgress[]>(
    ALBUM_ORDER.map((prefix) => ({
      prefix,
      flag: teamFlag(prefix),
      teamName: teamFullName(prefix),
      group: teamGroup(prefix) ?? 'FWC',
      owned: 0,
      missing: CATEGORY_TARGET,
      completion: 0,
    })),
  );
  const [totalOwned, setTotalOwned] = useState(0);
  const [loading, setLoading] = useState(true);

  const sortedPlayers = useMemo(
    () => [...new Set(playerNames)].sort((a, b) => a.localeCompare(b)),
    [playerNames],
  );

  const effectivePlayer = sortedPlayers.includes(selectedPlayer)
    ? selectedPlayer
    : (sortedPlayers[0] ?? defaultPlayerName);

  const sortedRows = useMemo(
    () => sortProgress(progressRows, sortStrategy),
    [progressRows, sortStrategy],
  );

  const completeCategories = useMemo(
    () => progressRows.filter((row) => row.missing === 0).length,
    [progressRows],
  );

  const topCompletion = useMemo(
    () => sortProgress(progressRows, 'completion-desc')[0],
    [progressRows],
  );

  const topMissing = useMemo(
    () => sortProgress(progressRows, 'missing-desc')[0],
    [progressRows],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      setLoading(true);
      try {
        const entries = await albumRepo.listByUser(effectivePlayer);
        if (cancelled) return;
        const normalizedCodes = entries.map((e) => e.normalizedCode);
        const progress = buildPrefixProgress(normalizedCodes);
        setProgressRows(progress);
        setTotalOwned(progress.reduce((total, row) => total + row.owned, 0));
      } catch {
        if (cancelled) return;
        setProgressRows(
          ALBUM_ORDER.map((prefix) => ({
            prefix,
            flag: teamFlag(prefix),
            teamName: teamFullName(prefix),
            group: teamGroup(prefix) ?? 'FWC',
            owned: 0,
            missing: CATEGORY_TARGET,
            completion: 0,
          })),
        );
        setTotalOwned(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProgress();
    return () => {
      cancelled = true;
    };
  }, [albumRepo, effectivePlayer]);

  const stickerLabel = totalOwned === 1 ? 'sticker' : 'stickers';

  return (
    <section aria-label="Sticker stats" className="stats-tab">
      <div className="stats-tab-header">
        <h2 className="stats-title">Sticker Category Progress</h2>
        <div className="stats-controls">
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

          <label htmlFor="stats-sort" className="stats-player-label">
            Sort
          </label>
          <select
            id="stats-sort"
            data-test-id="stats-sort-select"
            data-testid="stats-sort-select"
            value={sortStrategy}
            onChange={(e) => setSortStrategy(e.target.value as SortStrategy)}
            aria-label="Sort categories"
          >
            <option value="missing-desc">Missing (highest first)</option>
            <option value="completion-desc">Completion (highest first)</option>
            <option value="owned-desc">Owned (highest first)</option>
            <option value="album-order">Album order</option>
          </select>
        </div>
      </div>

      <p className="stats-summary" data-test-id="stats-summary" data-testid="stats-summary">
        {effectivePlayer}: {totalOwned} owned {stickerLabel} · {completeCategories} complete categories
      </p>

      <div className="stats-insights" aria-live="polite">
        {topCompletion ? (
          <p className="stats-insight" data-test-id="stats-top-completion" data-testid="stats-top-completion">
            Top completion: {topCompletion.flag || '🏳️'} {topCompletion.prefix} {topCompletion.owned}/{CATEGORY_TARGET}
          </p>
        ) : null}
        {topMissing ? (
          <p className="stats-insight" data-test-id="stats-top-missing" data-testid="stats-top-missing">
            Biggest gap: {topMissing.flag || '🏳️'} {topMissing.prefix} missing {topMissing.missing}
          </p>
        ) : null}
      </div>

      {loading ? (
        <p className="stats-chart-empty">Loading stats...</p>
      ) : (
        <div className="stats-progress-list" role="list" aria-label="Sticker progress by code">
          {sortedRows.map((row) => (
            <div
              key={row.prefix}
              role="listitem"
              className="stats-progress-row"
              data-test-id={`stats-row-${row.prefix}`}
              data-testid={`stats-row-${row.prefix}`}
            >
              <div className="stats-progress-code" title={`${row.teamName} · Group ${row.group}`}>
                <span className="stats-progress-flag" aria-hidden="true">{row.flag || '🏳️'}</span>
                <span>{row.prefix}</span>
              </div>
              <div className="stats-progress-track" aria-hidden="true">
                <div className="stats-progress-owned" style={{ width: `${row.completion * 100}%` }} />
                <div className="stats-progress-missing" style={{ width: `${row.missing / CATEGORY_TARGET * 100}%` }} />
              </div>
              <div className="stats-progress-values">
                <span className="stats-progress-owned-value">{row.owned}/{CATEGORY_TARGET}</span>
                <span className="stats-progress-missing-value">missing {row.missing}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
