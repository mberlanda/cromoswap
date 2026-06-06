# Album Tracker Design

Date: 2026-06-04  
Status: ✅ Implemented (My Album / My Reps tabs)

## Problem

The app currently tracks duplicate stickers for swapping (scan → session → collection list).
Users also need to know which stickers they are **missing** from their album — a separate
concept from the duplicate pile. Knowing missing stickers enables future matchmaking.

## Decision Log

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Two-tab navigation: **My Album** and **My Reps** | Cleanly separates "what I own" from "what I want to trade"; mirrors how collectors actually think |
| D2 | Album state is user-scoped (one album per userName) | Multiple family members may share a device; session-level would lose state between sessions |
| D3 | Album tracker is fully manual for this iteration | Avoids coupling the scan pipeline to album state; can be integrated later |
| D4 | Album entries stored in a new `album` IDB store | Reusing `scans` would conflate two different semantics; clean separation is easier to evolve |
| D5 | FWC uses numbers 00–19, all other teams 01–20 | Matches the actual Panini WC 2026 album; FWC00 is the cover sticker |
| D6 | Layout: team cards always expanded (Option B) | Fastest path to any sticker; no tap-to-expand friction; full name visible without interaction |
| D7 | Export lives inside each section (not a separate tab) | Keeps the action close to the data; reduces navigation depth |
| D8 | "Missing" export groups codes by prefix, one per line | Matches the existing text-export pattern; easy to paste into a swap post |

## Navigation

```
SessionGate (name required)
└── Main (two tabs)
    ├── My Album   — owned checklist, manual toggle, export
    └── My Reps    — scan or manual, duplicates count, export
```

The existing `SessionGate` is unchanged. Once a session is active the app shows two tabs
instead of a single scrolling page. The scan camera remains inside **My Reps**.

## Data Model

### New type: `AlbumEntry`

```typescript
export interface AlbumEntry {
  id: string;             // uuid
  userName: string;
  normalizedCode: string; // e.g. "ARG07", "FWC00"
  ownedAt: string;        // ISO timestamp
}
```

### IDB schema change

Add an `album` store at **DB_VERSION 2**:

```typescript
album: {
  key: string;          // id
  value: AlbumEntry;
  indexes: {
    byUser: string;                    // userName
    byUserAndCode: [string, string];   // [userName, normalizedCode]
  }
}
```

Migration: the upgrade function adds the new store only; existing `sessions`, `scans`,
and `images` stores are untouched.

### New `AlbumRepo` interface

```typescript
export interface AlbumRepo {
  toggle(userName: string, normalizedCode: string): Promise<'added' | 'removed'>;
  listByUser(userName: string): Promise<AlbumEntry[]>;
}
```

`toggle` checks whether `(userName, normalizedCode)` exists:
- If absent → creates entry, returns `'added'`
- If present → deletes entry, returns `'removed'`

This is the only write path; the UI has no separate add/delete calls.

## Static Data

### `team-names.json`

A new asset file mapping every prefix to its full display name, in album order (FWC first,
then teams in the order they appear in `prefixes.json`):

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

The order of keys defines the album order. `FWC` is intentionally first.

### `album-config.ts`

A small module that derives the sticker number range per prefix:

```typescript
export function stickerNumbers(prefix: string): string[] {
  if (prefix === 'FWC') return Array.from({ length: 20 }, (_, i) => i.toString().padStart(2, '0'));
  return Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(2, '0'));
}
// FWC → ["00","01",...,"19"]
// ARG → ["01","02",...,"20"]
```

## Components

### `AlbumView`

Top-level view for the **My Album** tab.

Props:
```typescript
interface AlbumViewProps {
  userName: string;
  albumRepo: AlbumRepo;
}
```

Renders:
- A scrollable list of `TeamCard` components (one per entry in `team-names.json`)
- A sticky footer with **Export owned** and **Export missing** buttons

### `TeamCard`

Props:
```typescript
interface TeamCardProps {
  prefix: string;
  fullName: string;
  numbers: string[];      // from stickerNumbers(prefix)
  ownedCodes: Set<string>; // e.g. Set { "ARG01", "ARG07" }
  onToggle: (code: string) => void;
}
```

Renders:
- Header row: `{prefix} · {fullName}` left, `{owned} / {total}` right
- Grid of number chips: green (owned) or light (not owned)
- Tapping a chip calls `onToggle(code)` immediately; state updates optimistically

### `RepsView`

The renamed Collection/Scan view. Thin wrapper around the existing `App` scan area and
`CollectionList`. Navigation chrome is lifted up to the two-tab shell.

## Export Format

### My Album — Export owned

```
# Cromoswap – My Album – Owned
# User: Mauro
# Date: 2026-06-04T12:00:00.000Z
# Total: 47

FWC00 FWC01 FWC03
ARG01 ARG02 ARG04
…
```

One line per team, codes separated by spaces. Teams with zero owned stickers are omitted.

### My Album — Export missing

```
# Cromoswap – My Album – Missing
# User: Mauro
# Date: 2026-06-04T12:00:00.000Z
# Missing: 933

FWC: FWC02 FWC04 FWC05 FWC07 …
ARG: ARG03 ARG06 ARG08 …
…
```

One line per team that has at least one missing sticker.

### My Reps — Export owned / missing

Reuses the existing `toTextExport` / format with an additional header indicating it is the
reps (duplicate) pile. "Missing" for reps means codes with zero scans in the active session.

## App Shell Changes

The current `App.tsx` becomes a two-tab shell once a session is active:

```tsx
<main>
  <TabBar active={tab} onChange={setTab} />
  {tab === 'album' && <AlbumView userName={active.userName} albumRepo={deps.albumRepo} />}
  {tab === 'reps'  && <RepsView  ...existingProps />}
</main>
```

`TabBar` renders two tabs: "My Album" and "My Reps". Default tab is "My Reps" (scan is
still the primary action after entering a session).

## Dependency Injection

`AppDeps` gains one new field:

```typescript
albumRepo: AlbumRepo;
```

`createAppDeps()` in `composition.ts` instantiates `IdbAlbumRepo`. Tests inject
`MemoryAlbumRepo`.

## Validator Change

`validateCode` currently rejects numbers below `01`. For FWC, `FWC00` must be valid.
Update the lower bound check:

```typescript
// FWC: valid range 0–19 (cover sticker is FWC00)
// All others: valid range 1–20
const isFwc = prefix === 'FWC';
if (isFwc  && (number < 0  || number > 19)) return null;
if (!isFwc && (number < 1  || number > 20)) return null;
```

## Out of Scope (this iteration)

- Auto-marking album owned when a scan is saved
- Matchmaking (compare my missing vs someone else's reps)
- Album sync to the backend
- Per-sticker notes or images in the album
