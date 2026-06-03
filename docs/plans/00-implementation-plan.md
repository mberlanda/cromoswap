# WC 2026 Sticker Scanner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) or
> superpowers:subagent-driven-development to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MVP: a mobile-first web app to scan Panini WC 2026 sticker codes with
a confirm/correct workflow, local-first persistence, text/JSON export, plus a Rails 8 +
Postgres CRUD backend, all test-driven.

**Architecture:** Monorepo. React+TS+Vite frontend with an injectable OCR pipeline and
IndexedDB local-first storage; Rails 8 + Postgres backend receiving codes+metadata only
(images stay on device); a build-time TS asset tool turning a corpus into versioned
static assets. See `docs/specs/00-product-spec.md` and `docs/adr/000{1,2,3}-*.md`.

**Tech Stack:** Node 22 (nvm), TypeScript, React, Vite, Vitest, Testing Library,
Playwright, Tesseract.js; Ruby 3.3.6 (rbenv), Rails 8, Postgres, RSpec, SimpleCov; Docker
Compose.

**Toolchain pins:** `/web` and `/tools/asset-gen` use Node 22 (`.nvmrc`). `/api` uses
Ruby 3.3.6 (`.ruby-version`). Postgres runs in Docker for local dev and Compose.

---

## File structure

```
.nvmrc                                  Node 22 pin (root, for web+tools)
docker-compose.yml                      db + api + web
README.md                               run/test/docker instructions

assets/
  prefixes.json                         49 valid prefixes (committed, also generated)
  mask-config.json                      aspect ratios + top-right ROI rectangles
  ocr-profile.json                      Tesseract char whitelist + PSM hints

tools/asset-gen/
  package.json, tsconfig.json, vitest.config.ts
  src/corpus.ts                         corpus types + annotation loader
  src/derive-roi.ts                     bounding boxes -> ROI rectangle
  src/generate.ts                       writes assets/*.json
  test/derive-roi.test.ts

web/
  package.json, tsconfig.json, vite.config.ts, vitest.config.ts, playwright.config.ts
  .nvmrc
  src/domain/
    prefixes.ts                         loads prefixes (from assets)
    parser.ts                           raw text -> candidate strings
    normalizer.ts                       candidate -> canonical PREFIXNN
    validator.ts                        prefix∈set && 01..20
    ranker.ts                           rank candidates by validity+confidence
    types.ts                            Candidate, StickerCode, Scan, Session
  src/ocr/
    ocr-adapter.ts                      OcrAdapter interface + types
    mock-ocr-adapter.ts                 deterministic test adapter
    tesseract-adapter.ts                Tesseract.js implementation
    roi-cropper.ts                      crop top-right ROI from ImageData
    preprocessor.ts                     grayscale/threshold/scale
    pipeline.ts                         orchestrates crop->pre->ocr->parse->rank
  src/storage/
    db.ts                               IndexedDB open/upgrade (idb)
    session-repo.ts                     SessionRepo interface + IndexedDB impl
    scan-repo.ts                        ScanRepo interface + IndexedDB impl
    image-store.ts                      ImageStore interface + IndexedDB impl
    memory-repos.ts                     in-memory impls for tests
    sync-client.ts                      best-effort push to API
  src/export/
    text-export.ts                      codes + metadata header
    json-export.ts                      metadata + scans + image data URLs
  src/ui/
    App.tsx, SessionGate.tsx, CameraView.tsx, MaskOverlay.tsx,
    DetectionResult.tsx, ManualEntry.tsx, CollectionList.tsx, ExportPanel.tsx
    camera-permission.ts                permission state machine
  test/...                              mirrors src/

api/                                    Rails 8 app (generated)
  .ruby-version
  app/models/session.rb, app/models/scan.rb
  app/controllers/api/v1/sessions_controller.rb, scans_controller.rb
  db/migrate/*, config/routes.rb
  spec/...                              RSpec model + request specs
```

---

## Milestone M0 — Monorepo scaffold & tooling

### Task 0.1: Root pins and assets seed

