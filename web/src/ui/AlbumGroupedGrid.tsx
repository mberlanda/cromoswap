import { Fragment, type ReactNode } from 'react';
import { ALBUM_GROUPS, teamFullName, teamFlag } from '../domain/album-config';

export interface TeamMeta {
  prefix: string;
  fullName: string;
  flag: string;
}

interface AlbumGroupedGridProps {
  /** Optional aria-label on the list wrapper (the album grid omits it). */
  ariaLabel?: string;
  /** Render one team card; called for FWC and every team in groups A–L. */
  renderTeam: (team: TeamMeta) => ReactNode;
  /** When non-empty, only render groups whose letter (or 'FWC') is in the set. */
  groupFilter?: Set<string>;
  /** Case-insensitive substring filter on team prefix and full name. */
  searchQuery?: string;
}

function matchesSearch(prefix: string, fullName: string, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return prefix.toLowerCase().includes(q) || fullName.toLowerCase().includes(q);
}

export function AlbumGroupedGrid({ ariaLabel, renderTeam, groupFilter, searchQuery = '' }: AlbumGroupedGridProps) {
  const noFilter = !groupFilter || groupFilter.size === 0;
  const showFwc = (noFilter || groupFilter.has('FWC')) && matchesSearch('FWC', 'FIFA World Cup', searchQuery);
  const visibleGroups = ALBUM_GROUPS
    .filter(({ letter }) => noFilter || groupFilter.has(letter))
    .map(({ letter, prefixes }) => ({
      letter,
      prefixes: prefixes.filter((p) => matchesSearch(p, teamFullName(p), searchQuery)),
    }))
    .filter(({ prefixes }) => prefixes.length > 0);

  return (
    <div className="album-list" aria-label={ariaLabel}>
      {showFwc && (
        <div className="album-group">
          <h3 className="album-group-header">🏆 FIFA World Cup</h3>
          {renderTeam({ prefix: 'FWC', fullName: 'FIFA World Cup', flag: '🏆' })}
        </div>
      )}
      {visibleGroups.map(({ letter, prefixes }) => (
        <div key={letter} className="album-group">
          <h3 className="album-group-header">Group {letter}</h3>
          {prefixes.map((prefix) => (
            <Fragment key={prefix}>
              {renderTeam({ prefix, fullName: teamFullName(prefix), flag: teamFlag(prefix) })}
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
