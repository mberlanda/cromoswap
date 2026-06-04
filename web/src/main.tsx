import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App, type AppDeps } from './ui/App';
import { createAppDeps } from './composition';

/** Browser bootstrap: build deps (IndexedDB, camera, OCR), then mount the App. */
function Root() {
  const [deps, setDeps] = useState<AppDeps | null>(null);

  useEffect(() => {
    void createAppDeps().then(setDeps);
  }, []);

  return deps ? <App deps={deps} /> : <p>Starting…</p>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
