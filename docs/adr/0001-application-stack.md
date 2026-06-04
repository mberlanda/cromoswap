# ADR-0001: Application stack

Status: accepted · Date: 2026-06-04

## Context

We are building a mobile-first web app to scan Panini WC 2026 sticker codes with a
confirm/correct workflow, local-first persistence, and a clear path to a future
sharing/matchmaking feature. The kickoff defaults to a TypeScript stack and allows a
backend only when it serves a concrete requirement or the matchmaking iteration, with
Rails 8 permitted if justified.

The owner wants: CRUD for free, a very structured framework for clean future extensions,
and TypeScript available for generating OCR assets from a sticker corpus.

## Decision

- **Frontend:** React + TypeScript + Vite. Mobile-first, portrait default. Camera via the
  browser MediaDevices API; OCR via Tesseract.js behind an adapter.
- **Backend:** Rails 8 + Postgres. Chosen over a TS API for maximal CRUD-for-free
  (scaffolds, Active Record, conventions) and velocity toward matchmaking. Built early /
  in parallel with the frontend.
- **Asset generation:** a build-time TypeScript tool (`/tools/asset-gen`) that converts an
  annotated corpus into versioned static assets.
- **Monorepo** with `/web`, `/api`, `/tools/asset-gen`, `/assets`, `/docs`, and a
  top-level `docker-compose.yml` serving Postgres + API + web.
- **Privacy split:** images stay on-device (IndexedDB); only codes + metadata sync to the
  API.

## Alternatives considered

- **AdonisJS (TS) + Postgres** — Rails-like conventions in one language end-to-end.
  Rejected: owner explicitly preferred Rails; smaller ecosystem.
- **NestJS + Prisma + Postgres** — very structured, strong typing. Rejected: more
  boilerplate, less CRUD-for-free than Rails.
- **No backend (local-first only)** — simplest path and satisfies every MVP acceptance
  criterion. Rejected as the target because the owner wants a structured backend in place
  now for future extensions; local-first remains the runtime source of truth in the MVP.

## Consequences

- Two languages (Ruby backend, TS frontend + asset tool). Accepted for Rails velocity.
- Local-first is the source of truth in the MVP; the API is best-effort sync, so the app
  works offline and the backend is ready for sharing/matchmaking.
- Two test toolchains: Vitest/Testing Library/Playwright (web) and RSpec/Minitest (Rails).
