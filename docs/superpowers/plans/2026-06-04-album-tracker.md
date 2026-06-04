# Album Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-tab shell (My Album / My Reps) so users can manually track which stickers they own in their album, see progress per team, and export owned or missing sticker lists.

**Architecture:** A new `album` IndexedDB store (DB v2) persists owned stickers scoped by `userName`. `AlbumView` renders 49 expandable team cards with tappable number chips. The existing scan/collection flow moves into `RepsView`, and `App` becomes a thin two-tab shell.

**Tech Stack:** React 18, TypeScript, Vite, Vitest + @testing-library/react, idb (IndexedDB wrapper). Run tests with Node 22: `. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run` from `web/`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `web/src/domain/types.ts` | Modify | Add `AlbumEntry` type |
| `web/src/storage/types.ts` | Modify | Add `AlbumRepo` interface |
| `web/src/assets/team-names.json` | Create | Prefix → full name map in album order |
| `web/src/domain/album-config.ts` | Create | `stickerNumbers()`, `ALBUM_ORDER`, `teamFullName()` |
| `web/src/domain/validator.ts` | Modify | FWC range 0–19 instead of 1–20 |
| `web/src/storage/memory-repos.ts` | Modify | Add `MemoryAlbumRepo` |
| `web/src/storage/db.ts` | Modify | DB_VERSION 2, `album` store |
| `web/src/storage/idb-repos.ts` | Modify | Add `IdbAlbumRepo` |
| `web/src/export/album-export.ts` | Create | `toAlbumOwnedExport`, `toAlbumMissingExport` |
| `web/src/ui/TeamCard.tsx` | Create | Per-team chip grid component |
| `web/src/ui/AlbumView.tsx` | Create | Album tab: team cards + export footer |
| `web/src/ui/TabBar.tsx` | Create | My Album / My Reps tab bar |
| `web/src/ui/RepsView.tsx` | Create | Scan + collection extracted from App |
| `web/src/ui/App.tsx` | Modify | Two-tab shell, add `albumRepo` to `AppDeps` |
| `web/src/composition.ts` | Modify | Instantiate `IdbAlbumRepo` |
| `web/src/index.css` | Modify | Tab bar, team card, chip, album footer styles |
| `web/test/album-config.test.ts` | Create | Tests for `stickerNumbers`, `ALBUM_ORDER` |
| `web/test/album-export.test.ts` | Create | Tests for owned/missing export |
| `web/test/AlbumView.test.tsx` | Create | Component tests for `AlbumView` |
| `web/test/validator.test.ts` | Modify | Update FWC assertions, add FWC00 cases |
| `web/test/memory-repos.test.ts` | Modify | Add `MemoryAlbumRepo` tests |
| `web/test/App.test.tsx` | Modify | Add `albumRepo` to `makeDeps` |

---

## Task 1: `AlbumEntry` type and `AlbumRepo` interface

**Files:**
- Modify: `web/src/domain/types.ts`
- Modify: `web/src/storage/types.ts`

- [ ] **Step 1: Add `AlbumEntry` to domain types**

Open `web/src/domain/types.ts` and append after the `Session` interface:

```typescript
export interface AlbumEntry {
  id: string;
  userName: string;
  normalizedCode: string;
  ownedAt: string;
}
```

- [ ] **Step 2: Add `AlbumRepo` to storage types**

Open `web/src/storage/types.ts`. Add the import and interface:

```typescript
import type { Scan, Session, AlbumEntry } from '../domain/types';
```

Replace the existing import line `import type { Scan, Session } from '../domain/types';` with the above, then append after `ImageStore`:

```typescript
export interface AlbumRepo {
  toggle(userName: string, normalizedCode: string): Promise<'added' | 'removed'>;
  listByUser(userName: string): Promise<AlbumEntry[]>;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/mauroberlanda/Code/idee/wc-sticker-scanner/web && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/domain/types.ts web/src/storage/types.ts
git commit -m "feat(album): add AlbumEntry type and AlbumRepo interface"
```

---

## Task 2: Static data — `team-names.json` and `album-config.ts`

**Files:**
- Create: `web/src/assets/team-names.json`
- Create: `web/src/domain/album-config.ts`
- Create: `web/test/album-config.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/test/album-config.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { stickerNumbers, ALBUM_ORDER, teamFullName } from '../src/domain/album-config';

describe('stickerNumbers', () => {
  it('returns 00-19 for FWC', () => {
    const nums = stickerNumbers('FWC');
    expect(nums).toHaveLength(20);
    expect(nums[0]).toBe('00');
    expect(nums[19]).toBe('19');
  });

  it('returns 01-20 for all other prefixes', () => {
    const nums = stickerNumbers('ARG');
    expect(nums).toHaveLength(20);
    expect(nums[0]).toBe('01');
    expect(nums[19]).toBe('20');
  });
});

describe('ALBUM_ORDER', () => {
  it('has FWC as the first entry', () => {
    expect(ALBUM_ORDER[0]).toBe('FWC');
  });

  it('contains 49 entries (48 teams + FWC)', () => {
    expect(ALBUM_ORDER).toHaveLength(49);
  });
});

describe('teamFullName', () => {
  it('returns the full name for a known prefix', () => {
    expect(teamFullName('ARG')).toBe('Argentina');
    expect(teamFullName('FWC')).toBe('FIFA World Cup');
  });

  it('falls back to the prefix for an unknown code', () => {
    expect(teamFullName('ZZZ')).toBe('ZZZ');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run --reporter=verbose 2>&1 | grep album-config
```
Expected: `FAIL test/album-config.test.ts` (module not found).

