import { useCallback, useEffect, useState } from 'react';
import type { AlbumRepo } from '../storage/types';
import type { Clock } from '../storage/types';
import { ALBUM_GROUPS, stickerNumbers } from '../domain/album-config';
import { toAlbumOwnedExport, toAlbumMissingExport } from '../export/album-export';
import { TeamCard } from './TeamCard';
import { AlbumGroupedGrid } from './AlbumGroupedGrid';
import { CommandBar } from './CommandBar';

const ALL_GROUPS = ['FWC', ...ALBUM_GROUPS.map((g) => g.letter)] as const;

interface AlbumViewProps {
  userName: string;
  albumRepo: AlbumRepo;
  downloadText: (filename: string, content: string) => void;
  now: Clock;
  readOnly?: boolean;
}

export function AlbumView({
  userName,
  albumRepo,
  downloadText,
  now,
  readOnly = false,
}: AlbumViewProps) {
  const [ownedCodes, setOwnedCodes] = useState<Set<string>>(new Set());
  const [groupFilter, setGroupFilter] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  function toggleGroup(g: string) {
    setGroupFilter((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }

  useEffect(() => {
    void albumRepo.listByUser(userName).then((entries) => {
      setOwnedCodes(new Set(entries.map((e) => e.normalizedCode)));
    });
  }, [albumRepo, userName]);

  const handleToggle = useCallback(
    async (code: string) => {
      if (readOnly) return;
      const result = await albumRepo.toggle(userName, code);
      setOwnedCodes((prev) => {
        const next = new Set(prev);
        if (result === 'added') next.add(code);
        else next.delete(code);
        return next;
      });
    },
    [albumRepo, readOnly, userName],
  );

  const handleSetAll = useCallback(
    async (prefix: string, owned: boolean) => {
      if (readOnly) return;
      const codes = stickerNumbers(prefix).map((n) => `${prefix}${n}`);
      await albumRepo.setMany(userName, codes, owned);
      setOwnedCodes((prev) => {
        const next = new Set(prev);
        for (const code of codes) {
          if (owned) next.add(code);
          else next.delete(code);
        }
        return next;
      });
    },
    [albumRepo, readOnly, userName],
  );

  function handleExportOwned() {
    downloadText(
      `${userName}-album-owned.txt`,
      toAlbumOwnedExport(userName, ownedCodes, now),
    );
  }

  function handleExportMissing() {
    downloadText(
      `${userName}-album-missing.txt`,
      toAlbumMissingExport(userName, ownedCodes, now),
    );
  }

  return (
    <section aria-label="My Album">
      <CommandBar
        groups={ALL_GROUPS}
        activeGroups={groupFilter}
        onToggleGroup={toggleGroup}
        onClearFilter={() => setGroupFilter(new Set())}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <AlbumGroupedGrid
        groupFilter={groupFilter}
        searchQuery={searchQuery}
        renderTeam={({ prefix, fullName, flag }) => (
          <TeamCard
            prefix={prefix}
            fullName={fullName}
            flag={flag}
            numbers={stickerNumbers(prefix)}
            ownedCodes={ownedCodes}
            onToggle={handleToggle}
            onSetAll={handleSetAll}
            readOnly={readOnly}
          />
        )}
      />
      <div className="album-footer">
        <button type="button" className="primary" onClick={handleExportOwned}>
          Export owned
        </button>
        <button type="button" className="secondary" onClick={handleExportMissing}>
          Export missing
        </button>
      </div>
    </section>
  );
}
