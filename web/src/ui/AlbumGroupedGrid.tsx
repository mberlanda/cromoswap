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
  const fwcMeta: TeamMeta = { prefix: 'FWC', fullName: 'FIFA World Cup', flag: '🏆' };
  const showFwc = (noFilter || groupFilter.has('FWC')) && matchesSearch(fwcMeta.prefix, fwcMeta.fullName, searchQuery);
  const visibleGroups = ALBUM_GROUPS
    .filter(({ letter }) => noFilter || groupFilter.has(letter))
    .map(({ letter, prefixes }) => ({
      letter,
      teams: prefixes
        .map((p): TeamMeta => ({ prefix: p, fullName: teamFullName(p), flag: teamFlag(p) }))
        .filter(({ prefix, fullName }) => matchesSearch(prefix, fullName, searchQuery)),
    }))
    .filter(({ teams }) => teams.length > 0);

  return (
    <div className="album-list" aria-label={ariaLabel}>
      {showFwc && (
        <div className="album-group">
          <h3 className="album-group-header">🏆 FIFA World Cup</h3>
          {renderTeam(fwcMeta)}
        </div>
      )}
      {visibleGroups.map(({ letter, teams }) => (
        <div key={letter} className="album-group">
          <h3 className="album-group-header">Group {letter}</h3>
          {teams.map((team) => (
            <Fragment key={team.prefix}>
              {renderTeam(team)}
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
