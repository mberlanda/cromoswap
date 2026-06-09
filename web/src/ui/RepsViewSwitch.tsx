import type { RepsViewMode } from './RepsView';

interface RepsViewSwitchProps {
  value: RepsViewMode;
  onChange: (mode: RepsViewMode) => void;
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M13 2.5l2.5 2.5-9 9L3 15l.5-3.5 9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 4.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 5l1.5-2h3L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="9" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const OPTIONS: Array<{ mode: RepsViewMode; label: string; Icon: () => ReturnType<typeof GridIcon> }> = [
  { mode: 'grid', label: 'Grid', Icon: GridIcon },
  { mode: 'manual', label: 'Manual', Icon: PenIcon },
  { mode: 'scan', label: 'Scan', Icon: CameraIcon },
];

export function RepsViewSwitch({ value, onChange }: RepsViewSwitchProps) {
  return (
    <div className="reps-view-switch" role="group" aria-label="Reps view">
      {OPTIONS.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          className={`reps-view-btn${value === mode ? ' reps-view-active' : ''}`}
          aria-pressed={value === mode}
          data-test-id={`reps-view-${mode}`}
          onClick={() => onChange(mode)}
        >
          <Icon />
          <span className="reps-view-label">{label}</span>
        </button>
      ))}
    </div>
  );
}
