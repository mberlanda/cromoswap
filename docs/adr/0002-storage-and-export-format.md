# ADR-0002: Storage and export format

Status: accepted · Date: 2026-06-04

> **Update (2026-06):** the local-first model and repo interfaces below still
> hold, but storage became **user-selectable Local (IndexedDB) or Cloud (API)**
> and gained **import** alongside export. The JSON export now also embeds the
> user's album codes. These extensions are designed in
> [`../superpowers/specs/2026-06-05-cx-album-reps-import-design.md`](../superpowers/specs/2026-06-05-cx-album-reps-import-design.md)
> and the pluggable-storage work; this ADR is not superseded, only extended.

## Context

The MVP must persist sessions and scans locally (survive reload, work offline), keep
captured images private to the device, and export confirmed codes plus enough metadata to
be useful and matchmaking-ready. The kickoff requires a text export and either a JSON
export with image data URLs or a ZIP of the text file plus images, implementing the
simpler reliable option first.

## Decision

### Storage
- **Local-first IndexedDB** via a typed wrapper. Object stores: `sessions`, `scans`,
  `images` (image blob/data URL keyed by scan id).
- Access through interfaces — `SessionRepo`, `ScanRepo`, `ImageStore` — each with an
  IndexedDB implementation and an in-memory implementation for tests.
- A best-effort `SyncClient` pushes **codes + metadata only** to the Rails API. Images
  never leave the device in the MVP.
- One confirmed sticker = one `Scan` row; duplicate counts are derived by grouping
  `normalized_code` per session.

### Export
- **Text** (`.txt`): one normalized code per line, with a metadata header — user name,
  session id, export time, total scans, counts by code.
- **JSON** (`.json`): a single self-contained file with the same metadata plus the scan
  list and image **data URLs**. Implemented first.
- **ZIP** (text + image files): documented future option, not built in the MVP.

## Alternatives considered

- **ZIP first** instead of JSON — nicer for large image sets, but needs a zip dependency
  and more moving parts to test. Deferred; JSON-with-data-URLs is a single file, no extra
  deps, and trivially testable.
- **Server as source of truth** — rejected for the MVP: conflicts with offline use and the
  privacy-local image requirement.

## Consequences

- JSON exports embedding data URLs grow large with many images; acceptable for MVP scale.
  ZIP remains the escape hatch when image counts grow.
- Deriving counts (rather than storing a quantity column) keeps edit/delete simple and
  avoids denormalization bugs; counts are computed on read.
- The codes+metadata sync split makes the backend immediately useful for future
  sharing/matchmaking without touching the privacy model.
