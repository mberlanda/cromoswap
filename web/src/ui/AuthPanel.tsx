import { useId, useState, type FormEvent } from 'react';
import type { AuthClient, AuthResponse } from '../auth/auth';

interface AuthPanelProps {
  auth: AuthClient;
  onAuthenticated: (res: AuthResponse) => void;
}

/**
 * Cloud-mode account gate: register a new account or log into an existing one.
 * On success the AuthClient has persisted the token; we hand the response up so
 * the app can adopt the returned session.
 */
export function AuthPanel({ auth, onAuthenticated }: AuthPanelProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const userFieldId = useId();
  const passFieldId = useId();

  // Mirror the server constraint: lowercase a-z0-9 only.
  const onUsername = (value: string) =>
    setUsername(value.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const select = (next: 'login' | 'register') => {
    setTab(next);
    setError(null);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res =
        tab === 'register'
          ? await auth.register(username, password)
          : await auth.login(username, password);
      onAuthenticated(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = username.length >= 3 && password.length >= 8 && !busy;

  return (
    <section aria-label="Account" className="auth-panel">
      <div className="auth-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          data-test-id="auth-tab-login"
          aria-selected={tab === 'login'}
          className={tab === 'login' ? 'primary' : 'quiet'}
          onClick={() => select('login')}
        >
          Log in
        </button>
        <button
          type="button"
          role="tab"
          data-test-id="auth-tab-register"
          aria-selected={tab === 'register'}
          className={tab === 'register' ? 'primary' : 'quiet'}
          onClick={() => select('register')}
        >
          Register
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor={userFieldId}>Username</label>
        <input
          id={userFieldId}
          data-test-id="auth-username"
          value={username}
          autoComplete="username"
          placeholder="lowercase letters & digits"
          onChange={(e) => onUsername(e.target.value)}
        />
        <label htmlFor={passFieldId}>Password</label>
        <input
          id={passFieldId}
          data-test-id="auth-password"
          type="password"
          value={password}
          autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" data-test-id="auth-submit" disabled={!canSubmit}>
          {tab === 'register' ? 'Create account' : 'Log in'}
        </button>
      </form>
      {tab === 'register' && (
        <p className="auth-hint">
          Username: 3–30 lowercase letters/digits. Password: 8+ characters.
        </p>
      )}
      {error && (
        <p className="auth-error" role="alert" data-test-id="auth-error">
          {error}
        </p>
      )}
    </section>
  );
}
