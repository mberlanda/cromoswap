export type SyncStatus = 'local' | 'pending' | 'synced' | 'failed';

interface SyncIndicatorProps {
  status: SyncStatus;
  onRetry?: () => void;
}

export function SyncIndicator({ status, onRetry }: SyncIndicatorProps) {
  if (status === 'synced') return null;
  const label =
    status === 'local' ? 'Local only' : status === 'pending' ? 'Syncing…' : 'Sync failed';
  return (
    <span className={`sync-indicator sync-${status}`} aria-label={label}>
      {label}
      {status === 'failed' && onRetry && (
        <button type="button" className="sync-retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </span>
  );
}