- [ ] **Step 3: Create `team-names.json`**

Create `web/src/assets/team-names.json`:

```json
{
  "FWC": "FIFA World Cup",
  "ALG": "Algeria",
  "ARG": "Argentina",
  "AUS": "Australia",
  "AUT": "Austria",
  "BEL": "Belgium",
  "BIH": "Bosnia and Herzegovina",
  "BRA": "Brazil",
  "CAN": "Canada",
  "CPV": "Cape Verde",
  "COL": "Colombia",
  "CRO": "Croatia",
  "CUW": "Curaçao",
  "CZE": "Czech Republic",
  "COD": "DR Congo",
  "ECU": "Ecuador",
  "EGY": "Egypt",
  "ENG": "England",
  "FRA": "France",
  "GER": "Germany",
  "GHA": "Ghana",
  "HAI": "Haiti",
  "IRN": "Iran",
  "IRQ": "Iraq",
  "CIV": "Côte d'Ivoire",
  "JPN": "Japan",
  "JOR": "Jordan",
  "MEX": "Mexico",
  "MAR": "Morocco",
  "NED": "Netherlands",
  "NZL": "New Zealand",
  "NOR": "Norway",
  "PAN": "Panama",
  "PAR": "Paraguay",
  "POR": "Portugal",
  "QAT": "Qatar",
  "KSA": "Saudi Arabia",
  "SCO": "Scotland",
  "SEN": "Senegal",
  "RSA": "South Africa",
  "KOR": "South Korea",
  "ESP": "Spain",
  "SWE": "Sweden",
  "SUI": "Switzerland",
  "TUN": "Tunisia",
  "TUR": "Turkey",
  "URU": "Uruguay",
  "USA": "United States",
  "UZB": "Uzbekistan"
}
```

- [ ] **Step 4: Create `album-config.ts`**

Create `web/src/domain/album-config.ts`:

```typescript
import TEAM_NAMES from '../assets/team-names.json';

export const ALBUM_ORDER: readonly string[] = Object.keys(TEAM_NAMES);

export function teamFullName(prefix: string): string {
  return (TEAM_NAMES as Record<string, string>)[prefix] ?? prefix;
}

export function stickerNumbers(prefix: string): string[] {
  if (prefix === 'FWC') {
    return Array.from({ length: 20 }, (_, i) => i.toString().padStart(2, '0'));
  }
  return Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(2, '0'));
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run --reporter=verbose 2>&1 | grep -A5 album-config
```
Expected: `PASS test/album-config.test.ts` with 4 passing tests.

- [ ] **Step 6: Commit**

```bash
git add web/src/assets/team-names.json web/src/domain/album-config.ts web/test/album-config.test.ts
git commit -m "feat(album): add team-names.json and album-config helpers"
```

---

## Task 3: Validator — FWC00 support

**Files:**
- Modify: `web/src/domain/validator.ts`
- Modify: `web/test/validator.test.ts`

- [ ] **Step 1: Update the validator tests first**

Replace `web/test/validator.test.ts` entirely with:

```typescript
import { describe, it, expect } from 'vitest';
import { validateCode } from '../src/domain/validator';

describe('validateCode', () => {
  it('accepts a known prefix with number 01-20', () => {
    expect(validateCode('ARG01')).toEqual({ prefix: 'ARG', number: 1, canonical: 'ARG01' });
    expect(validateCode('ARG20')).toEqual({ prefix: 'ARG', number: 20, canonical: 'ARG20' });
  });

  it('accepts FWC00 as the lowest valid FWC sticker', () => {
    expect(validateCode('FWC00')).toEqual({ prefix: 'FWC', number: 0, canonical: 'FWC00' });
  });

  it('accepts FWC19 as the highest valid FWC sticker', () => {
    expect(validateCode('FWC19')).toEqual({ prefix: 'FWC', number: 19, canonical: 'FWC19' });
  });

  it('rejects FWC20 as above the FWC range', () => {
    expect(validateCode('FWC20')).toBeNull();
  });

  it('rejects unknown prefix', () => {
    expect(validateCode('ZZZ01')).toBeNull();
  });

  it('rejects ARG00 as below the non-FWC range', () => {
    expect(validateCode('ARG00')).toBeNull();
  });

  it('rejects number above range', () => {
    expect(validateCode('ARG21')).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(validateCode('AR1')).toBeNull();
    expect(validateCode('ARG1')).toBeNull();
    expect(validateCode('arg01')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to confirm the new cases fail**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run --reporter=verbose 2>&1 | grep -A10 validator
```
Expected: `FAIL` — `FWC00` returns null, `FWC20` returns a value.

- [ ] **Step 3: Update the validator implementation**

Replace `web/src/domain/validator.ts` with:

```typescript
import { PREFIXES } from './prefixes';
import type { StickerCode } from './types';

export function validateCode(canonical: string): StickerCode | null {
  const match = canonical.match(/^([A-Z]{3})(\d{2})$/);
  if (!match) return null;
  const prefix = match[1];
  const number = parseInt(match[2], 10);
  if (!PREFIXES.has(prefix)) return null;
  const isFwc = prefix === 'FWC';
  if (isFwc  && (number < 0  || number > 19)) return null;
  if (!isFwc && (number < 1  || number > 20)) return null;
  return { prefix, number, canonical };
}
```

