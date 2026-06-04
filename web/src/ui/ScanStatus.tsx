type ScanState = 'idle' | 'scanning' | 'no-detection';

interface ScanStatusProps {
  state: ScanState;
}

export function ScanStatus({ state }: ScanStatusProps) {
  if (state === 'idle') return null;

  const message =
    state === 'scanning'
      ? 'Scanning…'
      : 'No code detected — try again or add manually.';

  return (
    <p role="status" className={`scan-status ${state}`}>
      {message}
    </p>
  );
}
