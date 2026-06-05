import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App, type AppDeps } from './ui/App';
import { createAppDeps, getStorageMode, setStorageMode, type StorageMode } from './composition';

/** Browser bootstrap: build deps, re-building whenever storage mode changes. */
function Root() {
  const [mode, setMode] = useState<StorageMode>(getStorageMode);
  const [deps, setDeps] = useState<AppDeps | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDeps(null);
    setError(null);
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
