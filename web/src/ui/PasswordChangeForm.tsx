import { useId, useState, type FormEvent } from 'react';

interface PasswordChangeFormProps {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
}

/** Small form to change the logged-in user's password. */
export function PasswordChangeForm({ onSubmit }: PasswordChangeFormProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const currentId = useId();
  const nextId = useId();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(false);
    setBusy(true);
    try {
      await onSubmit(current, next);
      setDone(true);
      setCurrent('');
      setNext('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = current.length > 0 && next.length >= 8 && !busy;

  return (
    <form className="password-change" onSubmit={handleSubmit} aria-label="Change password">
      <label htmlFor={currentId}>Current password</label>
      <input
        id={currentId}
        data-test-id="password-current"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <label htmlFor={nextId}>New password</label>
      <input
        id={nextId}
        data-test-id="password-new"
        type="password"
        autoComplete="new-password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      <button type="submit" data-test-id="password-submit" disabled={!canSubmit}>
        Change password
      </button>
      {done && <p className="auth-result" data-test-id="password-result">✓ Password updated.</p>}
      {error && (
        <p className="auth-error" role="alert" data-test-id="password-error">
          {error}
        </p>
      )}
    </form>
  );
}
