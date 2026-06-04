import { useId, useState } from 'react';
import type { Scan } from '../domain/types';
import { countByCode } from '../domain/counts';
import { normalizeCode } from '../domain/normalizer';
import { validateCode } from '../domain/validator';

interface CollectionListProps {
  scans: Scan[];
  thumbnails: Record<string, string>;
  onEdit: (id: string, code: string) => void;
  onDelete: (id: string) => void;
}

interface RowProps {
  scan: Scan;
  count: number;
  thumbnail?: string;
  onEdit: (id: string, code: string) => void;
  onDelete: (id: string) => void;
}

function ScanRow({ scan, count, thumbnail, onEdit, onDelete }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(scan.normalizedCode);
  const inputId = useId();

  const canonical = normalizeCode(text);
  const valid = canonical !== null && validateCode(canonical) !== null;

  function save() {
    if (!valid || canonical === null) return;
    onEdit(scan.id, canonical);
    setEditing(false);
  }

  return (
    <li>
      {thumbnail && <img src={thumbnail} alt={`Sticker ${scan.normalizedCode}`} />}
      {editing ? (
        <>
          <label htmlFor={inputId}>Edit code</label>
          <input id={inputId} value={text} onChange={(e) => setText(e.target.value)} />
          <button type="button" onClick={save} disabled={!valid}>
            Save
          </button>
        </>
      ) : (
        <>
          <span className="code">{scan.normalizedCode}</span>
          <span className={`badge source-${scan.source}`}>
            {scan.source === 'ocr' ? 'OCR' : 'Manual'}
          </span>
          {count > 1 && <span className="badge duplicate">×{count}</span>}
          <time dateTime={scan.capturedAt}>{scan.capturedAt}</time>
          <button type="button" className="quiet" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" className="danger" onClick={() => onDelete(scan.id)}>
            Delete
          </button>
        </>
      )}
    </li>
  );
}

/** Lists confirmed scans with duplicate counts and inline edit/delete. */
export function CollectionList({ scans, thumbnails, onEdit, onDelete }: CollectionListProps) {
  const counts = countByCode(scans);
  const total = scans.length;
  const unique = Object.keys(counts).length;
  const duplicates = total - unique;

  return (
    <>
      {total > 0 && (
        <p className="collection-stats" aria-label="Collection stats">
          {total} scans · {unique} unique · {duplicates} duplicates
        </p>
      )}
      <ul aria-label="Collection">
        {scans.map((scan) => (
          <ScanRow
            key={scan.id}
            scan={scan}
            count={counts[scan.normalizedCode]}
            thumbnail={thumbnails[scan.id]}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </>
  );
}
