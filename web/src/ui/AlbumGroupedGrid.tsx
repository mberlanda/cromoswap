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
}

/**
 * The shared "FWC + groups A–L" scaffold used by both the album and the reps
 * grids. Callers supply how a single team renders; the grouping, headers and
 * ordering live here once.
 */
export function AlbumGroupedGrid({ ariaLabel, renderTeam }: AlbumGroupedGridProps) {
  return (
    <div className="album-list" aria-label={ariaLabel}>
      <div className="album-group">
        <h3 className="album-group-header">🏆 FIFA World Cup</h3>
        {renderTeam({ prefix: 'FWC', fullName: 'FIFA World Cup', flag: '🏆' })}
      </div>
      {ALBUM_GROUPS.map(({ letter, prefixes }) => (
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
