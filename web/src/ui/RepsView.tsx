import type { RefObject } from 'react';
import type { Scan } from '../domain/types';
import type { Detection, Orientation } from './App';
import type { CameraState } from './camera-permission';
import { MaskOverlay } from './MaskOverlay';
import { DetectionResult } from './DetectionResult';
import { ManualEntry } from './ManualEntry';
import { CollectionList } from './CollectionList';
import { ScanStatus } from './ScanStatus';
import { OrientationToggle } from './OrientationToggle';
import { SizeSlider } from './SizeSlider';
import { RepsGrid } from './RepsGrid';
import { RepsModeToggle } from './RepsModeToggle';
import type { RepsMode } from './RepsModeToggle';
import { RepsViewSwitch } from './RepsViewSwitch';
import { CameraPermissionPanel } from './CameraPermissionPanel';
import { countByCode } from '../domain/counts';

export type RepsViewMode = 'grid' | 'manual' | 'scan';

export interface RepsViewProps {
  /** When false, the Scan option is hidden and its view falls back to Manual. */
  cameraAvailable?: boolean;
  cameraState: CameraState;
  onRequestCamera: () => void;
  onSkipCamera: () => void;
  view: RepsViewMode;
  onSetView: (view: RepsViewMode) => void;
  mode: RepsMode;
  onSetMode: (mode: RepsMode) => void;
  onGridTap: (code: string) => void;
  scans: Scan[];
  thumbnails: Record<string, string>;
  detection: Detection | null;
  noDetection: boolean;
  scanning: boolean;
  cameraPaused: boolean;
  videoMode: boolean;
  orientation: Orientation;
  size: number;
  targeted: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onCapture: () => void;
  onResumeCamera: () => void;
  onPauseCamera: () => void;
  onToggleVideoMode: (enabled: boolean) => void;
  onConfirm: (code: string) => void;
  onCorrect: (code: string) => void;
  onSkip: () => void;
  onRescan: () => void;
  onManualAdd: (code: string) => void;
  onEdit: (id: string, code: string) => void;
  onDelete: (id: string) => void;
  onExportText: () => void;
  onExportJson: () => void;
  onSetOrientation: (o: Orientation) => void;
  onSetSize: (size: number) => void;
}

export function RepsView({
  cameraAvailable = true,
  cameraState,
  onRequestCamera,
  onSkipCamera,
  view, onSetView, mode, onSetMode, onGridTap,
  scans, thumbnails, detection, noDetection, scanning, cameraPaused, videoMode,
  orientation, size, targeted, videoRef, onCapture, onResumeCamera, onPauseCamera,
  onToggleVideoMode, onConfirm, onCorrect, onSkip, onRescan,
  onManualAdd, onEdit, onDelete, onExportText, onExportJson, onSetOrientation, onSetSize,
}: RepsViewProps) {
  const counts = countByCode(scans);
  const recentPrefixes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code]) => code.slice(0, 3))
    .filter((p, i, arr) => arr.indexOf(p) === i); // deduplicate

  const total = scans.length;
  const unique = Object.keys(counts).length;
  const duplicates = total - unique;

  return (
    <section aria-label="My Reps">
      <RepsViewSwitch value={view} onChange={onSetView} />

      {view === 'grid' && (
        <section aria-label="Reps grid view">
          <RepsModeToggle value={mode} onChange={onSetMode} />
          <RepsGrid counts={counts} onTap={onGridTap} />
        </section>
      )}

      {view === 'manual' && (
        <>
          <section aria-label="Manual entry">
            <h2>Add manually</h2>
            <ManualEntry onAdd={onManualAdd} recentPrefixes={recentPrefixes} />
          </section>
          <CollectionList
            scans={scans}
            thumbnails={thumbnails}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </>
      )}

      {view === 'scan' && (
      <>
      <section aria-label="Scan" className="scan-area">
        {cameraAvailable ? (
          <>
            <div className="camera-wrap">
              <video ref={videoRef} playsInline muted className="camera-preview" />
              <MaskOverlay orientation={orientation} size={size} targeted={targeted} />
              {videoMode && !cameraPaused && <div className="camera-pill">Auto collect</div>}
              {cameraPaused && (
                <div className="camera-state-overlay" role="status">
                  <p>Camera paused</p>
                  <button type="button" className="primary" onClick={onResumeCamera}>
                    Resume camera
                  </button>
                </div>
              )}
            </div>
            <ScanStatus state={scanning ? 'scanning' : noDetection ? 'no-detection' : 'idle'} />
            {detection && (
              <DetectionResult
                candidate={detection.candidate}
                imageDataUrl={detection.imageDataUrl}
                onConfirm={onConfirm}
                onCorrect={onCorrect}
                onSkip={onSkip}
                onRescan={onRescan}
              />
            )}
            <div className="scan-bottom">
              <div className="scan-mode-row">
                <label className="toggle-control">
                  <input
                    type="checkbox"
                    checked={videoMode}
                    onChange={(event) => onToggleVideoMode(event.currentTarget.checked)}
                  />
                  <span>Auto collect</span>
                </label>
                <button
                  type="button"
                  className="secondary"
                  onClick={onPauseCamera}
                  disabled={cameraPaused}
                >
                  Pause camera
                </button>
              </div>
              <OrientationToggle value={orientation} onChange={onSetOrientation} />
              <SizeSlider value={size} onChange={onSetSize} />
              <button
                type="button"
                className="primary full"
                onClick={onCapture}
                disabled={scanning || cameraPaused || videoMode}
              >
                {scanning ? 'Hold steady…' : videoMode ? 'Auto collect enabled' : 'Scan sticker'}
              </button>
            </div>
          </>
        ) : (
          <CameraPermissionPanel
            state={cameraState}
            onRequest={onRequestCamera}
            onSkip={onSkipCamera}
          />
        )}
      </section>
      <CollectionList
        scans={scans}
        thumbnails={thumbnails}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      </>
      )}

      <section aria-label="Export">
        <p className="export-summary" aria-label="Export summary">
          {total} scan{total !== 1 ? 's' : ''} · {unique} unique · {duplicates} duplicates
        </p>
        <button type="button" className="primary" data-test-id="export-text" onClick={onExportText}>
          Export text
        </button>
        <button type="button" className="secondary" onClick={onExportJson}>
          Export JSON (with images)
        </button>
        <p className="privacy-note-inline">Images are included. File stays on this device — use as a personal backup.</p>
      </section>
    </section>
  );
}
