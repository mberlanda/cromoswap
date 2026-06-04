import { useId, useState, type FormEvent } from 'react';
import type { Session } from '../domain/types';

interface SessionGateProps {
  sessions: Session[];
  scanCounts?: Record<string, number>;
  onCreate: (userName: string) => void;
  onResume: (sessionId: string) => void;
}

/** Entry screen: ask for a name to start a session, or resume an existing one. */
export function SessionGate({ sessions, scanCounts = {}, onCreate, onResume }: SessionGateProps) {
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
      <h1>Cromoswap</h1>
      {sessions.length > 0 && (
        <section aria-label="Resume">
          <h2>Resume a session</h2>
          <ul>
            {sessions.map((session) => {
              const count = scanCounts[session.id] ?? 0;
              return (
                <li key={session.id} className="session-card">
                  <span className="session-name">{session.userName}</span>
                  <span className="session-count">{count} scan{count !== 1 ? 's' : ''}</span>
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
      <p className="privacy-note">Images stay on this device. No account needed.</p>
    </main>
  );
}
