import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App, type AppDeps } from './ui/App';
import { createAppDeps, getStorageMode, setStorageMode, type StorageMode } from './composition';

/** Browser bootstrap: build deps, re-building whenever storage mode changes. */
// This is the entry module (it renders on import), so the component lives here
// rather than in a fast-refreshable file of its own.
// eslint-disable-next-line react-refresh/only-export-components
function Root() {
  const [mode, setMode] = useState<StorageMode>(getStorageMode);
  const [deps, setDeps] = useState<AppDeps | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Intentional synchronous reset to the loading state on mode change, so the
    // UI shows "Starting…" immediately before the async rebuild resolves.
    /* eslint-disable react-hooks/set-state-in-effect */
    setDeps(null);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    createAppDeps(mode).then(setDeps).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('createAppDeps failed:', err);
    });
  }, [mode]);

  const handleChangeMode = useCallback((next: StorageMode) => {
    setStorageMode(next);
    setMode(next);
  }, []);

  if (error) return <p style={{ padding: '1rem', color: 'red' }}>Failed to start: {error}</p>;
  if (!deps) return <p style={{ padding: '1rem' }}>Starting…</p>;
  return <App deps={deps} storageMode={mode} onChangeMode={handleChangeMode} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
