# WC 2026 Sticker Scanner

A mobile-first web app for scanning the backs of duplicate Panini World Cup 2026
stickers, confirming/correcting the detected code, and building an editable, exportable
collection. Local-first (IndexedDB), with an optional Rails 8 + Postgres backend for
future sharing/matchmaking.

See [`docs/specs/00-product-spec.md`](docs/specs/00-product-spec.md) and the ADRs in
[`docs/adr/`](docs/adr/) for design and rationale. The live scanner's framing and OCR-crop
geometry is documented in
[`docs/ocr-scanning-geometry.md`](docs/ocr-scanning-geometry.md).

## Repository layout

```
web/                React + TypeScript + Vite frontend (camera, OCR, IndexedDB, UI)
api/                Rails 8 + Postgres CRUD API (sessions, scans; codes + metadata only)
tools/asset-gen/    Build-time TS tool: corpus -> mask/OCR assets
assets/             Generated mask-config.json, ocr-profile.json, prefixes.json
docs/               Specs, ADRs, implementation plan
Dockerfile          Single image: builds web, served as static assets by Rails
docker-compose.yml  db + app (web bundle + API on one origin)
```

## Prerequisites

- Node 22 (`nvm use` — see `.nvmrc`)
- Ruby 3.3.6 (`rbenv` — see `api/.ruby-version`)
- Docker (for Postgres, and for full-stack serving)

## Frontend (`web/`)

```bash
cd web
nvm use
npm install
npm run dev            # http://localhost:5173
npm run test:run       # unit + component tests (Vitest)
npm run test:coverage  # enforces lines>90 / branches>80
npm run build          # production build
```

Camera requires HTTPS or `localhost`. Without a camera the app still works via manual
entry. Sync to the API is best-effort: in the bundled production build it posts to the
same origin automatically; in dev it is off unless you set `VITE_API_BASE_URL` (e.g.
`VITE_API_BASE_URL=http://localhost:3000 npm run dev`).

For a **split deployment** (web and API on different origins), the API must allow the
web origin via CORS — see `CORS_ORIGINS` under the backend section. The same-origin
Docker image needs no CORS.

## Backend (`api/`)

```bash
# Start Postgres
docker compose up -d db

cd api
rbenv local 3.3.6      # if not already
# macOS: point the pg gem at Homebrew libpq before bundling
bundle config set --local build.pg "--with-pg-config=/opt/homebrew/opt/libpq/bin/pg_config"
bundle install
bin/rails db:prepare
bundle exec rspec      # request + model specs, SimpleCov >= 90% lines
bundle exec rails server  # http://localhost:3000
```

The database connection is configured from env (`DATABASE_HOST/PORT/USER/PASSWORD/NAME`)
with defaults matching `docker-compose.yml`.

**CORS:** for cross-origin sync, set `CORS_ORIGINS` to a comma-separated list of allowed
web origins (defaults to `http://localhost:5173,http://localhost:4173` for Vite dev/preview).
Then run the web app with a matching `VITE_API_BASE_URL`, e.g.:

```bash
# API
CORS_ORIGINS=http://localhost:5173 bundle exec rails server
# Web (separate terminal)
VITE_API_BASE_URL=http://localhost:3000 npm run dev
```

## Asset generation (`tools/asset-gen/`)

```bash
cd tools/asset-gen
nvm use
npm install
npm run test:run
npm run generate       # writes assets/ and web/src/assets/ from the corpus
```

## Full stack with Docker Compose

A single image builds the web bundle and serves it as static assets from Rails, so the
front end and API share one origin (no CORS needed; sync works out of the box).

```bash
docker compose up --build
# app (web + API) -> http://localhost:3000
# db              -> localhost:5432
```

Verified: `GET /` serves the SPA, `/assets/*` static files load, and
`POST /api/v1/sessions` + `GET /api/v1/sessions/:id` round-trip on the same origin.

## Testing & coverage targets

- Web: Vitest (`web/`) — lines > 90%, branches > 80% (enforced in `vitest.config.ts`).
- API: RSpec + SimpleCov (`api/`) — line coverage >= 90% (enforced in `spec/spec_helper.rb`).

## Sticker codes

Canonical form `<PREFIX><NN>` (e.g. `ARG01`, `USA13`, `FWC07`): a known 3-letter prefix
plus a number 01–20. Tolerant input (`ARG 1`, `arg-01`) is normalized; the prefix is
validated against `assets/prefixes.json` (49 prefixes).
