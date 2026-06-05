import { useCallback, useEffect, useRef, useState } from 'react';
import type { RankedCode, Scan, Session } from '../domain/types';
import type { Clock, ImageStore, ScanRepo, SessionRepo, AlbumRepo } from '../storage/types';
import { toTextExport } from '../export/text-export';
import { toJsonExport } from '../export/json-export';
import type { CameraResult, CameraState } from './camera-permission';
import type { LeaderboardEntry } from '../storage/sync-client';
import { SessionGate } from './SessionGate';
import { TabBar } from './TabBar';
import type { Tab } from './TabBar';
import { AlbumView } from './AlbumView';
import { RepsView } from './RepsView';
import { LeaderboardView } from './LeaderboardView';
import { CameraPermissionPanel } from './CameraPermissionPanel';
import { StorageModeToggle } from './StorageModeToggle';
import type { StorageMode } from '../composition';

export type Orientation = 'portrait' | 'landscape';

export interface Detection {
  candidate: RankedCode;
  imageDataUrl: string;
}

export interface AppDeps {
  sessionRepo: SessionRepo;
  scanRepo: ScanRepo;
  imageStore: ImageStore;
  albumRepo: AlbumRepo;
  /** Capture a frame and run the OCR pipeline; null when nothing valid found. */
  scanOnce: (orientation: Orientation) => Promise<Detection | null>;
  now: Clock;
  downloadText: (filename: string, content: string) => void;
  downloadJson: (filename: string, content: string) => void;
  /** Scan-loop timing (injectable for tests). */
  scanTimeoutMs?: number;
  delay?: (ms: number) => Promise<void>;
  nowMs?: () => number;
  /** Optional hook to bind the camera <video> element so capture can read it. */
  attachVideo?: (element: HTMLVideoElement | null) => void;
  /** Optional: trigger the browser camera permission prompt and start the stream. */
  startCamera?: () => Promise<CameraResult>;
  /** Optional: fetch the global leaderboard from the backend. */
  fetchLeaderboard?: () => Promise<LeaderboardEntry[]>;
}

interface AppProps {
  deps: AppDeps;
  storageMode?: StorageMode;
  onChangeMode?: (mode: StorageMode) => void;
}

