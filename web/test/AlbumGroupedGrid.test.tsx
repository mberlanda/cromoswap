import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlbumGroupedGrid, type TeamMeta } from '../src/ui/AlbumGroupedGrid';

describe('AlbumGroupedGrid', () => {
  it('renders FWC plus groups A–L and calls renderTeam for every team', () => {
    const teams: TeamMeta[] = [];
    render(
      <AlbumGroupedGrid
        ariaLabel="Test grid"
        renderTeam={(team) => {
          teams.push(team);
          return <span>{team.prefix}</span>;
        }}
      />,
    );

    // FWC first, then 12 groups × 4 teams = 49 total.
    expect(teams[0]).toMatchObject({ prefix: 'FWC', fullName: 'FIFA World Cup', flag: '🏆' });
    expect(teams).toHaveLength(49);

    expect(screen.getByText('🏆 FIFA World Cup')).toBeInTheDocument();
    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Group L')).toBeInTheDocument();
    // Resolves real team metadata for a known prefix.
    expect(teams.some((t) => t.prefix === 'BRA' && t.fullName === 'Brazil')).toBe(true);
  });
});
