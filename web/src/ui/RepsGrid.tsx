import { useState } from 'react';
import { ALBUM_GROUPS, stickerNumbers } from '../domain/album-config';
import { AlbumGroupedGrid } from './AlbumGroupedGrid';
import { CommandBar } from './CommandBar';

const ALL_GROUPS = ['FWC', ...ALBUM_GROUPS.map((g) => g.letter)] as const;

export const REPS_CAP = 7;

interface RepsGridProps {
  /** Copy count per normalized code (e.g. { CRO02: 3 }). */
  counts: Record<string, number>;
  onTap: (code: string) => void;
}

function copiesLabel(count: number): string {
  if (count === 0) return 'no copies';
  return `${count} ${count === 1 ? 'copy' : 'copies'}`;
}

function TeamCounts({
  prefix,
  fullName,
  flag,
  counts,
  onTap,
}: {
  prefix: string;
  fullName: string;
  flag: string;
  counts: Record<string, number>;
  onTap: (code: string) => void;
}) {
  const numbers = stickerNumbers(prefix);
  let copies = 0;
  let spare = 0;
  for (const n of numbers) {
    const c = counts[`${prefix}${n}`] ?? 0;
    copies += c;
    if (c > 1) spare += c - 1;
  }

  return (
    <div className="team-card">
      <div className="team-card-header">
        <span className="team-card-name">
          {flag && <span className="team-flag" aria-hidden="true">{flag}</span>}
          <strong>{prefix}</strong> · {fullName}
        </span>
        <span className="team-card-count">{copies} copies · {spare} spare</span>
      </div>
      <div className="team-card-chips">
        {numbers.map((n) => {
          const code = `${prefix}${n}`;
          const count = counts[code] ?? 0;
          const have = count >= 1;
          const cap = count >= REPS_CAP;
          return (
            <button
              key={n}
              type="button"
              className={`rchip${have ? ' rchip-have' : ''}${cap ? ' rchip-cap' : ''}`}
              aria-label={`${code}, ${copiesLabel(count)}`}
              onClick={() => onTap(code)}
            >
              {n}
              {count >= 2 && <span className="rchip-badge">{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RepsGrid({ counts, onTap }: RepsGridProps) {
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

  return (
    <>
      <CommandBar
        groups={ALL_GROUPS}
        activeGroups={groupFilter}
        onToggleGroup={toggleGroup}
        onClearFilter={() => setGroupFilter(new Set())}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <AlbumGroupedGrid
        ariaLabel="Reps grid"
        groupFilter={groupFilter}
        searchQuery={searchQuery}
        renderTeam={({ prefix, fullName, flag }) => (
          <TeamCounts prefix={prefix} fullName={fullName} flag={flag} counts={counts} onTap={onTap} />
        )}
      />
    </>
  );
}