export function App({ deps, storageMode, onChangeMode }: AppProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionScanCounts, setSessionScanCounts] = useState<Record<string, number>>({});
  const [sessionAlbumCounts, setSessionAlbumCounts] = useState<
    Record<string, { owned: number; missing: number }>
  >({});
  const [active, setActive] = useState<Session | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [detection, setDetection] = useState<Detection | null>(null);
  const [noDetection, setNoDetection] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [tab, setTab] = useState<Tab>('reps');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  // When startCamera is provided, camera starts only on user action; tests without it skip the panel.
  const [cameraState, setCameraState] = useState<CameraState>(
    deps.startCamera ? 'idle' : 'granted',
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  const SCAN_INTERVAL_MS = 300;
  const scanTimeoutMs = deps.scanTimeoutMs ?? 5000;
  const delay = deps.delay ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const nowMs = deps.nowMs ?? (() => Date.now());

  const TOTAL_STICKERS = 980;

  useEffect(() => {
    void deps.sessionRepo.list().then(async (list) => {
      setSessions(list);
      const counts: Record<string, number> = {};
      const albumCounts: Record<string, { owned: number; missing: number }> = {};
      for (const s of list) {
        const sessionScans = await deps.scanRepo.listBySession(s.id);
        counts[s.id] = sessionScans.length;
        const entries = await deps.albumRepo.listByUser(s.userName);
        const owned = entries.length;
        albumCounts[s.id] = { owned, missing: TOTAL_STICKERS - owned };
      }
      setSessionScanCounts(counts);
      setSessionAlbumCounts(albumCounts);
    });
  }, [deps]);

  // Bind the camera <video> whenever the granted scanner preview is mounted.
  useEffect(() => {
    if (active && tab === 'reps' && cameraState === 'granted') {
      deps.attachVideo?.(videoRef.current);
      return () => deps.attachVideo?.(null);
    }
    deps.attachVideo?.(null);
  }, [active, cameraState, tab, deps]);

  const refreshScans = useCallback(
    async (session: Session) => {
      const list = await deps.scanRepo.listBySession(session.id);
      setScans(list);
      const thumbs: Record<string, string> = {};
      for (const scan of list) {
        const dataUrl = await deps.imageStore.get(scan.id);
        if (dataUrl !== undefined) thumbs[scan.id] = dataUrl;
      }
      setThumbnails(thumbs);
    },
    [deps],
  );

  async function handleCreate(userName: string) {
    const session = await deps.sessionRepo.create(userName);
    setActive(session);
    setScans([]);
    setThumbnails({});
  }

  async function handleResume(sessionId: string) {
    const session = await deps.sessionRepo.get(sessionId);
    if (!session) return;
    setActive(session);
    await refreshScans(session);
  }

  async function storeScan(
    code: string,
    source: Scan['source'],
    confidence: number,
    imageDataUrl?: string,
  ) {
    if (!active) return;
    const scan = await deps.scanRepo.add({
      sessionId: active.id,
      normalizedCode: code,
      source,
      confidence,
      capturedAt: deps.now(),
    });
    if (imageDataUrl !== undefined) await deps.imageStore.put(scan.id, imageDataUrl);
    await refreshScans(active);
  }

  // Hold-while-focused: keep scanning the framed region until a valid code is
  // recognized or the timeout elapses, then prompt to confirm/correct or fail.
  async function handleCapture() {
    if (scanning) return;
    setDetection(null);
    setNoDetection(false);
    setScanning(true);
    const deadline = nowMs() + scanTimeoutMs;
    try {
      while (nowMs() < deadline) {
        const result = await deps.scanOnce(orientation);
        if (result) {
          setDetection(result);
          return;
        }
        await delay(SCAN_INTERVAL_MS);
      }
      setNoDetection(true);
    } finally {
      setScanning(false);
    }
  }

  async function handleConfirm(code: string) {
    if (detection) await storeScan(code, 'ocr', detection.candidate.confidence, detection.imageDataUrl);
    setDetection(null);
  }

  async function handleCorrect(code: string) {
    if (detection) await storeScan(code, 'manual', detection.candidate.confidence, detection.imageDataUrl);
    setDetection(null);
  }

  async function handleManualAdd(code: string) {
    await storeScan(code, 'manual', 1);
  }

  async function handleEdit(id: string, code: string) {
    await deps.scanRepo.update(id, { normalizedCode: code });
    if (active) await refreshScans(active);
  }

  async function handleDelete(id: string) {
    await deps.scanRepo.delete(id);
    await deps.imageStore.delete(id);
    if (active) await refreshScans(active);
  }

  function handleExportText() {
    if (!active) return;
    deps.downloadText(`${active.userName}-${active.id}.txt`, toTextExport(active, scans, deps.now));
  }

  async function handleExportJson() {
    if (!active) return;
    const json = await toJsonExport(active, scans, deps.imageStore, deps.now);
    deps.downloadJson(`${active.userName}-${active.id}.json`, JSON.stringify(json, null, 2));
  }

  async function handleRequestCamera() {
    if (!deps.startCamera) return;
    const result = await deps.startCamera();
    setCameraState(result.state);
  }

  function handleSkipToManual() {
    setCameraState('no-camera');
  }

  if (!active) {
    return (
      <SessionGate
        sessions={sessions}
        onCreate={handleCreate}
        onResume={handleResume}
        scanCounts={sessionScanCounts}
        albumCounts={sessionAlbumCounts}
        storageMode={storageMode}
        onChangeMode={onChangeMode}
      />
    );
  }

  async function handleRefreshLeaderboard() {
    if (!deps.fetchLeaderboard) return;
    setLeaderboardLoading(true);
    const entries = await deps.fetchLeaderboard();
    setLeaderboard(entries);
    setLeaderboardLoading(false);
  }

  function handleTabChange(next: Tab) {
    setTab(next);
    if (next === 'board') void handleRefreshLeaderboard();
  }

  return (
    <main aria-label="Scanner">
      <header className="app-header">
        <h1 className="app-header-name">{active.userName}</h1>
        <p className="app-header-meta">{scans.length} scan{scans.length !== 1 ? 's' : ''}</p>
        {storageMode && onChangeMode && (
          <StorageModeToggle mode={storageMode} onChange={onChangeMode} />
        )}
      </header>
      <TabBar active={tab} onChange={handleTabChange} showBoard={!!deps.fetchLeaderboard} />
      {tab === 'album' && (
        <AlbumView
          userName={active.userName}
          albumRepo={deps.albumRepo}
          downloadText={deps.downloadText}
          now={deps.now}
        />
      )}
      {tab === 'board' && (
        <LeaderboardView
          entries={leaderboard}
          loading={leaderboardLoading}
          onRefresh={handleRefreshLeaderboard}
        />
      )}
      {tab === 'reps' && cameraState !== 'granted' && (
        <CameraPermissionPanel
          state={cameraState}
          onRequest={handleRequestCamera}
          onSkip={handleSkipToManual}
        />
      )}
      {tab === 'reps' && cameraState === 'granted' && (
        <RepsView
          scans={scans}
          thumbnails={thumbnails}
          detection={detection}
          noDetection={noDetection}
          scanning={scanning}
          orientation={orientation}
          videoRef={videoRef}
          onCapture={handleCapture}
          onConfirm={handleConfirm}
          onCorrect={handleCorrect}
          onSkip={() => setDetection(null)}
          onRescan={() => setDetection(null)}
          onManualAdd={handleManualAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExportText={handleExportText}
          onExportJson={handleExportJson}
          onSetOrientation={setOrientation}
        />
      )}
    </main>
  );
}
