# Test matrix

A living map of what is tested and where. Update this when you add or change
tests. Run everything with `scripts/validate.sh ci` (web + api + e2e).

## Layers

| Layer | Tool | Location | Gate |
|-------|------|----------|------|
| Web unit/component | Vitest + Testing Library | `web/test/**` | line >90%, branch >80%, funcs >90%, stmts >90% (`vitest.config.ts`) |
| API request/model | RSpec + SimpleCov | `api/spec/**` | line >90%, branch >80% (`api/spec/spec_helper.rb`) |
| End-to-end (docker) | Playwright | `web/e2e-docker/**` | all specs green against the composed stack |
| End-to-end (preview) | Playwright | `web/e2e/scan-flow.spec.ts` | camera-free manual happy path on the Vite preview |

E2E selects elements only by `data-test-id` (Playwright `testIdAttribute`), never
by copy or styling classes.

## E2E matrix (`web/e2e-docker/stack.spec.ts`)

Runs against the assembled image (Rails serving the web bundle + API + admin +
Postgres on one origin) via `scripts/validate-e2e.sh`.

| # | Scenario | Surface | Asserts | Selectors |
|---|----------|---------|---------|-----------|
| E1 | Served SPA loads, open the board | Browser (SPA) | gate + name field visible; View board → leaderboard visible | `gate-title`, `session-name`, `view-board`, `leaderboard-title` |
| E2 | Synced album round-trip | API + admin (request) | `sync` ok; leaderboard owned=3; `/admin/collectors` 401 anon, lists collector with auth | n/a (HTTP) |
| E3 | Browse a collector from the board | Browser (SPA) | open the collector's read-only selection; admin backoffice link points to `/admin` | `view-board`, `open-<user>`, `admin-link` |
| E4 | Admin dashboard for an authenticated admin | Browser (Rails admin) | `/admin` renders the Backoffice dashboard with HTTP Basic auth | `admin-dashboard` |

### data-test-id registry

| id | Element |
|----|---------|
| `gate-title` | Session gate heading |
| `session-name` | Name input on the gate |
| `start-session` | Start scanning button |
| `view-board` | View board button (gate, cloud mode) |
| `leaderboard-title` | Leaderboard heading |
| `open-<userName>` | Open a collector's selection (per row) |
| `admin-link` | "Open admin backoffice" link in the read-only board view |
| `admin-dashboard` | Backoffice dashboard heading (`/admin`) |

## Coverage snapshot

| Stack | Lines | Branches |
|-------|-------|----------|
| web | ~97% | ~88% |
| api | ~98% | ~100% |

(Indicative; CI enforces the gates above.)

## Candidate scenarios (not yet automated)

- Cloud session create + manual sticker add (blocked on `data-test-id`s for the
  split prefix/number manual entry).
- Admin CRUD create/edit/delete through the rendered forms.
- Collector "delete everything" cascade from the backoffice.
- Reps counter-grid add/remove/clear (covered by web unit tests; not e2e).