**Files:**
- Create: `.nvmrc`, `assets/prefixes.json`

- [ ] **Step 1:** Write `.nvmrc` containing `22`.
- [ ] **Step 2:** Write `assets/prefixes.json` as a JSON array of the 49 prefixes
  (ALG…FWC, exact list from the spec).
- [ ] **Step 3:** Commit.

```bash
git add .nvmrc assets/prefixes.json
git commit -m "chore: pin node 22 and seed prefix list"
```

---

## Milestone M2 — Web scaffold & domain core (TDD)

> Built before camera (M4) because the pipeline depends on these pure units. Camera+OCR
> (M4) is the first *demonstrable* slice and lands immediately after.

### Task 2.1: Vite + Vitest scaffold

**Files:**
- Create: `web/` via scaffold, `web/.nvmrc`, `web/vitest.config.ts`

- [ ] **Step 1:** `cd web` after `npm create vite@latest web -- --template react-ts`.
- [ ] **Step 2:** Install dev deps: `vitest @vitest/coverage-v8 jsdom
  @testing-library/react @testing-library/user-event @testing-library/jest-dom idb
  tesseract.js`.
- [ ] **Step 3:** Configure `vitest.config.ts` with `environment: 'jsdom'`,
  `coverage: { provider: 'v8', thresholds: { lines: 90, branches: 80 }, exclude:
  ['**/*.config.*','**/main.tsx','**/vite-env.d.ts','dist/**'] }`.
- [ ] **Step 4:** Add npm scripts: `test`, `test:coverage`, `dev`, `build`, `e2e`.
- [ ] **Step 5:** Run `npm test -- --run` (no tests yet → exits 0 or "no tests"). Commit.

### Task 2.2: Domain types

**Files:**
- Create: `web/src/domain/types.ts`

- [ ] **Step 1:** Define interfaces:

```ts
export interface Candidate { raw: string; confidence: number; }
export type ScanSource = 'ocr' | 'manual';
export interface StickerCode { prefix: string; number: number; canonical: string; }
export interface Scan {
  id: string; sessionId: string; normalizedCode: string;
  source: ScanSource; confidence: number; capturedAt: string;
  createdAt: string; updatedAt: string;
}
export interface Session {
  id: string; userName: string; createdAt: string; updatedAt: string;
}
```

- [ ] **Step 2:** Commit.

### Task 2.3: Normalizer (TDD)

**Files:**
- Create: `web/src/domain/normalizer.ts`, `web/test/normalizer.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { normalizeCode } from '../src/domain/normalizer';

describe('normalizeCode', () => {
  it.each([
    ['ARG 1', 'ARG01'], ['ARG 01', 'ARG01'], ['ARG-01', 'ARG01'],
    ['arg01', 'ARG01'], ['  usa13 ', 'USA13'], ['fwc7', 'FWC07'],
  ])('normalizes %s -> %s', (input, expected) => {
    expect(normalizeCode(input)).toBe(expected);
  });
  it('returns null when no code shape is present', () => {
    expect(normalizeCode('hello')).toBeNull();
  });
});
```

- [ ] **Step 2:** Run `npm test -- --run normalizer` → FAIL (module missing).
- [ ] **Step 3: Implement**

```ts
export function normalizeCode(input: string): string | null {
  const m = input.toUpperCase().match(/([A-Z]{3})\s*[-]?\s*(\d{1,2})/);
  if (!m) return null;
  const num = parseInt(m[2], 10);
  return `${m[1]}${String(num).padStart(2, '0')}`;
}
```

- [ ] **Step 4:** Run test → PASS.
- [ ] **Step 5:** Commit `feat(web): sticker code normalizer`.

### Task 2.4: Prefix set + validator (TDD)

**Files:**
- Create: `web/src/domain/prefixes.ts`, `web/src/domain/validator.ts`,
  `web/test/validator.test.ts`

- [ ] **Step 1:** `prefixes.ts` imports `assets/prefixes.json` and exports
  `export const PREFIXES = new Set<string>(prefixesJson);`
- [ ] **Step 2: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { validateCode } from '../src/domain/validator';

