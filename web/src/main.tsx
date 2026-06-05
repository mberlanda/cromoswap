import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App, type AppDeps } from './ui/App';
import { createAppDeps } from './composition';

/** Browser bootstrap: build deps (IndexedDB, camera, OCR), then mount the App. */
function Root() {
  const [deps, setDeps] = useState<AppDeps | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createAppDeps().then(setDeps).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('createAppDeps failed:', err);
    });
  }, []);

  if (error) return <p style={{ padding: '1rem', color: 'red' }}>Failed to start: {error}</p>;
  if (!deps) return <p style={{ padding: '1rem' }}>Starting…</p>;
  return <App deps={deps} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