- [ ] **Step 4: Run full test suite**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/domain/validator.ts web/test/validator.test.ts
git commit -m "feat(album): extend validator to accept FWC00-FWC19"
```

---

## Task 4: `MemoryAlbumRepo`

**Files:**
- Modify: `web/src/storage/memory-repos.ts`
- Modify: `web/test/memory-repos.test.ts`

- [ ] **Step 1: Add tests for `MemoryAlbumRepo`**

Open `web/test/memory-repos.test.ts`. Add these imports at the top:

```typescript
import { MemoryAlbumRepo } from '../src/storage/memory-repos';
```

Append a new `describe` block at the end of the file:

```typescript
describe('MemoryAlbumRepo', () => {
  it('adds an entry on first toggle and removes on second', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    expect(await repo.toggle('Mauro', 'ARG01')).toBe('added');
    const owned = await repo.listByUser('Mauro');
    expect(owned).toHaveLength(1);
    expect(owned[0]).toMatchObject({ userName: 'Mauro', normalizedCode: 'ARG01' });

    expect(await repo.toggle('Mauro', 'ARG01')).toBe('removed');
    expect(await repo.listByUser('Mauro')).toHaveLength(0);
  });

  it('lists only entries for the given user', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    await repo.toggle('Mauro', 'ARG01');
    await repo.toggle('Luca', 'BRA05');
    expect(await repo.listByUser('Mauro')).toHaveLength(1);
    expect((await repo.listByUser('Mauro'))[0].normalizedCode).toBe('ARG01');
    expect(await repo.listByUser('Luca')).toHaveLength(1);
  });

  it('different users can own the same code independently', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    await repo.toggle('Mauro', 'ARG01');
    await repo.toggle('Luca', 'ARG01');
    expect(await repo.listByUser('Mauro')).toHaveLength(1);
    expect(await repo.listByUser('Luca')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run --reporter=verbose 2>&1 | grep -A5 memory-repos
```
Expected: `FAIL` — `MemoryAlbumRepo` not exported.

- [ ] **Step 3: Implement `MemoryAlbumRepo`**

Open `web/src/storage/memory-repos.ts`. Add at the top, extend the import:

```typescript
import type { Scan, Session, AlbumEntry } from '../domain/types';
import type { Clock, IdGen, ImageStore, ScanInput, ScanRepo, SessionRepo, AlbumRepo } from './types';
```

Append at the end of the file:

```typescript
export class MemoryAlbumRepo implements AlbumRepo {
  private readonly entries = new Map<string, AlbumEntry>();
  private readonly ids: IdGen;
  private readonly clock: Clock;

  constructor(ids: IdGen, clock: Clock) {
    this.ids = ids;
    this.clock = clock;
  }

  async toggle(userName: string, normalizedCode: string): Promise<'added' | 'removed'> {
    const key = `${userName}:${normalizedCode}`;
    if (this.entries.has(key)) {
      this.entries.delete(key);
      return 'removed';
    }
    const entry: AlbumEntry = {
      id: this.ids(),
      userName,
      normalizedCode,
      ownedAt: this.clock(),
    };
    this.entries.set(key, entry);
    return 'added';
  }

  async listByUser(userName: string): Promise<AlbumEntry[]> {
    return [...this.entries.values()].filter((e) => e.userName === userName);
  }
}
```

- [ ] **Step 4: Run tests**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/storage/memory-repos.ts web/test/memory-repos.test.ts
git commit -m "feat(album): add MemoryAlbumRepo with toggle and listByUser"
```

---

## Task 5: `IdbAlbumRepo` and DB v2 migration

**Files:**
- Modify: `web/src/storage/db.ts`
- Modify: `web/src/storage/idb-repos.ts`

- [ ] **Step 1: Update `db.ts` to version 2**

Replace `web/src/storage/db.ts` with:

```typescript
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Scan, Session, AlbumEntry } from '../domain/types';

export interface StickerDb extends DBSchema {
  sessions: { key: string; value: Session };
  scans: { key: string; value: Scan; indexes: { bySession: string } };
  images: { key: string; value: { scanId: string; dataUrl: string } };
  album: {
    key: string;
    value: AlbumEntry;
    indexes: { byUser: string; byUserAndCode: [string, string] };
  };
}

export const DB_NAME = 'wc-sticker-scanner';
export const DB_VERSION = 2;

export function openStickerDb(): Promise<IDBPDatabase<StickerDb>> {
  return openDB<StickerDb>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('sessions', { keyPath: 'id' });
        const scans = db.createObjectStore('scans', { keyPath: 'id' });
        scans.createIndex('bySession', 'sessionId');
        db.createObjectStore('images', { keyPath: 'scanId' });
      }
      if (oldVersion < 2) {
        const album = db.createObjectStore('album', { keyPath: 'id' });
        album.createIndex('byUser', 'userName');
        album.createIndex('byUserAndCode', ['userName', 'normalizedCode'], { unique: true });
      }
    },
  });
}
```

- [ ] **Step 2: Add `IdbAlbumRepo` to `idb-repos.ts`**

Open `web/src/storage/idb-repos.ts`. Add to the top imports:

```typescript
import type { AlbumEntry } from '../domain/types';
import type { Clock, IdGen, ImageStore, ScanInput, ScanRepo, SessionRepo, AlbumRepo } from './types';
```

Replace the existing import of types. Then append at the end of the file:

```typescript
export class IdbAlbumRepo implements AlbumRepo {
  private readonly db: IDBPDatabase<StickerDb>;
  private readonly ids: IdGen;
  private readonly clock: Clock;

  constructor(db: IDBPDatabase<StickerDb>, ids: IdGen, clock: Clock) {
    this.db = db;
    this.ids = ids;
    this.clock = clock;
  }

  async toggle(userName: string, normalizedCode: string): Promise<'added' | 'removed'> {
    const existing = await this.db.getFromIndex('album', 'byUserAndCode', [userName, normalizedCode]);
    if (existing) {
      await this.db.delete('album', existing.id);
      return 'removed';
    }
    const entry: AlbumEntry = {
      id: this.ids(),
      userName,
      normalizedCode,
      ownedAt: this.clock(),
    };
    await this.db.put('album', entry);
    return 'added';
  }

  async listByUser(userName: string): Promise<AlbumEntry[]> {
    return this.db.getAllFromIndex('album', 'byUser', userName);
  }
}
```

- [ ] **Step 3: Run full test suite**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run
```
Expected: all tests pass (idb-repos tests use fake-indexeddb).

- [ ] **Step 4: Commit**

```bash
git add web/src/storage/db.ts web/src/storage/idb-repos.ts
git commit -m "feat(album): add IdbAlbumRepo and migrate DB to version 2"
```

---

## Task 6: Album export functions

**Files:**
- Create: `web/src/export/album-export.ts`
- Create: `web/test/album-export.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/test/album-export.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { toAlbumOwnedExport, toAlbumMissingExport } from '../src/export/album-export';

const now = () => '2026-06-04T12:00:00.000Z';

describe('toAlbumOwnedExport', () => {
  it('includes a header and groups owned codes by team', () => {
    const owned = new Set(['FWC00', 'FWC01', 'ARG07']);
    const text = toAlbumOwnedExport('Mauro', owned, now);
    expect(text).toContain('user: Mauro');
    expect(text).toContain('total: 3');
    expect(text).toContain('FWC00 FWC01');
    expect(text).toContain('ARG07');
  });

  it('omits teams with no owned stickers', () => {
    const owned = new Set(['ARG01']);
    const text = toAlbumOwnedExport('Mauro', owned, now);
    expect(text).not.toMatch(/^BRA/m);
    expect(text).not.toMatch(/^FWC/m);
  });

  it('handles an empty owned set', () => {
    const text = toAlbumOwnedExport('Mauro', new Set(), now);
    expect(text).toContain('total: 0');
  });
});

describe('toAlbumMissingExport', () => {
  it('includes a header and groups missing codes by team', () => {
    const owned = new Set(['FWC00', 'FWC01']);
    const text = toAlbumMissingExport('Mauro', owned, now);
    expect(text).toContain('user: Mauro');
    expect(text).toContain('FWC: FWC02');
    expect(text).not.toContain('FWC00');
    expect(text).not.toContain('FWC01');
  });

  it('omits teams that are fully owned', () => {
    const owned = new Set(
      Array.from({ length: 20 }, (_, i) => `ARG${(i + 1).toString().padStart(2, '0')}`),
    );
    const text = toAlbumMissingExport('Mauro', owned, now);
    expect(text).not.toMatch(/^ARG:/m);
  });

  it('reports the correct missing count (980 total − 2 owned = 978)', () => {
    const owned = new Set(['FWC00', 'ARG01']);
    const text = toAlbumMissingExport('Mauro', owned, now);
    expect(text).toContain('missing: 978');
  });

  it('reports 980 missing when nothing is owned', () => {
    const text = toAlbumMissingExport('Mauro', new Set(), now);
    expect(text).toContain('missing: 980');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run --reporter=verbose 2>&1 | grep album-export
```
Expected: `FAIL` — module not found.

- [ ] **Step 3: Implement `album-export.ts`**

Create `web/src/export/album-export.ts`:

```typescript
import { ALBUM_ORDER, stickerNumbers } from '../domain/album-config';
import type { Clock } from '../storage/types';

export function toAlbumOwnedExport(
  userName: string,
  ownedCodes: Set<string>,
  now: Clock,
): string {
  const lines: string[] = [
    '# Cromoswap – My Album – Owned',
    `# user: ${userName}`,
    `# exported: ${now()}`,
    `# total: ${ownedCodes.size}`,
    '',
  ];

  for (const prefix of ALBUM_ORDER) {
    const owned = stickerNumbers(prefix)
      .map((n) => `${prefix}${n}`)
      .filter((code) => ownedCodes.has(code));
    if (owned.length > 0) lines.push(owned.join(' '));
  }

  return lines.join('\n');
}

export function toAlbumMissingExport(
  userName: string,
  ownedCodes: Set<string>,
  now: Clock,
): string {
  const totalMissing = ALBUM_ORDER.flatMap((p) =>
    stickerNumbers(p).map((n) => `${p}${n}`),
  ).filter((c) => !ownedCodes.has(c)).length;

  const lines: string[] = [
    '# Cromoswap – My Album – Missing',
    `# user: ${userName}`,
    `# exported: ${now()}`,
    `# missing: ${totalMissing}`,
    '',
  ];

  for (const prefix of ALBUM_ORDER) {
    const missing = stickerNumbers(prefix)
      .map((n) => `${prefix}${n}`)
      .filter((code) => !ownedCodes.has(code));
    if (missing.length > 0) lines.push(`${prefix}: ${missing.join(' ')}`);
  }

  return lines.join('\n');
}
```

- [ ] **Step 4: Run tests**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/export/album-export.ts web/test/album-export.test.ts
git commit -m "feat(album): add toAlbumOwnedExport and toAlbumMissingExport"
```

---

## Task 7: `TeamCard` component and album CSS

**Files:**
- Create: `web/src/ui/TeamCard.tsx`
- Modify: `web/src/index.css`

- [ ] **Step 1: Create `TeamCard.tsx`**

Create `web/src/ui/TeamCard.tsx`:

```typescript
interface TeamCardProps {
  prefix: string;
  fullName: string;
  numbers: string[];
  ownedCodes: Set<string>;
  onToggle: (code: string) => void;
}

export function TeamCard({ prefix, fullName, numbers, ownedCodes, onToggle }: TeamCardProps) {
  const ownedCount = numbers.filter((n) => ownedCodes.has(`${prefix}${n}`)).length;

  return (
    <div className="team-card">
      <div className="team-card-header">
        <span className="team-card-name">
          <strong>{prefix}</strong> · {fullName}
        </span>
        <span className="team-card-count">{ownedCount} / {numbers.length}</span>
      </div>
      <div className="team-card-chips">
        {numbers.map((n) => {
          const code = `${prefix}${n}`;
          const owned = ownedCodes.has(code);
          return (
            <button
              key={n}
              type="button"
              className={`chip${owned ? ' chip-owned' : ''}`}
              aria-label={owned ? `${code} owned, tap to remove` : `${code} not owned, tap to add`}
              aria-pressed={owned}
              onClick={() => onToggle(code)}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add album and tab styles to `index.css`**

Append to the end of `web/src/index.css`:

```css
/* ── Tab bar ─────────────────────────────────────── */
.tab-bar {
  display: flex;
  border-bottom: 1px solid var(--subtle);
  margin-bottom: var(--space-4);
}

.tab-bar button {
  flex: 1;
  min-height: 44px;
  border: none;
  border-radius: 0;
  border-bottom: 3px solid transparent;
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  font-weight: 900;
}

.tab-bar button.tab-active {
  border-bottom-color: var(--scan);
  color: var(--scan-strong);
}

/* ── Team card ───────────────────────────────────── */
.album-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.team-card {
  border: 1px solid var(--subtle);
  border-radius: var(--radius);
  background: var(--surface);
  overflow: hidden;
}

.team-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  background: var(--field);
  border-bottom: 1px solid var(--subtle);
  font-size: 13px;
}

.team-card-name {
  color: var(--ink);
}

.team-card-count {
  color: var(--muted);
  font-weight: 700;
  font-size: 12px;
}

.team-card-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
}

/* ── Sticker chips ───────────────────────────────── */
.chip {
  min-width: 32px;
  min-height: 32px;
  padding: 0 var(--space-1);
  border-radius: 6px;
  background: var(--field);
  border: 1px solid var(--subtle);
  font-size: 11px;
  font-weight: 900;
  color: var(--muted);
}

.chip-owned {
  background: var(--scan);
  border-color: var(--scan);
  color: white;
}

/* ── Album export footer ─────────────────────────── */
.album-footer {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3) 0 var(--space-5);
  background: var(--paper);
  border-top: 1px solid var(--subtle);
  margin-top: var(--space-4);
}
```

- [ ] **Step 3: Run tests**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add web/src/ui/TeamCard.tsx web/src/index.css
git commit -m "feat(album): add TeamCard component and album/tab CSS"
```

---

## Task 8: `AlbumView` component

**Files:**
- Create: `web/src/ui/AlbumView.tsx`
- Create: `web/test/AlbumView.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `web/test/AlbumView.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlbumView } from '../src/ui/AlbumView';
import { MemoryAlbumRepo } from '../src/storage/memory-repos';

let seq: number;
const ids = () => `id-${++seq}`;
const clock = () => '2026-06-04T00:00:00.000Z';
const now = clock;

beforeEach(() => {
  seq = 0;
});

describe('AlbumView', () => {
  it('renders chip buttons for FWC00 through FWC19', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={vi.fn()} now={now} />);
    expect(await screen.findByRole('button', { name: /FWC00 not owned/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /FWC19 not owned/i })).toBeInTheDocument();
  });

  it('toggling a chip marks it owned then back to not owned', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={vi.fn()} now={now} />);
    const chip = await screen.findByRole('button', { name: /FWC00 not owned/i });
    await userEvent.click(chip);
    expect(screen.getByRole('button', { name: /FWC00 owned/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /FWC00 owned/i }));
    expect(screen.getByRole('button', { name: /FWC00 not owned/i })).toBeInTheDocument();
  });

  it('loads previously owned stickers from the repo on mount', async () => {
    const repo = new MemoryAlbumRepo(ids, clock);
    await repo.toggle('Mauro', 'ARG07');
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={vi.fn()} now={now} />);
    expect(await screen.findByRole('button', { name: /ARG07 owned/i })).toBeInTheDocument();
  });

  it('calls downloadText for Export owned', async () => {
    const downloadText = vi.fn();
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={downloadText} now={now} />);
    await screen.findByRole('button', { name: /FWC00 not owned/i }); // wait for mount
    await userEvent.click(screen.getByRole('button', { name: /export owned/i }));
    expect(downloadText).toHaveBeenCalledOnce();
    expect(downloadText.mock.calls[0][0]).toContain('owned');
    expect(downloadText.mock.calls[0][1]).toContain('user: Mauro');
  });

  it('calls downloadText for Export missing', async () => {
    const downloadText = vi.fn();
    const repo = new MemoryAlbumRepo(ids, clock);
    render(<AlbumView userName="Mauro" albumRepo={repo} downloadText={downloadText} now={now} />);
    await screen.findByRole('button', { name: /FWC00 not owned/i });
    await userEvent.click(screen.getByRole('button', { name: /export missing/i }));
    expect(downloadText).toHaveBeenCalledOnce();
    expect(downloadText.mock.calls[0][0]).toContain('missing');
    expect(downloadText.mock.calls[0][1]).toContain('missing: 980');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run --reporter=verbose 2>&1 | grep AlbumView
```
Expected: `FAIL` — module not found.

- [ ] **Step 3: Implement `AlbumView.tsx`**

Create `web/src/ui/AlbumView.tsx`:

```typescript
import { useCallback, useEffect, useState } from 'react';
import type { AlbumRepo } from '../storage/types';
import type { Clock } from '../storage/types';
import { ALBUM_ORDER, teamFullName, stickerNumbers } from '../domain/album-config';
import { toAlbumOwnedExport, toAlbumMissingExport } from '../export/album-export';
import { TeamCard } from './TeamCard';

interface AlbumViewProps {
  userName: string;
  albumRepo: AlbumRepo;
  downloadText: (filename: string, content: string) => void;
  now: Clock;
}

export function AlbumView({ userName, albumRepo, downloadText, now }: AlbumViewProps) {
  const [ownedCodes, setOwnedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    void albumRepo.listByUser(userName).then((entries) => {
      setOwnedCodes(new Set(entries.map((e) => e.normalizedCode)));
    });
  }, [albumRepo, userName]);

  const handleToggle = useCallback(
    async (code: string) => {
      const result = await albumRepo.toggle(userName, code);
      setOwnedCodes((prev) => {
        const next = new Set(prev);
        if (result === 'added') next.add(code);
        else next.delete(code);
        return next;
      });
    },
    [albumRepo, userName],
  );

  function handleExportOwned() {
    downloadText(
      `${userName}-album-owned.txt`,
      toAlbumOwnedExport(userName, ownedCodes, now),
    );
  }

  function handleExportMissing() {
    downloadText(
      `${userName}-album-missing.txt`,
      toAlbumMissingExport(userName, ownedCodes, now),
    );
  }

  return (
    <section aria-label="My Album">
      <div className="album-list">
        {ALBUM_ORDER.map((prefix) => (
          <TeamCard
            key={prefix}
            prefix={prefix}
            fullName={teamFullName(prefix)}
            numbers={stickerNumbers(prefix)}
            ownedCodes={ownedCodes}
            onToggle={handleToggle}
          />
        ))}
      </div>
      <div className="album-footer">
        <button type="button" className="primary" onClick={handleExportOwned}>
          Export owned
        </button>
        <button type="button" className="secondary" onClick={handleExportMissing}>
          Export missing
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/ui/AlbumView.tsx web/test/AlbumView.test.tsx
git commit -m "feat(album): add AlbumView with team cards and export"
```

---

## Task 9: `TabBar` component

**Files:**
- Create: `web/src/ui/TabBar.tsx`

- [ ] **Step 1: Create `TabBar.tsx`**

Create `web/src/ui/TabBar.tsx`:

```typescript
interface TabBarProps {
  active: 'album' | 'reps';
  onChange: (tab: 'album' | 'reps') => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div role="tablist" className="tab-bar">
      <button
        type="button"
        role="tab"
        aria-selected={active === 'album'}
        className={active === 'album' ? 'tab-active' : ''}
        onClick={() => onChange('album')}
      >
        My Album
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === 'reps'}
        className={active === 'reps' ? 'tab-active' : ''}
        onClick={() => onChange('reps')}
      >
        My Reps
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Run tests**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add web/src/ui/TabBar.tsx
git commit -m "feat(album): add TabBar component"
```

---

## Task 10: Extract `RepsView`, wire two-tab shell, update composition

**Files:**
- Create: `web/src/ui/RepsView.tsx`
- Modify: `web/src/ui/App.tsx`
- Modify: `web/src/composition.ts`
- Modify: `web/test/App.test.tsx`

- [ ] **Step 1: Create `RepsView.tsx`**

Create `web/src/ui/RepsView.tsx`:

```typescript
import type { RefObject } from 'react';
import type { Scan } from '../domain/types';
import type { Detection, Orientation } from './App';
import { MaskOverlay } from './MaskOverlay';
import { DetectionResult } from './DetectionResult';
import { ManualEntry } from './ManualEntry';
import { CollectionList } from './CollectionList';

export interface RepsViewProps {
  scans: Scan[];
  thumbnails: Record<string, string>;
  detection: Detection | null;
  noDetection: boolean;
  scanning: boolean;
  orientation: Orientation;
  videoRef: RefObject<HTMLVideoElement>;
  onCapture: () => void;
  onConfirm: (code: string) => void;
  onCorrect: (code: string) => void;
  onSkip: () => void;
  onRescan: () => void;
  onManualAdd: (code: string) => void;
  onEdit: (id: string, code: string) => void;
  onDelete: (id: string) => void;
  onExportText: () => void;
  onExportJson: () => void;
  onSetOrientation: (o: Orientation) => void;
}

export function RepsView({
  scans, thumbnails, detection, noDetection, scanning, orientation,
  videoRef, onCapture, onConfirm, onCorrect, onSkip, onRescan,
  onManualAdd, onEdit, onDelete, onExportText, onExportJson, onSetOrientation,
}: RepsViewProps) {
  return (
    <section aria-label="My Reps">
      <section aria-label="Scan" className="scan-area">
        <video ref={videoRef} playsInline muted className="camera-preview" />
        <MaskOverlay orientation={orientation} />
        <fieldset aria-label="Orientation">
          <legend>Sticker orientation</legend>
          <label>
            <input
              type="radio"
              name="orientation"
              checked={orientation === 'portrait'}
              onChange={() => onSetOrientation('portrait')}
            />
            Portrait
          </label>
          <label>
            <input
              type="radio"
              name="orientation"
              checked={orientation === 'landscape'}
              onChange={() => onSetOrientation('landscape')}
            />
            Landscape
          </label>
        </fieldset>
        <button type="button" className="primary full" onClick={onCapture} disabled={scanning}>
          {scanning ? 'Hold steady…' : 'Scan sticker'}
        </button>
        {scanning && <p role="status">Hold the sticker steady in the frame…</p>}
        {noDetection && (
          <p role="status">No code detected in 5s — try again or add manually.</p>
        )}
        {detection && (
          <DetectionResult
            candidate={detection.candidate}
            imageDataUrl={detection.imageDataUrl}
            onConfirm={onConfirm}
            onCorrect={onCorrect}
            onSkip={onSkip}
            onRescan={onRescan}
          />
        )}
      </section>

      <section aria-label="Manual entry">
        <h2>Add manually</h2>
        <ManualEntry onAdd={onManualAdd} />
      </section>

      <CollectionList
        scans={scans}
        thumbnails={thumbnails}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <section aria-label="Export">
        <button type="button" className="primary" onClick={onExportText}>
          Export text
        </button>
        <button type="button" className="secondary" onClick={onExportJson}>
          Export JSON (with images)
        </button>
      </section>
    </section>
  );
}
```

- [ ] **Step 2: Rewrite `App.tsx` as a two-tab shell**

Replace `web/src/ui/App.tsx` with:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RankedCode, Scan, Session } from '../domain/types';
import type { Clock, ImageStore, ScanRepo, SessionRepo, AlbumRepo } from '../storage/types';
import { toTextExport } from '../export/text-export';
import { toJsonExport } from '../export/json-export';
import { SessionGate } from './SessionGate';
import { TabBar } from './TabBar';
import { AlbumView } from './AlbumView';
import { RepsView } from './RepsView';

export type Orientation = 'portrait' | 'landscape';

export interface Detection {
  candidate: RankedCode;
  imageDataUrl: string;
}

export interface AppDeps {
  sessionRepo: SessionRepo;
  scanRepo: ScanRepo;
  imageStore: ImageStore;
  albumRepo: AlbumRepo;
  scanOnce: (orientation: Orientation) => Promise<Detection | null>;
  now: Clock;
  downloadText: (filename: string, content: string) => void;
  downloadJson: (filename: string, content: string) => void;
  scanTimeoutMs?: number;
  delay?: (ms: number) => Promise<void>;
  nowMs?: () => number;
  syncSession?: (session: Session, scans: Scan[]) => void;
  attachVideo?: (element: HTMLVideoElement | null) => void;
}

export function App({ deps }: { deps: AppDeps }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [active, setActive] = useState<Session | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [detection, setDetection] = useState<Detection | null>(null);
  const [noDetection, setNoDetection] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [tab, setTab] = useState<'album' | 'reps'>('reps');
  const videoRef = useRef<HTMLVideoElement>(null);

  const SCAN_INTERVAL_MS = 300;
  const scanTimeoutMs = deps.scanTimeoutMs ?? 5000;
  const delay = deps.delay ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const nowMs = deps.nowMs ?? (() => Date.now());

  useEffect(() => {
    void deps.sessionRepo.list().then(setSessions);
  }, [deps]);

  useEffect(() => {
    if (active) deps.attachVideo?.(videoRef.current);
  }, [active, deps]);

  const refreshScans = useCallback(
    async (session: Session) => {
      const list = await deps.scanRepo.listBySession(session.id);
      setScans(list);
      const thumbs: Record<string, string> = {};
      for (const scan of list) {
        const dataUrl = await deps.imageStore.get(scan.id);
        if (dataUrl !== undefined) thumbs[scan.id] = dataUrl;
      }
      setThumbnails(thumbs);
      deps.syncSession?.(session, list);
    },
    [deps],
  );

  async function handleCreate(userName: string) {
    const session = await deps.sessionRepo.create(userName);
    setActive(session);
    setScans([]);
    setThumbnails({});
  }

  async function handleResume(sessionId: string) {
    const session = await deps.sessionRepo.get(sessionId);
    if (!session) return;
    setActive(session);
    await refreshScans(session);
  }

  async function storeScan(
    code: string,
    source: Scan['source'],
    confidence: number,
    imageDataUrl?: string,
  ) {
    if (!active) return;
    const scan = await deps.scanRepo.add({
      sessionId: active.id,
      normalizedCode: code,
      source,
      confidence,
      capturedAt: deps.now(),
    });
    if (imageDataUrl !== undefined) await deps.imageStore.put(scan.id, imageDataUrl);
    await refreshScans(active);
  }

  async function handleCapture() {
    if (scanning) return;
    setDetection(null);
    setNoDetection(false);
    setScanning(true);
    const deadline = nowMs() + scanTimeoutMs;
    try {
      while (nowMs() < deadline) {
        const result = await deps.scanOnce(orientation);
        if (result) {
          setDetection(result);
          return;
        }
        await delay(SCAN_INTERVAL_MS);
      }
      setNoDetection(true);
    } finally {
      setScanning(false);
    }
  }

  async function handleConfirm(code: string) {
    if (detection) await storeScan(code, 'ocr', detection.candidate.confidence, detection.imageDataUrl);
    setDetection(null);
  }

  async function handleCorrect(code: string) {
    if (detection) await storeScan(code, 'manual', detection.candidate.confidence, detection.imageDataUrl);
    setDetection(null);
  }

  async function handleManualAdd(code: string) {
    await storeScan(code, 'manual', 1);
  }

  async function handleEdit(id: string, code: string) {
    await deps.scanRepo.update(id, { normalizedCode: code });
    if (active) await refreshScans(active);
  }

  async function handleDelete(id: string) {
    await deps.scanRepo.delete(id);
    await deps.imageStore.delete(id);
    if (active) await refreshScans(active);
  }

  function handleExportText() {
    if (!active) return;
    deps.downloadText(`${active.userName}-${active.id}.txt`, toTextExport(active, scans, deps.now));
  }

  async function handleExportJson() {
    if (!active) return;
    const json = await toJsonExport(active, scans, deps.imageStore, deps.now);
    deps.downloadJson(`${active.userName}-${active.id}.json`, JSON.stringify(json, null, 2));
  }

  if (!active) {
    return <SessionGate sessions={sessions} onCreate={handleCreate} onResume={handleResume} />;
  }

  return (
    <main aria-label="Scanner">
      <header>
        <h1>{active.userName}'s collection</h1>
      </header>
      <TabBar active={tab} onChange={setTab} />
      {tab === 'album' && (
        <AlbumView
          userName={active.userName}
          albumRepo={deps.albumRepo}
          downloadText={deps.downloadText}
          now={deps.now}
        />
      )}
      {tab === 'reps' && (
        <RepsView
          scans={scans}
          thumbnails={thumbnails}
          detection={detection}
          noDetection={noDetection}
          scanning={scanning}
          orientation={orientation}
          videoRef={videoRef}
          onCapture={handleCapture}
          onConfirm={handleConfirm}
          onCorrect={handleCorrect}
          onSkip={() => setDetection(null)}
          onRescan={() => setDetection(null)}
          onManualAdd={handleManualAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExportText={handleExportText}
          onExportJson={handleExportJson}
          onSetOrientation={setOrientation}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 3: Update `App.test.tsx` to add `albumRepo` to `makeDeps`**

Open `web/test/App.test.tsx`. Add the import:

```typescript
import { MemoryAlbumRepo } from '../src/storage/memory-repos';
```

In `makeDeps`, add `albumRepo` to the returned object:

```typescript
function makeDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    sessionRepo: new MemorySessionRepo(ids, clock),
    scanRepo: new MemoryScanRepo(ids, clock),
    imageStore: new MemoryImageStore(),
    albumRepo: new MemoryAlbumRepo(ids, clock),
    scanOnce: vi.fn(async () => ({
      candidate: { code: { prefix: 'ARG', number: 1, canonical: 'ARG01' }, confidence: 0.9 },
      imageDataUrl: 'data:image/png;base64,AAAA',
    })),
    now: () => '2026-06-04T12:00:00.000Z',
    downloadText: vi.fn(),
    downloadJson: vi.fn(),
    delay: async () => {},
    nowMs: (() => {
      let t = 0;
      return () => (t += 300);
    })(),
    scanTimeoutMs: 1500,
    ...overrides,
  };
}
```

- [ ] **Step 4: Update `composition.ts` to add `IdbAlbumRepo`**

Open `web/src/composition.ts`. Add to the imports:

```typescript
import { IdbSessionRepo, IdbScanRepo, IdbImageStore, IdbAlbumRepo } from './storage/idb-repos';
```

In the returned object from `createAppDeps`, add:

```typescript
albumRepo: new IdbAlbumRepo(db, uuid, nowIso),
```

- [ ] **Step 5: Run the full test suite**

```bash
. ~/.nvm/nvm.sh && nvm use 22 && npm run test -- --run
```
Expected: all tests pass (112+ tests).

- [ ] **Step 6: Commit**

```bash
git add web/src/ui/RepsView.tsx web/src/ui/App.tsx web/src/composition.ts web/test/App.test.tsx
git commit -m "feat(album): wire two-tab shell with My Album and My Reps"
```

---

## Self-Review Checklist (run before opening PR)

- [ ] `stickerNumbers('FWC')` returns `['00'..'19']`, `stickerNumbers('ARG')` returns `['01'..'20']`
- [ ] `validateCode('FWC00')` returns a valid code; `validateCode('FWC20')` returns null
- [ ] `toAlbumMissingExport` with empty owned set reports `missing: 980`
- [ ] Tapping a chip in `AlbumView` toggles its visual state and persists to the repo
- [ ] Switching tabs via `TabBar` shows Album or Reps content
- [ ] Existing 112 tests still pass
- [ ] `npx tsc --noEmit` produces no errors
