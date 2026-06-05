interface TeamCardProps {
  prefix: string;
  fullName: string;
  flag: string;
  numbers: string[];
  ownedCodes: Set<string>;
  onToggle?: (code: string) => void;
  /** Mark every sticker in this team owned (true) or not owned (false). */
  onSetAll?: (prefix: string, owned: boolean) => void;
  readOnly?: boolean;
}

export function TeamCard({
  prefix,
  fullName,
  flag,
  numbers,
  ownedCodes,
  onToggle,
  onSetAll,
  readOnly = false,
}: TeamCardProps) {
  const ownedCount = numbers.filter((n) => ownedCodes.has(`${prefix}${n}`)).length;
  const complete = ownedCount === numbers.length;

  return (
    <div className="team-card">
      <div className="team-card-header">
        <span className="team-card-name">
          {flag && <span className="team-flag" aria-hidden="true">{flag}</span>}
          <strong>{prefix}</strong> · {fullName}
        </span>
        <span className="team-card-header-right">
          {!readOnly && onSetAll && (
            <button
              type="button"
              className={`all-toggle${complete ? ' all-toggle-clear' : ''}`}
              aria-label={complete ? `Clear all ${prefix}` : `Select all ${prefix}`}
              onClick={() => onSetAll(prefix, !complete)}
            >
              {complete ? 'Clear' : 'All'}
            </button>
          )}
          <span className="team-card-count">{ownedCount} / {numbers.length}</span>
        </span>
      </div>
      <div className="team-card-chips">
        {numbers.map((n) => {
          const code = `${prefix}${n}`;
          const owned = ownedCodes.has(code);
          const label = readOnly
            ? `${code} ${owned ? 'owned' : 'not owned'}`
            : owned
              ? `${code} owned, tap to remove`
              : `${code} not owned, tap to add`;
          return (
            <button
              key={n}
              type="button"
              className={`chip${owned ? ' chip-owned' : ''}`}
              aria-label={label}
              aria-pressed={owned}
              disabled={readOnly}
              onClick={() => onToggle?.(code)}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
