# CX improvements: Album select-all, Reps counter grid, Import, and navigation fixes

Date: 2026-06-05
Branch: `feat/cx-album-reps-import`
Status: ✅ Implemented (#33)

## Summary

Five connected customer-experience improvements to the Cromoswap web app, in
priority order:

1. **My Album — per-team "All / Clear"** to fill or clear a team in one tap.
2. **My Reps — counter grid** (0–7 copies per sticker) with an add / remove /
   clear tap mode, mirroring the album layout.
3. **Import** of text and JSON exports, including full session restore.
4. **Resume button contrast fix** (white text on a light background today).
5. **Back-to-home navigation** from inside a session without reloading.

All five ship on one branch. Import is implemented last (Phase 3) but its design
is captured here. No backend changes are required; everything is client-side over
the existing repositories.

## Background

Relevant current behaviour:

- **My Album** (`AlbumView` + `TeamCard`): a per-user owned/not-owned grid backed
  by `AlbumRepo.toggle` / `listByUser`. Each chip is binary (owned = green).
- **My Reps** (`RepsView`): a session's scans. `countByCode(scans)` already maps a
  normalized code to how many scans carry it. The view today shows a camera
  scanner, a manual text entry, a row-based collection list (thumbnails / edit /
  delete), and export buttons.
- **Exports**: grouped album text (`toAlbumOwnedExport` / `toAlbumMissingExport`,
  headed `# Cromoswap – My Album – Owned|Missing`), reps text (`toTextExport`,
  headed `# WC 2026 Sticker Scanner export`), and reps JSON (`toJsonExport`,
  carries `session + scans + countsByCode + images`).
- **Navigation**: `App` holds `active: Session | null`. Once a session is active
  there is no UI to return to `SessionGate` — the only way back is a page reload.

## Feature 1 — My Album: per-team All / Clear

### Behaviour

Each `TeamCard` header gains one compact pill button next to the count:

- Team not complete → button reads **All**; tapping marks every sticker in that
  team owned.
- Team complete → button reads **Clear**; tapping unmarks every sticker.

Individual chip taps are unchanged. There is **no** owned/missing highlight lens
(explicitly dropped during design). The intended workflow for a mostly-complete
team: tap **All**, then untick the few you are missing.

### Implementation

- `AlbumRepo` gains batch operations so a team toggle is one round trip, not 20:
  - `setMany(userName, codes: string[], owned: boolean): Promise<void>`
  - Implement in `memory-repos`, `idb-repos`, `api-repos` (cloud mode).
- `TeamCard` takes an `onSetAll(prefix, owned)` callback and derives the button
  label from whether `ownedCount === numbers.length`.
- `AlbumView.handleSetAll` updates the `ownedCodes` set optimistically and calls
  `albumRepo.setMany`.

### Styling

Pill button: small (`font-size: 11px`, `padding: 2px 7px`, `border-radius: 999px`),
`--scan-strong` text on `--surface` for **All**, `--muted` for **Clear**. Minimal
footprint per the requirement.

## Feature 2 — My Reps: counter grid with tap mode

### Concept

A second view of the *same* scan data, laid out like the album but where each chip
is a **copy counter from 0 to 7** rather than a binary owned flag. The count is
`countByCode` clamped to 7. Counts are populated by OCR scans (+1) or by manual
taps in the grid.

### Data model (confirmed)

One copy = one scan row — today's model, no new storage:

- **+1** tap → `scanRepo.add` a `manual` scan for that code (clamped: no-op at 7).
- **−1** tap → delete one scan of that code (`scanRepo.delete`, floor 0).
- **Clear** tap → delete all scans of that code in the active session.
- OCR scan → +1, exactly as today.

The grid is a pure projection of `countByCode(scans)` for the active session. The
existing row-based collection list (thumbnails / edit / delete) stays reachable.

The 0–7 clamp keeps each per-sticker count representable as a single `int8`,
which the import/export format can rely on later.

### UI / IA

- **View switch** at the top of My Reps: `📷 Scan` | `▦ Grid` (default `Scan`).
  - `Scan` view: today's camera flow + manual text entry + collection list +
    export.
  - `Grid` view: the counter grid + tap-mode control.
- **Tap-mode control** (sticky while in Grid): a 3-segment slider
  `– 1 (give away)` / `+ 1 (got one)` / `⌫ Clear`. Default `+ 1`. The active
  segment is tinted: `--scan` for +1, `--danger` for −1, `--ink` for Clear. A tap
  on any chip applies the active mode to that sticker.
- **Chip visuals**: dim/grey when count 0; `--scan` green when ≥1; an amber
  (`--review`) corner badge shows the exact count for 2–7; a chip at the cap of 7
  gets a subtle ring and further +1 is a no-op.
- **Team header** shows `<copies> copies · <spares> spare`, where copies is the
  sum and spares is copies minus distinct-owned (i.e. duplicates).

### Components

- New `RepsGrid` component (team cards + count chips), reusing the album grouping
  from `album-config` (`ALBUM_GROUPS`, `stickerNumbers`, `teamFlag`, etc.).
- New `RepsModeToggle` (3-way segmented control), state owned by `RepsView`.
- New `RepsCountChip` (or extend a shared chip) rendering count + badge + cap ring.
- `RepsView` gains a `view: 'scan' | 'grid'` state and a `mode: 'add' | 'remove'
  | 'clear'` state, plus an `onGridTap(code)` handler wired to `App` which performs
  the add/delete against `scanRepo` and refreshes scans.

## Feature 3 — Import (Phase 3)

### Entry point

An **Import** button on the Start screen (`SessionGate`), next to the resume list.
Opens a file picker accepting `.txt` and `.json`. (No in-tab import buttons for
now — confirmed.)

### JSON import — full session restore

- Parse a `JsonExport`. Create a **new** session (never overwrite an existing one),
  re-add its scans via `scanRepo`, and restore images via `imageStore`.
- **Export change (additive):** extend `JsonExport` with an optional
  `albumOwnedCodes: string[]` field, populated from `albumRepo.listByUser`. On
  import, those codes are applied to the new session's user album via
  `albumRepo.setMany`. Older JSON without the field still imports (scans only).

### Text import — partial merge

A text file is a list of codes whose *meaning* must be known. Detection:

- Auto-detect from the header line: `My Album – Owned` → owned, `My Album –
  Missing` → missing, `WC 2026 … export` (counts-by-code) → duplicate.
- If no recognizable header (e.g. a hand-edited paste), prompt the user to pick
  **Owned**, **Missing**, or **Duplicate**, and show the detected kind for
  confirmation when one was found.

Merge semantics (all non-destructive):

- **Owned** → `albumRepo.setMany(user, codes, true)` (adds owned).
- **Missing** → mark every code *not* listed as owned: `setMany(user, universe −
  listed, true)`. The universe is `ALBUM_ORDER × stickerNumbers`.
- **Duplicate** → for each `code: count`, add scans into the active session up to
  the per-code cap of 7.

### Components

- New `web/src/import/` module: `parse-import.ts` (detect kind + parse codes/
  counts from text; parse/validate JSON), pure and unit-tested.
- New `ImportPanel` / button on `SessionGate`; a small kind-picker shown only when
  detection is ambiguous.
- `App` wires import handlers to the repos (create session, setMany, add scans,
  put images) and refreshes session/album lists afterward.

## Feature 4 — Resume button contrast fix

`button.primary` sets `color: white`. The override
`section[aria-label="Resume"] li button` changes the background to the light
`--field` but does not reset the color, leaving white text on a near-white
background. Fix: set `color: var(--ink)` (and keep it in sync for any new Import
button that reuses the same treatment). Verify the rendered label is legible.

## Feature 5 — Back-to-home navigation

`App` renders `SessionGate` only while `active` is null; there is no return path
once a session is active. Add a visible **home / back** control in the in-session
header (`app-header`) that sets `active` back to `null` (and clears
`scans`/`thumbnails`), returning to `SessionGate` without a reload. The session
list refresh already runs on mount of the gate, so resuming afterward works.

## Testing

Vitest runs from `web/` (Node 22). Cover:

- **Album batch** — `setMany` adds/removes a full team across `memory` and `idb`
  repos; `TeamCard` shows All vs Clear by completion; tapping All marks all chips.
- **Reps grid** — `countByCode` clamp at 7; +1 at cap is a no-op; −1 floors at 0;
  Clear removes all rows for a code; OCR +1 reflects in the grid; mode switching
  changes tap effect.
- **Import** — `parse-import` detects owned/missing/duplicate from headers; parses
  codes and `code: count`; rejects malformed input; missing-import computes the
  complement; JSON import restores session + scans + album; old JSON (no album
  field) still imports.
- **Navigation** — back control returns to `SessionGate`; resume still works after.
- **Contrast** — a render/style assertion (or at least a manual verification note)
  that the Resume label color is not white-on-field.

## Out of scope

- Compact base64 / QR share codes (considered, deferred).
- Owned/missing highlight lens for the album (dropped).
- Any backend/API schema change beyond the additive cloud `setMany`.
- Conflict resolution / dedup when importing into a populated session beyond the
  stated additive + cap-at-7 rules.

## Implementation order

1. Feature 4 (contrast) and Feature 5 (back-home) — small, independent.
2. Feature 1 (album All/Clear) — repo `setMany` + `TeamCard`.
3. Feature 2 (reps grid) — largest UI piece.
4. Feature 3 (import) — depends on `setMany` (F1) and the JSON export change.
