# Product Spec — WC 2026 Sticker Scanner (MVP)

Status: accepted · Date: 2026-06-04

A mobile-first web app that lets a collector scan the backs of duplicate Panini World
Cup 2026 stickers, confirm or correct the detected code, and build an editable,
exportable list for a named collection session.

## Goals

- Fast, forgiving capture of sticker codes with effortless confirm/correct.
- Local-first persistence so a session survives reload and works offline.
- Exportable, unambiguous data that is ready for a future sharing/matchmaking feature.

## Non-goals (MVP)

- Authentication, public sharing, or matchmaking.
- Server-side image storage (images stay on device — privacy-local).
- Perfect OCR. We optimize the confirm/correct loop instead.
- Trained/ML sticker detection (design seams for it; do not build).

## Primary user journey

1. Open app → 2. Enter name (create or resume session) → 3. Grant camera permission →
4. Place sticker in the scan-area overlay → 5. App extracts the code from the top-right
region → 6. App shows proposed code + captured image → 7. Confirm / correct / skip /
rescan → 8. Confirmed scan stored in active session → 9. View / edit / delete / add
manually → 10. Export the list and evidence.

## Sticker code domain

- Canonical form: `<PREFIX><NN>` — three-letter prefix + number `01`–`20`
  (e.g. `ARG01`, `USA13`, `FWC07`).
- Tolerant input normalized to canonical: `ARG 1`, `ARG 01`, `ARG-01`, `arg01` → `ARG01`.
- Prefix must be in the known list (49 prefixes; canonical source: `assets/prefixes.json`):
  `ALG ARG AUS AUT BEL BIH BRA CAN CPV COL CRO CUW CZE COD ECU EGY ENG FRA GER GHA HAI
  IRN IRQ CIV JPN JOR MEX MAR NED NZL NOR PAN PAR POR QAT KSA SCO SEN RSA KOR ESP SWE
  SUI TUN TUR URU USA UZB FWC`.
- Number must be `01`–`20`.
- Code sits near the **top-right corner** of the sticker back. Most national-team
  stickers are portrait; some team stickers are landscape (often `<PREFIX>13`). FWC
  follows the same convention.

## Functional requirements

### Session management
- Create a session via "What's your name?"; resume an existing local session.
- Persist session metadata: `id`, `user_name`, `created_at`, `updated_at`.

### Scanning
- Camera permission handling with useful error states (prompt, granted, denied, no camera).
- Live camera preview with a scan-area overlay and an emphasized top-right ROI target.
- OCR-based detection that crops the top-right ROI, preprocesses, and runs OCR through an
  injectable adapter; parse → normalize → validate → rank → present best candidate with
  confidence.
- Debounce repeated detections so one sticker is not added multiple times.
- Explicit confirm required before storing. Manual-entry fallback always available.
- Captured image attached to each confirmed scan (stored locally).

### Collection management
- List confirmed scans in the active session: code, captured time, optional thumbnail,
  duplicate count badge.
- Edit a code, delete a scan, add a scan manually.
- Data preserved locally across close/reopen and reload.

### Export
- Plain-text file of confirmed normalized codes with a metadata header: user name,
  session id, export time, total scans, counts by code.
- JSON export embedding metadata + scans + image data URLs (self-contained, single file).
  ZIP export is a documented future option (see ADR-0002).

## Architecture summary

- **Frontend:** React + TypeScript + Vite. Mobile-first, portrait default.
- **Backend:** Rails 8 + Postgres — CRUD for sessions/scans, matchmaking-ready. Receives
  **codes + metadata only**; never images.
- **Asset tool:** build-time TypeScript that turns an annotated corpus into versioned
  static assets (`mask-config.json`, `prefixes.json`, `ocr-profile.json`).
- **Persistence:** local-first IndexedDB (sessions, scans, images) via typed repos;
  best-effort `SyncClient` pushes codes+metadata to the API. App works offline.

Repo layout:

```
/web                React+TS+Vite (camera, OCR pipeline, IndexedDB, UI)
/api                Rails 8 + Postgres (sessions, scans CRUD + sync)
/tools/asset-gen    TS: corpus → assets
/assets             generated: mask-config.json, prefixes.json, ocr-profile.json
/docs               specs, plans, adr
docker-compose.yml  db + api + web
```

## OCR pipeline (injectable, camera-free testable)

`CameraSource → MaskOverlay (UI) → RoiCropper (top-right, from mask-config) →
Preprocessor (grayscale/threshold/scale) → OcrAdapter [interface] → CodeParser
(normalize) → CodeValidator (prefix∈dict, 01–20) → CandidateRanker →
ScanController (debounce, confirm/correct/skip/rescan)`.

Designed extension seams (not built in MVP):
- `OrientationStrategy`: MVP tries 0°; follow-up tries 0/90/180/270°.
- `Localizer`: MVP uses static ROI (Level 1 mask); later adds contour detection + rectify.
- `OcrAdapter`: `TesseractAdapter` (runtime) + `MockOcrAdapter` (tests).

See ADR-0003 for the mask/corpus rationale.

## Data model

- **Session**: `id (uuid)`, `user_name`, `created_at`, `updated_at`.
- **Scan**: `id (uuid)`, `session_id`, `normalized_code`, `source (ocr|manual)`,
  `confidence`, `captured_at`, `created_at`, `updated_at`. Image stored locally, keyed by
  scan id; not sent to the server.
- One confirmed sticker = one Scan row. Duplicate counts are **derived** by grouping
  `normalized_code` within a session.

## Testing & coverage

- Web: Vitest units (parser, validator, normalizer, ranker, ROI cropper with fixtures,
  repos via in-memory impl, exporters, sync with mock fetch); Testing Library (permission
  states, confirm/correct, list CRUD, manual entry); Playwright e2e with mocked camera +
  Mock OCR.
- API: Rails model + request specs for CRUD.
- Coverage targets: web **lines > 90%, branches > 80%** (Vitest thresholds); Rails
  SimpleCov. Exclude only generated files, build output, framework boilerplate.

## Acceptance criteria (first working version)

- Create a named session; scan or mock-scan a code.
- App detects valid codes (known prefix, 01–20) and asks to confirm/correct before saving.
- Session survives page reload.
- Edit, delete, and manually add entries.
- Export a text list of confirmed codes.
- Tests meet coverage thresholds.
- Runs locally from documented commands and serves via Docker Compose.
- Docs and ADRs explain the major choices.

## Future (design-for, do not build)

Sharing a collector's list and matchmaking exchanges between collectors. Keep the data
model exportable and unambiguous: owner/session identity, normalized code, quantity,
scan evidence, timestamps. The codes+metadata sync split already supports this.
