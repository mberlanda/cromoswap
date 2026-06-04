import { useCallback, useEffect, useState } from 'react';
import type { AlbumRepo } from '../storage/types';
import type { Clock } from '../storage/types';
import { ALBUM_ORDER, teamFullName, stickerNumbers } from '../domain/album-config';
import { toAlbumOwnedExport, toAlbumMissingExport } from '../export/album-export';
import { TeamCard } from './TeamCard';

interface AlbumViewProps {
  userName: string;
  albumRepo: AlbumRepo;
  downloadText: (filename: string, content: string) => void;
  now: Clock;
}

export function AlbumView({ userName, albumRepo, downloadText, now }: AlbumViewProps) {
  const [ownedCodes, setOwnedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    void albumRepo.listByUser(userName).then((entries) => {
      setOwnedCodes(new Set(entries.map((e) => e.normalizedCode)));
    });
  }, [albumRepo, userName]);

  const handleToggle = useCallback(
    async (code: string) => {
      const result = await albumRepo.toggle(userName, code);
      setOwnedCodes((prev) => {
        const next = new Set(prev);
        if (result === 'added') next.add(code);
        else next.delete(code);
        return next;
      });
    },
    [albumRepo, userName],
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
      <div className="album-list">
        {ALBUM_ORDER.map((prefix) => (
          <TeamCard
            key={prefix}
            prefix={prefix}
            fullName={teamFullName(prefix)}
            numbers={stickerNumbers(prefix)}
            ownedCodes={ownedCodes}
            onToggle={handleToggle}
          />
        ))}
      </div>
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
