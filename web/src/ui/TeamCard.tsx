interface TeamCardProps {
  prefix: string;
  fullName: string;
  flag: string;
  numbers: string[];
  ownedCodes: Set<string>;
  onToggle: (code: string) => void;
}

export function TeamCard({ prefix, fullName, flag, numbers, ownedCodes, onToggle }: TeamCardProps) {
  const ownedCount = numbers.filter((n) => ownedCodes.has(`${prefix}${n}`)).length;

  return (
    <div className="team-card">
      <div className="team-card-header">
        <span className="team-card-name">
          {flag && <span className="team-flag" aria-hidden="true">{flag}</span>}
          <strong>{prefix}</strong> · {fullName}
        </span>
        <span className="team-card-count">{ownedCount} / {numbers.length}</span>
      </div>
      <div className="team-card-chips">
        {numbers.map((n) => {
          const code = `${prefix}${n}`;
          const owned = ownedCodes.has(code);
          return (
            <button
              key={n}
              type="button"
              className={`chip${owned ? ' chip-owned' : ''}`}
              aria-label={owned ? `${code} owned, tap to remove` : `${code} not owned, tap to add`}
              aria-pressed={owned}
              onClick={() => onToggle(code)}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