describe('validateCode', () => {
  it('accepts a known prefix with number 01-20', () => {
    expect(validateCode('ARG01')).toEqual({ prefix: 'ARG', number: 1, canonical: 'ARG01' });
    expect(validateCode('FWC20')).toEqual({ prefix: 'FWC', number: 20, canonical: 'FWC20' });
  });
  it('rejects unknown prefix', () => { expect(validateCode('ZZZ01')).toBeNull(); });
  it('rejects number out of range', () => {
    expect(validateCode('ARG00')).toBeNull();
    expect(validateCode('ARG21')).toBeNull();
  });
  it('rejects malformed input', () => { expect(validateCode('AR1')).toBeNull(); });
});
```

- [ ] **Step 3:** Run → FAIL.
- [ ] **Step 4: Implement**

```ts
import { PREFIXES } from './prefixes';
import type { StickerCode } from './types';
export function validateCode(canonical: string): StickerCode | null {
  const m = canonical.match(/^([A-Z]{3})(\d{2})$/);
  if (!m) return null;
  const prefix = m[1]; const number = parseInt(m[2], 10);
  if (!PREFIXES.has(prefix)) return null;
  if (number < 1 || number > 20) return null;
  return { prefix, number, canonical };
}
```

- [ ] **Step 5:** Run → PASS. Commit `feat(web): prefix set + code validator`.

### Task 2.5: Parser (TDD)

**Files:**
- Create: `web/src/domain/parser.ts`, `web/test/parser.test.ts`

- [ ] **Step 1: Failing test** — `parseCandidates(rawOcrText)` extracts candidate
  substrings that look like codes (handles multi-line, noise).

```ts
import { describe, it, expect } from 'vitest';
import { parseCandidates } from '../src/domain/parser';
describe('parseCandidates', () => {
  it('extracts code-like tokens from noisy text', () => {
    expect(parseCandidates('foo ARG 01\nbar USA13')).toEqual(['ARG 01', 'USA13']);
  });
  it('returns [] when nothing matches', () => {
    expect(parseCandidates('no codes here')).toEqual([]);
  });
});
```

- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement** using `String.matchAll(/[A-Z]{3}\s*-?\s*\d{1,2}/gi)`,
  trimming each match.
- [ ] **Step 4:** Run → PASS. Commit `feat(web): OCR text candidate parser`.

### Task 2.6: Ranker (TDD)

**Files:**
- Create: `web/src/domain/ranker.ts`, `web/test/ranker.test.ts`

- [ ] **Step 1: Failing test** — `rankCandidates(candidates)` returns
  `{ code: StickerCode; confidence: number }[]` sorted by: valid first, then confidence
  desc; invalid candidates dropped.

```ts
import { describe, it, expect } from 'vitest';
import { rankCandidates } from '../src/domain/ranker';
describe('rankCandidates', () => {
  it('keeps only valid codes, ordered by confidence', () => {
    const out = rankCandidates([
      { raw: 'ZZZ01', confidence: 0.9 },
      { raw: 'ARG 1', confidence: 0.4 },
      { raw: 'USA13', confidence: 0.8 },
    ]);
    expect(out.map(o => o.code.canonical)).toEqual(['USA13', 'ARG01']);
  });
  it('returns [] when none valid', () => {
    expect(rankCandidates([{ raw: 'ZZZ99', confidence: 1 }])).toEqual([]);
  });
});
```

- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3: Implement** — normalize each raw, validate, drop nulls, sort by confidence
  desc.
- [ ] **Step 4:** Run → PASS. Commit `feat(web): candidate ranker`.

---

## Milestone M3 — Asset tool (TDD) & generated assets

### Task 3.1: asset-gen scaffold + ROI derivation (TDD)

**Files:**
- Create: `tools/asset-gen/{package.json,tsconfig.json,vitest.config.ts}`,
  `tools/asset-gen/src/{corpus.ts,derive-roi.ts,generate.ts}`,
  `tools/asset-gen/test/derive-roi.test.ts`

- [ ] **Step 1:** Init package with `typescript vitest`. `.nvmrc` → 22.
- [ ] **Step 2: Failing test** for `deriveRoi(annotations)` → returns a padded bounding
  rectangle (relative 0..1) covering all code boxes, clamped to [0,1].

```ts
import { describe, it, expect } from 'vitest';
import { deriveRoi } from '../src/derive-roi';
describe('deriveRoi', () => {
  it('returns padded union rect of code boxes (relative, clamped)', () => {
    const roi = deriveRoi([
      { x: 0.7, y: 0.05, w: 0.2, h: 0.08 },
      { x: 0.72, y: 0.04, w: 0.22, h: 0.10 },
    ], 0.02);
    expect(roi.x).toBeCloseTo(0.68); expect(roi.y).toBeCloseTo(0.02);
    expect(roi.w).toBeCloseTo(0.28); expect(roi.h).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 3:** Run → FAIL. Implement union+pad+clamp. Run → PASS.
- [ ] **Step 4:** `generate.ts` writes `assets/mask-config.json` (portrait+landscape ROIs)
  and `assets/ocr-profile.json` (`{ whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  psm: 7 }`), and re-emits `assets/prefixes.json`. Add `npm run generate`.
- [ ] **Step 5:** Run generate; commit assets + tool `feat(tools): corpus asset generator`.

---

## Milestone M4 — Camera + OCR pipeline (first demonstrable slice)

### Task 4.1: ROI cropper (TDD)

**Files:**
- Create: `web/src/ocr/roi-cropper.ts`, `web/test/roi-cropper.test.ts`

- [ ] **Step 1: Failing test** — `cropRoi(imageData, roi)` returns an ImageData of the
  sub-rectangle. Use a hand-built `ImageData` (jsdom + canvas polyfill or a plain object
  with width/height/data) and assert dimensions + corner pixel.
- [ ] **Step 2:** Run → FAIL. Implement pixel copy into a new `ImageData`.
- [ ] **Step 3:** Run → PASS. Commit `feat(web): ROI cropper`.

### Task 4.2: Preprocessor (TDD)

**Files:**
- Create: `web/src/ocr/preprocessor.ts`, `web/test/preprocessor.test.ts`

- [ ] **Step 1: Failing test** — `toGrayscaleThreshold(imageData, threshold)` returns
  ImageData where each pixel is pure black/white based on luminance vs threshold.
- [ ] **Step 2:** Run → FAIL. Implement luminance `0.299r+0.587g+0.114b`, threshold.
- [ ] **Step 3:** Run → PASS. Commit `feat(web): grayscale/threshold preprocessor`.

### Task 4.3: OCR adapter interface + mock (TDD)

**Files:**
- Create: `web/src/ocr/ocr-adapter.ts`, `web/src/ocr/mock-ocr-adapter.ts`,
  `web/test/mock-ocr-adapter.test.ts`

- [ ] **Step 1:** Define interface:

```ts
export interface OcrResult { text: string; confidence: number; }
export interface OcrAdapter { recognize(image: ImageData): Promise<OcrResult>; }
```

- [ ] **Step 2: Failing test** — `MockOcrAdapter` constructed with a scripted result
  returns it from `recognize`.
- [ ] **Step 3:** Implement + PASS. Commit `feat(web): OCR adapter interface + mock`.

### Task 4.4: Pipeline orchestration (TDD)

**Files:**
- Create: `web/src/ocr/pipeline.ts`, `web/test/pipeline.test.ts`

- [ ] **Step 1: Failing test** — `runPipeline(frame, { cropper, pre, ocr, roi })` returns
  ranked valid candidates. Drive with MockOcrAdapter returning `'noise USA13'` and a stub
  cropper/pre (identity) → expect top candidate `USA13`.
- [ ] **Step 2:** Run → FAIL. Implement: crop → preprocess → ocr → parseCandidates →
  map to `{raw, confidence}` → rankCandidates.
- [ ] **Step 3:** Run → PASS. Commit `feat(web): OCR pipeline orchestration`.

### Task 4.5: Tesseract adapter

**Files:**
- Create: `web/src/ocr/tesseract-adapter.ts`

- [ ] **Step 1:** Implement `TesseractAdapter` using `tesseract.js`
  (`createWorker`, set `tessedit_char_whitelist` from `ocr-profile.json`, `psm`).
  Convert `ImageData`→canvas for recognition. (Excluded from coverage via thin wrapper;
  logic lives in tested units.)
- [ ] **Step 2:** Commit `feat(web): tesseract OCR adapter`.

### Task 4.6: Camera permission state machine (TDD)

**Files:**
- Create: `web/src/ui/camera-permission.ts`, `web/test/camera-permission.test.ts`

- [ ] **Step 1: Failing test** — `requestCamera(getUserMedia)` returns
  `{state:'granted', stream}` on success; `{state:'denied'}` on `NotAllowedError`;
  `{state:'no-camera'}` on `NotFoundError`. Inject a fake getUserMedia.
- [ ] **Step 2:** Run → FAIL. Implement try/catch mapping by `err.name`.
- [ ] **Step 3:** Run → PASS. Commit `feat(web): camera permission state machine`.

### Task 4.7: Camera + Mask overlay + Detection UI (TDD with Testing Library)

**Files:**
- Create: `web/src/ui/MaskOverlay.tsx`, `web/src/ui/CameraView.tsx`,
  `web/src/ui/DetectionResult.tsx`, tests alongside.

- [ ] **Step 1: Failing test (MaskOverlay)** — renders an ROI box with the relative
  position from `mask-config` (assert style/test-id present).
- [ ] **Step 2:** Implement; PASS.
- [ ] **Step 3: Failing test (DetectionResult)** — given a candidate, shows code,
  confidence, thumbnail, and Confirm/Correct/Skip/Rescan buttons; clicking Confirm calls
  `onConfirm` with the code. Implement; PASS.
- [ ] **Step 4: Failing test (CameraView)** — with a mock pipeline + permission=granted,
  a captured frame yields a detection shown in DetectionResult; debounce prevents double
  emit. Implement with injectable pipeline; PASS.
- [ ] **Step 5:** Commit `feat(web): camera view, mask overlay, detection UI`.

---

## Milestone M5 — Persistence & session flow (TDD)

### Task 5.1: In-memory repos (TDD)

**Files:**
- Create: `web/src/storage/session-repo.ts` (interface), `web/src/storage/scan-repo.ts`
  (interface), `web/src/storage/image-store.ts` (interface),
  `web/src/storage/memory-repos.ts`, tests.

- [ ] **Step 1: Failing test** — `MemorySessionRepo`: create → get → list → update bumps
  `updatedAt`. `MemoryScanRepo`: add → listBySession → update code → delete.
  `MemoryImageStore`: put(id, dataUrl) → get(id) → delete(id).
- [ ] **Step 2:** Define interfaces; implement memory versions; PASS.
- [ ] **Step 3:** Commit `feat(web): repo interfaces + in-memory impls`.

### Task 5.2: IndexedDB impls (TDD with fake-indexeddb)

**Files:**
- Create: `web/src/storage/db.ts`, `web/src/storage/{session,scan,image}` IndexedDB
  classes; install `fake-indexeddb` dev dep; tests use it.

- [ ] **Step 1: Failing test** — run the same behavioral suite as 5.1 against the
  IndexedDB impls using `fake-indexeddb/auto`. Assert persistence across a re-open.
- [ ] **Step 2:** Implement with `idb`. PASS.
- [ ] **Step 3:** Commit `feat(web): IndexedDB persistence`.

### Task 5.3: Session create/resume + confirm-store flow (TDD)

**Files:**
- Create: `web/src/ui/SessionGate.tsx`, a `useSession` hook, wire DetectionResult.confirm
  → ScanRepo.add + ImageStore.put. Tests with memory repos.

- [ ] **Step 1: Failing test** — entering a name creates a session (persisted); reopening
  resumes it. Confirming a detection stores a scan + image. Reload (re-instantiate repo
  from same backing store) shows the scan.
- [ ] **Step 2:** Implement; PASS. Commit `feat(web): session gate + confirm-store flow`.

---

## Milestone M6 — Collection management (TDD)

### Task 6.1: Collection list + counts (TDD)

**Files:**
- Create: `web/src/ui/CollectionList.tsx`, `web/src/domain/counts.ts`, tests.

- [ ] **Step 1: Failing test (counts)** — `countByCode(scans)` returns a map of canonical
  → count. Implement; PASS.
- [ ] **Step 2: Failing test (list)** — renders rows (code, capturedAt, thumbnail,
  duplicate badge when count>1); edit changes a code via ScanRepo.update; delete removes a
  row; manual-add appends a scan with `source:'manual'`. Implement; PASS.
- [ ] **Step 3:** Commit `feat(web): collection list, counts, CRUD, manual add`.

### Task 6.2: Manual entry (TDD)

**Files:**
- Create: `web/src/ui/ManualEntry.tsx`, test.

- [ ] **Step 1: Failing test** — invalid code disables submit + shows error; valid code
  calls `onAdd` with normalized canonical. Implement; PASS. Commit.

---

## Milestone M7 — Export & sync (TDD)

### Task 7.1: Text export (TDD)

**Files:**
- Create: `web/src/export/text-export.ts`, test.

- [ ] **Step 1: Failing test** — `toTextExport(session, scans)` produces a header
  (userName, sessionId, exportedAt, total, counts-by-code) followed by one canonical code
  per line, sorted. Use a fixed clock injected as arg.
- [ ] **Step 2:** Implement; PASS. Commit `feat(web): text export`.

### Task 7.2: JSON export (TDD)

**Files:**
- Create: `web/src/export/json-export.ts`, test.

- [ ] **Step 1: Failing test** — `toJsonExport(session, scans, imageStore)` returns an
  object with metadata + scans + `images: {scanId: dataUrl}` pulled from the store; JSON
  round-trips.
- [ ] **Step 2:** Implement (async, awaits image-store gets); PASS. Commit
  `feat(web): json export with image data URLs`.

### Task 7.3: Sync client (TDD)

**Files:**
- Create: `web/src/storage/sync-client.ts`, test (mock `fetch`).

- [ ] **Step 1: Failing test** — `pushSession(session, scans, fetchImpl)` POSTs
  codes+metadata (NO images) to `/api/v1/sessions`; on network error resolves
  `{ok:false}` without throwing (best-effort).
- [ ] **Step 2:** Implement; assert request body contains no image fields; PASS. Commit
  `feat(web): best-effort sync client`.

---

## Milestone M1 — Rails 8 + Postgres backend (parallel track; TDD)

> Can run anytime after M0; sequenced here so the FE slice lands first per the owner's
> "camera+OCR first" preference while the backend is stood up in parallel.

### Task 1.1: Rails API scaffold + Postgres (Docker)

**Files:**
- Create: `api/` via `rails new`, `api/.ruby-version` (3.3.6),
  `docker-compose.yml` (db service), `api/config/database.yml`.

- [ ] **Step 1:** `rbenv local 3.3.6` in `api/`; `gem install rails -v '~> 8.0'`.
- [ ] **Step 2:** `rails new api --api -d postgresql -T` (skip default test; use RSpec).
- [ ] **Step 3:** Add `docker-compose.yml` with a `db` (postgres:16) service; point
  `database.yml` host to `localhost`/`db`.
- [ ] **Step 4:** Add `rspec-rails`, `simplecov`; `rails g rspec:install`; configure
  SimpleCov in `spec/spec_helper.rb`.
- [ ] **Step 5:** `docker compose up -d db && bin/rails db:create`. Commit
  `feat(api): rails 8 api scaffold with postgres + rspec`.

### Task 1.2: Session model + migration (TDD)

**Files:**
- Create: migration, `app/models/session.rb`, `spec/models/session_spec.rb`

- [ ] **Step 1: Failing spec** — Session requires `user_name`; has `uuid` primary key;
  has many scans.
- [ ] **Step 2:** Generate migration (uuid pk, user_name, timestamps); enable `pgcrypto`.
  Implement validations. `bin/rails db:migrate`. PASS. Commit.

### Task 1.3: Scan model + migration (TDD)

**Files:**
- Create: migration, `app/models/scan.rb`, `spec/models/scan_spec.rb`

- [ ] **Step 1: Failing spec** — Scan belongs_to session; requires `normalized_code`
  matching `/\A[A-Z]{3}\d{2}\z/`; `source` in `%w[ocr manual]`; no image column exists.
- [ ] **Step 2:** Migration (uuid pk, session_id fk, normalized_code, source,
  confidence:float, captured_at, timestamps). Implement; migrate; PASS. Commit.

### Task 1.4: Sessions + Scans controllers (request specs, TDD)

**Files:**
- Create: `app/controllers/api/v1/{sessions,scans}_controller.rb`,
  `config/routes.rb`, `spec/requests/api/v1/{sessions,scans}_spec.rb`

- [ ] **Step 1: Failing request specs** — `POST /api/v1/sessions` creates a session and
  nested scans (codes+metadata only); `GET` returns them; `PATCH /scans/:id` edits a code;
  `DELETE /scans/:id` removes it. Assert image fields are ignored if sent.
- [ ] **Step 2:** Implement controllers + routes (`namespace :api { namespace :v1 }`).
  PASS. Commit `feat(api): sessions + scans CRUD endpoints`.

---

## Milestone M8 — Integration, coverage, Docker, docs

### Task 8.1: Playwright e2e (mocked camera + OCR)

**Files:**
- Create: `web/playwright.config.ts`, `web/e2e/scan-flow.spec.ts`

- [ ] **Step 1: Failing e2e** — stub `getUserMedia` (canvas `captureStream`) and inject a
  Mock OCR via a test build flag/env; flow: name → scan → confirm → list shows code →
  reload persists → export downloads text. Implement hooks to allow injection. PASS.
- [ ] **Step 2:** Commit `test(web): e2e scan flow with mocked camera/OCR`.

### Task 8.2: Coverage gate

- [ ] **Step 1:** Run `npm run test:coverage`; ensure lines>90/branches>80. Add tests for
  any uncovered branches (error states, permission denied/no-camera, export edge cases).
- [ ] **Step 2:** Run Rails `bundle exec rspec` with SimpleCov; confirm coverage. Commit
  any added tests.

### Task 8.3: Docker Compose full stack + README

**Files:**
- Modify: `docker-compose.yml` (db + api + web); Create: `web/Dockerfile`,
  `api/Dockerfile`, fill `README.md`.

- [ ] **Step 1:** `api` service (Ruby 3.3 image, runs migrations + puma); `web` service
  (build Vite, serve via nginx or `vite preview`); `db` postgres with volume.
- [ ] **Step 2:** README: prerequisites (nvm use, rbenv), `docker compose up`, test
  commands per package, coverage commands.
- [ ] **Step 3:** `docker compose up --build` smoke check. Commit
  `chore: full-stack docker compose + run docs`.

---

## Self-review notes

- **Spec coverage:** sessions (1.2/5.3), scanning+confirm/correct (4.x), manual entry
  (6.2), collection CRUD+counts (6.1), persistence+reload (5.2/5.3), text+JSON export
  (7.1/7.2), sync codes-only/privacy (7.3/1.4), camera permission states (4.6),
  OCR pipeline+mask+ROI (3.1/4.x), backend CRUD (1.x), coverage gate (8.2), Docker (8.3),
  e2e (8.1). All spec requirements map to a task.
- **Orientation/rotation & contour `Localizer`** are intentionally NOT tasks (designed
  seams only, per ADR-0003); pipeline interface in 4.4 leaves room for them.
- **Type consistency:** `OcrAdapter.recognize(ImageData)→OcrResult`, `runPipeline`,
  `normalizeCode`/`validateCode`/`parseCandidates`/`rankCandidates`, repo method names
  (`create/get/list/update/delete`, `add/listBySession`) are used consistently across
  tasks.
```
