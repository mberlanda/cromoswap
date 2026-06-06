# Documentation index

A hypertext map of the repo's docs. Legend: ✅ implemented · 🟡 partial/active ·
💡 proposed/future · 📖 reference.

## Start here

- [README](../README.md) — what the app is, repo layout, how to run it 📖
- [SECURITY.md](../SECURITY.md) — security posture, operator checklist, accepted risks ✅
- [docs/test-matrix.md](test-matrix.md) — the unit / api / e2e / security / perf test map ✅

## Product & UX

- [specs/00-product-spec.md](specs/00-product-spec.md) — MVP product spec ✅ (MVP delivered)
- [ux/README.md](ux/README.md) — UX package overview 📖 (draft)
  - [ux/00-product-overview-and-journeys.md](ux/00-product-overview-and-journeys.md)
  - [ux/01-flows-and-user-stories.md](ux/01-flows-and-user-stories.md)
  - [ux/02-design-system.md](ux/02-design-system.md)
  - [ux/03-mockups.md](ux/03-mockups.md)
  - [ux/04-ux-backlog.md](ux/04-ux-backlog.md)
- [design-system/README.md](../design-system/README.md) — static design-system + JPEG/SVG mockups 📖

## Architecture (ADRs)

- [adr/0001-application-stack.md](adr/0001-application-stack.md) — React+TS+Vite / Rails 8 + Postgres / monorepo ✅
- [adr/0002-storage-and-export-format.md](adr/0002-storage-and-export-format.md) — local-first IndexedDB + repos + text/JSON export ✅ (extended: Local/Cloud + import)
- [adr/0003-ocr-pipeline.md](adr/0003-ocr-pipeline.md) — injectable OCR pipeline (tesseract.js + mock) ✅

## Implemented feature designs (`superpowers/`)

Design specs for features that are now in the product — kept as history, marked
implemented so they read as records, not TODOs.

- [specs/…/album-tracker-design.md](superpowers/specs/2026-06-04-album-tracker-design.md) — My Album / My Reps tabs ✅
- [plans/…/album-tracker.md](superpowers/plans/2026-06-04-album-tracker.md) — its task plan ✅
- [specs/…/centered-sticker-frame-design.md](superpowers/specs/2026-06-05-centered-sticker-frame-design.md) — centered aspect-ratio frame + live targeting ✅ (#29)
- [specs/…/cx-album-reps-import-design.md](superpowers/specs/2026-06-05-cx-album-reps-import-design.md) — album All/Clear, reps counter grid, import, nav ✅ (#33)
- [specs/…/admin-backoffice-and-board-from-gate-design.md](superpowers/specs/2026-06-05-admin-backoffice-and-board-from-gate-design.md) — Rails `/admin` backoffice + board-from-home ✅ (#34, hardened #47)

## OCR

- [ocr-findings.md](ocr-findings.md) — empirical accuracy notes on the code pill 📖
- [ocr-scanning-geometry.md](ocr-scanning-geometry.md) — frame/crop ROI geometry ✅
- [plans/01-tesseract-fine-tuning.md](plans/01-tesseract-fine-tuning.md) — font-tuned LSTM model 💡 (proposed)

## Plans

- [plans/00-implementation-plan.md](plans/00-implementation-plan.md) — original MVP build plan ✅ (delivered; superseded by the shipped app)

## Testing & operations

- [test-matrix.md](test-matrix.md) — layers, E2E matrices, `data-test-id` registry, gates ✅
- Validation scripts: `scripts/validate.sh [web|api|e2e|all|ci]` (+ `validate-web/api/e2e.sh`)
- CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — validate · e2e-preview · docker-e2e · Trivy

## Component READMEs

- [web/README.md](../web/README.md) — frontend (camera, OCR, IndexedDB, UI)
- [api/README.md](../api/README.md) — Rails API + admin backoffice
- [web/fixtures/stickers/README.md](../web/fixtures/stickers/README.md) — OCR test fixtures

## Consolidation candidates (follow-up)

Doc overlap worth merging later:

- **Design system is documented twice** — [`design-system/`](../design-system/README.md)
  (static viewer + mockups) and [`ux/02-design-system.md`](ux/02-design-system.md) /
  [`ux/03-mockups.md`](ux/03-mockups.md) cover overlapping ground. Pick one home.
- **Product framing appears in three places** — [`specs/00-product-spec.md`](specs/00-product-spec.md),
  [`ux/00-product-overview-and-journeys.md`](ux/00-product-overview-and-journeys.md), and the
  README intro. The spec should be the source of truth; the others should link to it.

Code-level duplication: the album/reps grid scaffold is now consolidated into
`AlbumGroupedGrid` (used by both `AlbumView` and `RepsGrid`), and the duplicated
test helpers into `web/test/helpers.ts`. Remaining candidates: the Rails admin
CRUD controllers/views share near-identical structure (index/new/edit/show could
use a shared partial/concern).
