export type RepsMode = 'remove' | 'add' | 'clear';

interface RepsModeToggleProps {
  value: RepsMode;
  onChange: (mode: RepsMode) => void;
}

const MODES: { mode: RepsMode; label: string; hint: string; cls: string }[] = [
  { mode: 'remove', label: '– 1', hint: 'give away', cls: 'reps-mode-remove' },
  { mode: 'add', label: '+ 1', hint: 'got one', cls: 'reps-mode-add' },
  { mode: 'clear', label: '⌫ Clear', hint: 'set to 0', cls: 'reps-mode-clear' },
];

export function RepsModeToggle({ value, onChange }: RepsModeToggleProps) {
  return (
    <div className="reps-mode-toggle" role="group" aria-label="Tap mode">
      {MODES.map(({ mode, label, hint, cls }) => {
        const active = value === mode;
        return (
          <button
            key={mode}
            type="button"
            className={`reps-mode-btn ${cls}${active ? ' reps-mode-active' : ''}`}
            aria-pressed={active}
            onClick={() => onChange(mode)}
          >
            <span className="reps-mode-label">{label}</span>
            <small>{hint}</small>
          </button>
        );
      })}
    </div>
  );
}
