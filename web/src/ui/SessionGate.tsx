import { useId, useState, type FormEvent } from 'react';
import type { Session } from '../domain/types';
import { StorageModeToggle } from './StorageModeToggle';
import type { StorageMode } from '../composition';

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
}

/** Entry screen: ask for a name to start a session, or resume an existing one. */
export function SessionGate({
  sessions,
  scanCounts = {},
  albumCounts = {},
  onCreate,
  onResume,
  storageMode,
  onChangeMode,
}: SessionGateProps) {
  const [name, setName] = useState('');
  const inputId = useId();
  const trimmed = name.trim();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (trimmed === '') return;
    onCreate(trimmed);
  }

  return (
    <main aria-label="Session">
      <div className="session-gate-header">
        <h1>Cromoswap</h1>
        {storageMode && onChangeMode && (
          <StorageModeToggle mode={storageMode} onChange={onChangeMode} />
        )}
      </div>
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
        <input id={inputId} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Luca" />
        <button type="submit" disabled={trimmed === ''}>
          Start scanning
        </button>
      </form>
      <p className="privacy-note">
        {storageMode === 'local'
          ? 'Data stored locally on this device only.'
          : 'Data synced to the server. Appears on the leaderboard.'}
      </p>
    </main>
  );
}
