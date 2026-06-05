import type { StorageMode } from '../composition';

interface StorageModeToggleProps {
  mode: StorageMode;
  onChange: (mode: StorageMode) => void;
}

export function StorageModeToggle({ mode, onChange }: StorageModeToggleProps) {
  return (
    <div className="storage-toggle" role="group" aria-label="Storage mode">
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'local'}
        className={mode === 'local' ? 'storage-toggle-btn active' : 'storage-toggle-btn'}
        onClick={() => onChange('local')}
        title="Store data locally on this device only"
      >
        Local
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'cloud'}
        className={mode === 'cloud' ? 'storage-toggle-btn active' : 'storage-toggle-btn'}
        onClick={() => onChange('cloud')}
        title="Store data on the server — visible across devices and on the leaderboard"
      >
        Cloud
      </button>
    </div>
  );
}
