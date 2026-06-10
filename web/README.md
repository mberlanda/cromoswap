# Web Frontend

React + TypeScript + Vite application for scanning and managing WC 2026 sticker
collections.

## What lives here

- Camera-based OCR flow with confirm/correct loop.
- Local-first session + scan persistence (IndexedDB).
- Album and reps management views.
- Stats and leaderboard UI.
- Optional cloud auth/sync integration.

## Commands

From this folder:

```bash
nvm use
npm install
npm run dev
npm run test:run
npm run test:coverage
npm run lint
npm run build
npm run e2e
npm run e2e:docker
```

## E2E modes

- `npm run e2e`: local-mode Playwright suite against Vite preview.
- `npm run e2e:docker`: docker/full-stack Playwright suite against the composed
  app (Rails serving SPA + API).

## Important test-id convention

- Playwright uses `data-test-id` (`testIdAttribute` configured in Playwright).
- Testing Library defaults to `data-testid`.

When adding selectors for shared coverage, prefer adding both attributes where
needed.

## Related docs

- Root docs index: `../docs/INDEX.md`
- Test matrix: `../docs/test-matrix.md`
- OCR geometry: `../docs/ocr-scanning-geometry.md`
