import { useId, useState, type ChangeEvent, type FormEvent } from 'react';
import type { Session } from '../domain/types';
import { StorageModeToggle } from './StorageModeToggle';
import type { StorageMode } from '../composition';
import {
  parseFlexibleCodes,
  resolveOwnedCodes,
  parseJsonImport,
  type JsonImport,
} from '../import/parse-import';
import { CROMOSWAP_MARK_SRC } from './brand-assets';
import type { AuthClient, AuthResponse } from '../auth/auth';
import { AuthPanel } from './AuthPanel';
import { PasswordChangeForm } from './PasswordChangeForm';

export interface AlbumImport {
  userName: string;
  ownedCodes: string[];
}

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
  onImportAlbum?: (data: AlbumImport) => void;
  onOpenBoard?: () => void;
  /** Cloud mode only: account auth. When set, the gate requires login. */
  auth?: AuthClient;
  onAuthenticated?: (res: AuthResponse) => void;
  onLogout?: () => void;
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
  onImportJson,
  onImportAlbum,
  onOpenBoard,
  auth,
  onAuthenticated,
  onLogout,
}: SessionGateProps) {
  const [name, setName] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  // Cloud mode (auth set) requires login before scanning; local mode has no auth.
  const cloudUser = auth ? auth.currentUser() : null;
  const needsAuth = !!auth && cloudUser === null;

  function handleLogout() {
    setShowPasswordForm(false);
    // Prefer the app handler; fall back to clearing the token directly so the
    // button is never a no-op when onLogout isn't wired.
    if (onLogout) onLogout();
    else auth?.logout();
  }
  const inputId = useId();
  const importNameId = useId();
  const importFileId = useId();
  const backupId = useId();
  const trimmed = name.trim();

  const [importName, setImportName] = useState('');
  const [importKind, setImportKind] = useState<'owned' | 'missing'>('owned');
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (trimmed === '') return;
    onCreate(trimmed);
  }

  // Album list import: collector name + owned/missing chosen in the form; the
  // file is just the codes (any common layout).
  async function handleAlbumFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImportError(null);
    setImportResult(null);
    const collector = importName.trim();
    if (collector === '') {
      setImportError('Enter a collector name first.');
      return;
    }
    const listed = parseFlexibleCodes(await file.text());
    if (listed.length === 0) {
      setImportError('No sticker codes found in that file.');
      return;
    }
    const ownedCodes = resolveOwnedCodes(importKind, listed);
    onImportAlbum?.({ userName: collector, ownedCodes });
    setImportResult(
      importKind === 'owned'
        ? `Imported ${listed.length} owned sticker${listed.length === 1 ? '' : 's'} for ${collector}.`
        : `Marked ${ownedCodes.length} owned for ${collector} (${listed.length} missing).`,
    );
  }

  async function handleBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImportError(null);
    setImportResult(null);
    try {
      const data = parseJsonImport(await file.text());
      onImportJson?.(data);
      setImportResult(`Restored backup for ${data.userName}.`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not read that backup.');
    }
  }

  return (
    <main aria-label="Session">
      <div className="session-gate-header">
        <div className="brand-lockup">
          <img className="brand-mark" src={CROMOSWAP_MARK_SRC} alt="" aria-hidden="true" />
          <div className="brand-copy">
            <h1 data-test-id="gate-title">cromoswap</h1>
          </div>
        </div>
        {storageMode && onChangeMode && (
          <StorageModeToggle mode={storageMode} onChange={onChangeMode} />
        )}
      </div>
      {onOpenBoard && (
        <button type="button" className="quiet gate-board-link" data-test-id="view-board" onClick={onOpenBoard}>
          View board
        </button>
      )}
      {needsAuth && auth ? (
        <AuthPanel auth={auth} onAuthenticated={(res) => onAuthenticated?.(res)} />
      ) : (
       <>
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
                  <button
                    type="button"
                    className="primary"
                    data-test-id={`resume-${session.userName}`}
                    onClick={() => onResume(session.id)}
                  >
                    Resume
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {auth ? (
        <section aria-label="Account" className="account-bar">
          <p data-test-id="account-status">Signed in to the cloud.</p>
          <div className="account-actions">
            <button
              type="button"
              className="quiet"
              data-test-id="change-password-toggle"
              onClick={() => setShowPasswordForm((v) => !v)}
            >
              {showPasswordForm ? 'Hide password form' : 'Change password'}
            </button>
            <button type="button" className="quiet" data-test-id="logout" onClick={handleLogout}>
              Log out
            </button>
          </div>
          {showPasswordForm && (
            <PasswordChangeForm onSubmit={(cur, next) => auth.changePassword(cur, next)} />
          )}
        </section>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor={inputId}>Your name</label>
          <input id={inputId} data-test-id="session-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Luca" />
          <button type="submit" data-test-id="start-session" disabled={trimmed === ''}>
            Start scanning
          </button>
        </form>
      )}
      {onImportAlbum && (
        <section aria-label="Import collector list" className="import-section">
          <h2>Import a collector list</h2>
          <label htmlFor={importNameId}>Collector name</label>
          <input
            id={importNameId}
            data-test-id="import-name"
            value={importName}
            onChange={(e) => setImportName(e.target.value)}
            placeholder="e.g. Luca"
          />
          <fieldset className="import-kind">
            <legend>These stickers are</legend>
            <label>
              <input
                type="radio"
                name="import-kind"
                data-test-id="import-owned"
                checked={importKind === 'owned'}
                onChange={() => setImportKind('owned')}
              />{' '}
              Owned
            </label>
            <label>
              <input
                type="radio"
                name="import-kind"
                data-test-id="import-missing"
                checked={importKind === 'missing'}
                onChange={() => setImportKind('missing')}
              />{' '}
              Missing
            </label>
          </fieldset>
          <label htmlFor={importFileId} className="import-label">
            Choose a .txt file of codes
          </label>
          <input
            id={importFileId}
            data-test-id="import-file"
            type="file"
            accept=".txt,text/plain"
            onChange={handleAlbumFile}
          />
        </section>
      )}
      {onImportJson && (
        <section aria-label="Restore backup" className="import-section">
          <label htmlFor={backupId} className="import-label">
            Restore a full backup (.json)
          </label>
          <input
            id={backupId}
            data-test-id="restore-json"
            type="file"
            accept=".json,application/json"
            onChange={handleBackupFile}
          />
        </section>
      )}
      {importResult && (
        <p className="import-result" data-test-id="import-result">✓ {importResult}</p>
      )}
      {importError && <p className="import-error" role="alert">{importError}</p>}
       </>
      )}
      <p className="privacy-note">
        {storageMode === 'local'
          ? 'Data stored locally on this device only.'
          : 'Data synced to the server. Appears on the leaderboard.'}
      </p>
    </main>
  );
}
