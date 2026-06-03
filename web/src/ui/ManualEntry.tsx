import { useId, useState, type FormEvent } from 'react';
import { normalizeCode } from '../domain/normalizer';
import { validateCode } from '../domain/validator';

interface ManualEntryProps {
  onAdd: (code: string) => void;
}

/** Manual fallback: type a code, normalize + validate, then add it. */
export function ManualEntry({ onAdd }: ManualEntryProps) {
  const [text, setText] = useState('');
  const inputId = useId();

  const canonical = normalizeCode(text);
  const valid = canonical !== null && validateCode(canonical) !== null;
  const showError = text.trim() !== '' && !valid;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || canonical === null) return;
    onAdd(canonical);
    setText('');
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={inputId}>Code</label>
      <input
        id={inputId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="ARG01"
        autoCapitalize="characters"
      />
      {showError && <p role="alert">Invalid code</p>}
      <button type="submit" disabled={!valid}>
        Add
      </button>
    </form>
  );
}
