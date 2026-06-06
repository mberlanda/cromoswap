import { useId, useState, type ChangeEvent, type FormEvent } from 'react';
import type { Session } from '../domain/types';
import { StorageModeToggle } from './StorageModeToggle';
import type { StorageMode } from '../composition';
import {
  detectTextKind,
  buildTextImport,
  parseJsonImport,
  type ImportKind,
  type JsonImport,
  type TextImport,
} from '../import/parse-import';

interface AlbumCount {
  owned: number;
  missing: number;
}

interface SessionGateProps {
  sessions: Session[];
  scanCounts?: Record<string, number>;
  albumCounts?: Record<string, AlbumCount>;
  onCreate: (userName: string) => void;
  onResume: (sessionId: string) => void;
  storageMode?: StorageMode;
  onChangeMode?: (mode: StorageMode) => void;
  onImportJson?: (data: JsonImport) => void;
  onImportText?: (data: TextImport) => void;
  onOpenBoard?: () => void;
}

const KIND_LABELS: { kind: ImportKind; label: string }[] = [
  { kind: 'owned', label: 'Owned' },
  { kind: 'missing', label: 'Missing' },
  { kind: 'duplicate', label: 'Duplicate' },
];

/** Entry screen: ask for a name to start a session, or resume an existing one. */
export function SessionGate({
  sessions,
  scanCounts = {},
  albumCounts = {},
  onCreate,
  onResume,
  storageMode,
  onChangeMode,
  onImportJson,
  onImportText,
  onOpenBoard,
}: SessionGateProps) {
  const [name, setName] = useState('');
  const inputId = useId();
  const importId = useId();
  const trimmed = name.trim();
  // Holds a header-less text file until the user tells us how to read it.
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (trimmed === '') return;
    onCreate(trimmed);
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // let the same file be re-selected later
    if (!file) return;
    setImportError(null);
    setPendingText(null);
    const content = await file.text();
    const isJson = file.name.endsWith('.json') || content.trimStart().startsWith('{');
    try {
      if (isJson) {
        onImportJson?.(parseJsonImport(content));
        return;
      }
      const kind = detectTextKind(content);
      if (kind) onImportText?.(buildTextImport(content, kind));
      else setPendingText(content);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not read that file');
    }
  }

  function handlePickKind(kind: ImportKind) {
    if (pendingText !== null) onImportText?.(buildTextImport(pendingText, kind));
    setPendingText(null);
  }

  return (
    <main aria-label="Session">
      <div className="session-gate-header">
        <h1 data-test-id="gate-title">Cromoswap</h1>
        {storageMode && onChangeMode && (
          <StorageModeToggle mode={storageMode} onChange={onChangeMode} />
        )}
      </div>
      {onOpenBoard && (
        <button type="button" className="quiet gate-board-link" data-test-id="view-board" onClick={onOpenBoard}>
          🏆 View board
        </button>
      )}
      {sessions.length > 0 && (
        <section aria-label="Resume">
          <h2>Resume a session</h2>
          <ul>
            {sessions.map((session) => {
              const count = scanCounts[session.id] ?? 0;
              const album = albumCounts[session.id];
              return (
                <li key={session.id} className="session-card">
                  <span className="session-name">{session.userName}</span>
                  <span className="session-count">{count} scan{count !== 1 ? 's' : ''}</span>
                  {album !== undefined && (
                    <span className="session-album-counts">
                      <span className="session-owned">{album.owned} owned</span>
                      <span className="session-missing">{album.missing} missing</span>
                    </span>
                  )}
                  <button type="button" className="primary" onClick={() => onResume(session.id)}>
                    Resume
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <form onSubmit={handleSubmit}>
        <label htmlFor={inputId}>Your name</label>
        <input id={inputId} data-test-id="session-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Luca" />
        <button type="submit" data-test-id="start-session" disabled={trimmed === ''}>
          Start scanning
        </button>
      </form>
      {(onImportJson || onImportText) && (
        <section aria-label="Import" className="import-section">
          <label htmlFor={importId} className="import-label">
            Import a backup (.txt or .json)
          </label>
          <input
            id={importId}
            type="file"
            accept=".txt,.json,application/json,text/plain"
            onChange={handleImportFile}
          />
          {pendingText !== null && (
            <div className="import-kind-picker" role="group" aria-label="Import kind">
              <p>Can’t tell what this list is — what does it represent?</p>
              {KIND_LABELS.map(({ kind, label }) => (
                <button key={kind} type="button" className="secondary" onClick={() => handlePickKind(kind)}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {importError && <p className="import-error" role="alert">{importError}</p>}
        </section>
      )}
      <p className="privacy-note">
        {storageMode === 'local'
          ? 'Data stored locally on this device only.'
          : 'Data synced to the server. Appears on the leaderboard.'}
      </p>
    </main>
  );
}
