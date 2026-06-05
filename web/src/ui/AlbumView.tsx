import { useCallback, useEffect, useState } from 'react';
import type { AlbumRepo } from '../storage/types';
import type { Clock } from '../storage/types';
import { ALBUM_GROUPS, teamFullName, teamFlag, stickerNumbers } from '../domain/album-config';
import { toAlbumOwnedExport, toAlbumMissingExport } from '../export/album-export';
import { TeamCard } from './TeamCard';

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
        <div className="album-group">
          <h3 className="album-group-header">🏆 FIFA World Cup</h3>
          <TeamCard
            prefix="FWC"
            fullName="FIFA World Cup"
            flag="🏆"
            numbers={stickerNumbers('FWC')}
            ownedCodes={ownedCodes}
            onToggle={handleToggle}
            readOnly={readOnly}
          />
        </div>
        {ALBUM_GROUPS.map(({ letter, prefixes }) => (
          <div key={letter} className="album-group">
            <h3 className="album-group-header">Group {letter}</h3>
            {prefixes.map((prefix) => (
              <TeamCard
                key={prefix}
                prefix={prefix}
                fullName={teamFullName(prefix)}
                flag={teamFlag(prefix)}
                numbers={stickerNumbers(prefix)}
                ownedCodes={ownedCodes}
                onToggle={handleToggle}
                readOnly={readOnly}
              />
            ))}
          </div>
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
