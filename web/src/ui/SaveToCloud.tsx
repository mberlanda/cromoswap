import { useState } from 'react';
import type { Scan, Session } from '../domain/types';
import type { CloudSaver } from '../storage/save-to-cloud';
import type { AuthResponse } from '../auth/auth';
import { AuthPanel } from './AuthPanel';

export interface LocalSnapshot {
  session: Session;
  scans: Scan[];
  ownedCodes: string[];
}

interface SaveToCloudProps {
  saver: CloudSaver;
  /** Gather the current local scans + album at save time (kept fresh). */
  resolveSnapshot: () => Promise<LocalSnapshot>;
}

type Status = 'idle' | 'open' | 'uploading' | 'done' | 'error';

/**
 * Save-local-to-cloud affordance: a button that opens the register/login panel,
 * then uploads this device's scans + album into the authenticated cloud account.
 */
export function SaveToCloud({ saver, resolveSnapshot }: SaveToCloudProps) {
  const [status, setStatus] = useState<Status>('idle');

  async function handleAuthenticated(res: AuthResponse) {
    setStatus('uploading');
    const snapshot = await resolveSnapshot();
    const result = await saver.upload(
      snapshot.session,
      snapshot.scans,
      snapshot.ownedCodes,
      res.user.username,
    );
    setStatus(result.ok ? 'done' : 'error');
  }

  if (status === 'idle') {
    return (
      <section className="save-to-cloud" aria-label="Save to cloud">
        <button type="button" className="quiet" data-test-id="save-to-cloud" onClick={() => setStatus('open')}>
          Save to cloud
        </button>
      </section>
    );
  }

  return (
    <section className="save-to-cloud" aria-label="Save to cloud">
      <h2>Save this collection to the cloud</h2>
      <p className="save-to-cloud-hint">
        Register or log in to upload this device’s scans and album to your account.
      </p>
      {(status === 'open' || status === 'error') && (
        <AuthPanel auth={saver.auth} onAuthenticated={handleAuthenticated} />
      )}
      {status === 'uploading' && <p data-test-id="save-to-cloud-progress">Uploading…</p>}
      {status === 'done' && (
        <p className="auth-result" data-test-id="save-to-cloud-result">✓ Saved to the cloud.</p>
      )}
      {status === 'error' && (
        <p className="auth-error" role="alert" data-test-id="save-to-cloud-error">
          Couldn’t save everything to the cloud. Please try again.
        </p>
      )}
    </section>
  );
}
