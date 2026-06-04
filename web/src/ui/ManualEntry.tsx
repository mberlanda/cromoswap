import { useId, useState, type FormEvent } from 'react';
import { ALBUM_ORDER, stickerNumbers } from '../domain/album-config';
import { validateCode } from '../domain/validator';

interface ManualEntryProps {
  onAdd: (code: string) => void;
  recentPrefixes?: string[]; // top recent prefixes shown as quick-tap chips
}

const PREFIX_SET = new Set(ALBUM_ORDER);
const PREFIX_LIST_ID = 'manual-entry-prefixes';

export function ManualEntry({ onAdd, recentPrefixes = [] }: ManualEntryProps) {
  const [prefix, setPrefix] = useState('');
  const [number, setNumber] = useState('');
  const prefixId = useId();
  const numberId = useId();

  const upperPrefix = prefix.toUpperCase();
  const prefixValid = PREFIX_SET.has(upperPrefix);
  const numbers = prefixValid ? stickerNumbers(upperPrefix) : [];
  const effectiveNumber = number || numbers[0] || '';
  const combined = prefixValid ? `${upperPrefix}${effectiveNumber}` : '';
  const codeValid = combined !== '' && validateCode(combined) !== null;
  const showError = prefix !== '' && !prefixValid;

  function handlePrefixChange(value: string) {
    const up = value.toUpperCase();
    setPrefix(up);
    setNumber(''); // reset number when prefix changes
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!codeValid) return;
    onAdd(combined);
    setPrefix('');
    setNumber('');
  }

  return (
    <form onSubmit={handleSubmit}>
      {recentPrefixes.length > 0 && (
        <div aria-label="Recent" className="recent-prefixes">
          {recentPrefixes.map((p) => (
            <button
              key={p}
              type="button"
              className="chip"
              onClick={() => handlePrefixChange(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      <label htmlFor={prefixId}>Prefix</label>
      <input
        id={prefixId}
        value={prefix}
        onChange={(e) => handlePrefixChange(e.target.value)}
        placeholder="ARG"
        autoCapitalize="characters"
        list={PREFIX_LIST_ID}
        maxLength={3}
      />
      <datalist id={PREFIX_LIST_ID}>
        {ALBUM_ORDER.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      {showError && <p role="alert">Invalid prefix</p>}
      <label htmlFor={numberId}>Number</label>
      <select
        id={numberId}
        value={effectiveNumber}
        onChange={(e) => setNumber(e.target.value)}
        disabled={!prefixValid}
      >
        {numbers.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <button type="submit" disabled={!codeValid}>
        Add
      </button>
    </form>
  );
}
