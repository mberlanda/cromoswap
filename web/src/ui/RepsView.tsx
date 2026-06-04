import type { RefObject } from 'react';
import type { Scan } from '../domain/types';
import type { Detection, Orientation } from './App';
import { MaskOverlay } from './MaskOverlay';
import { DetectionResult } from './DetectionResult';
import { ManualEntry } from './ManualEntry';
import { CollectionList } from './CollectionList';
import { countByCode } from '../domain/counts';

export interface RepsViewProps {
  scans: Scan[];
  thumbnails: Record<string, string>;
  detection: Detection | null;
  noDetection: boolean;
  scanning: boolean;
  orientation: Orientation;
  videoRef: RefObject<HTMLVideoElement | null>;
  onCapture: () => void;
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
}

export function RepsView({
  scans, thumbnails, detection, noDetection, scanning, orientation,
  videoRef, onCapture, onConfirm, onCorrect, onSkip, onRescan,
  onManualAdd, onEdit, onDelete, onExportText, onExportJson, onSetOrientation,
}: RepsViewProps) {
  const counts = countByCode(scans);
  const recentPrefixes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([code]) => code.slice(0, 3))
    .filter((p, i, arr) => arr.indexOf(p) === i); // deduplicate

  return (
    <section aria-label="My Reps">
      <section aria-label="Scan" className="scan-area">
        <video ref={videoRef} playsInline muted className="camera-preview" />
        <MaskOverlay orientation={orientation} />
        <fieldset aria-label="Orientation">
          <legend>Sticker orientation</legend>
          <label>
            <input
              type="radio"
              name="orientation"
              checked={orientation === 'portrait'}
              onChange={() => onSetOrientation('portrait')}
            />
            Portrait
          </label>
          <label>
            <input
              type="radio"
              name="orientation"
              checked={orientation === 'landscape'}
              onChange={() => onSetOrientation('landscape')}
            />
            Landscape
          </label>
        </fieldset>
        <button type="button" className="primary full" onClick={onCapture} disabled={scanning}>
          {scanning ? 'Hold steady…' : 'Scan sticker'}
        </button>
        {scanning && <p role="status">Hold the sticker steady in the frame…</p>}
        {noDetection && (
          <p role="status">No code detected in 5s — try again or add manually.</p>
        )}
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
      </section>

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

      <section aria-label="Export">
        <button type="button" className="primary" onClick={onExportText}>
          Export text
        </button>
        <button type="button" className="secondary" onClick={onExportJson}>
          Export JSON (with images)
        </button>
      </section>
    </section>
  );
}
