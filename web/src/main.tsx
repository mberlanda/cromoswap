import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App, type AppDeps } from './ui/App';
import { createAppDeps } from './composition';

/** Browser bootstrap: hold the camera <video>, build deps, then mount the App. */
function Root() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [deps, setDeps] = useState<AppDeps | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    void createAppDeps(videoRef.current).then(setDeps);
  }, []);

  return (
    <>
      <video ref={videoRef} playsInline muted className="camera-preview" />
      {deps ? <App deps={deps} /> : <p>Starting camera…</p>}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
