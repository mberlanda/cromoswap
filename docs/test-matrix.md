# Test matrix

A living map of what is tested and where. Update this when you add or change
tests. Run everything with `scripts/validate.sh ci` (web + api + e2e).

## Layers

| Layer | Tool | Location | Gate |
|-------|------|----------|------|
| Web unit/component | Vitest + Testing Library | `web/test/**` | line >90%, branch >80%, funcs >90%, stmts >90% (`vitest.config.ts`) |
| API request/model | RSpec + SimpleCov | `api/spec/**` | line >90%, branch >80% (`api/spec/spec_helper.rb`) |
| End-to-end (docker) | Playwright | `web/e2e/stack-docker.spec.ts` | all specs green against the composed stack |
| End-to-end (preview) | Playwright | `web/e2e/local-flows.spec.ts` | local-mode IndexedDB flows (manual add, navigation, stats, menu paths) on the Vite preview |
| Security | npm audit · bundler-audit · brakeman · Trivy | `validate-web/api.sh`, CI `security` job | no high/critical web advisories; no vulnerable gems; no brakeman warnings; no fixable CRITICAL Trivy findings |
| Performance | bundle-size budget | `web/scripts/check-bundle-size.mjs` | built JS gzip ≤ 150 KB (`BUNDLE_BUDGET_BYTES`) |

E2E selects elements only by `data-test-id` (Playwright `testIdAttribute`), never
by copy or styling classes.

## E2E matrix (`web/e2e/stack-docker.spec.ts`)

Runs against the assembled image (Rails serving the web bundle + API + admin +
Postgres on one origin) via `scripts/validate-e2e.sh`.

| # | Scenario | Surface | Asserts | Selectors |
|---|----------|---------|---------|-----------|
| E1 | Served SPA loads, open the board | Browser (SPA) | gate + cloud auth field visible; board tab → leaderboard visible | `gate-title`, `auth-username`, `tab-board`, `leaderboard-title` |
| E2 | Synced album round-trip | API + admin (request) | `sync` ok; leaderboard owned=3; `/admin/collectors` 401 anon, lists collector with auth | n/a (HTTP) |
| E3 | Browse a collector from the board | Browser (SPA) | open the collector's read-only selection; admin backoffice link points to `/admin` | `tab-board`, `open-<user>`, `admin-link` |
| E4 | Admin dashboard for an authenticated admin | Browser (Rails admin) | `/admin` renders the Backoffice dashboard with HTTP Basic auth | `admin-dashboard` |

## Local-mode E2E matrix (`web/e2e/local-flows.spec.ts`)

Runs against the Vite preview in **Local (IndexedDB)** mode — no backend, fake
camera — via `npm run e2e`. Fast feedback for the offline-first UI.

| # | Scenario | Asserts | Selectors |
|---|----------|---------|-----------|
| L1 | Manual add persists across reload + exports | switch to Local, create session, opt out of camera, add ARG01 → in collection; reload → resume → still there; export text contains ARG01 | `storage-local`, `session-name`, `start-session`, `enter-manually`, `manual-prefix`, `manual-number`, `manual-add`, `resume-<user>`, `export-text` |
| L2 | Navigate album / reps grid / home | album tab shows FWC group; reps tab → Grid → mode toggle visible; Home tab → gate visible | `tab-album`, `tab-reps`, `reps-view-grid`, `reps-mode`, `tab-home` |
| L3 | Stats tab seeded per-category progress | import Mauro/Luca owned lists; stats summary reflects selected player; category rows + sorting insights visible | `tab-stats`, `stats-summary`, `stats-player-select`, `stats-sort-select`, `stats-row-ARG`, `stats-top-completion` |
| L4 | Hamburger menu reaches stats and home | open menu, enter stats view, then return home from menu | `nav-menu-toggle`, `menu-stats`, `menu-home`, `session-name` |

### data-test-id registry

| id | Element |
|----|---------|
| `gate-title` | Session gate heading |
| `session-name` | Name input on the gate |
| `start-session` | Start scanning button |
| `storage-local` / `storage-cloud` | Storage-mode toggle |
| `resume-<userName>` | Resume a session (per row) |
| `allow-camera` / `enter-manually` | Camera permission panel buttons |
| `manual-prefix` / `manual-number` / `manual-add` | Manual sticker entry |
| `tab-album` / `tab-reps` / `tab-board` | Primary section tabs |
| `reps-view-scan` / `reps-view-grid` | Reps view switch |
| `reps-mode` | Reps tap-mode toggle group |
| `export-text` | Export text button |
| `tab-home` | In-session Home tab button |
| `tab-stats` | In-session Stats tab button |
| `stats-player-select` / `stats-sort-select` | Stats player and sort controls |
| `stats-row-<prefix>` | Per-category progress row (for example `stats-row-ARG`) |
| `stats-top-completion` / `stats-top-missing` | Stats quick insights (best completion / biggest gap) |
| `view-board` | View board button (gate, cloud mode) |
| `leaderboard-title` | Leaderboard heading |
| `open-<userName>` | Open a collector's selection (per row) |
| `admin-link` | "Open admin backoffice" link in the read-only board view |
| `admin-dashboard` | Backoffice dashboard heading (`/admin`) |
| `auth-tab-login` / `auth-tab-register` | Cloud auth panel tabs |
| `auth-username` / `auth-password` / `auth-submit` | Cloud register/login form |
| `auth-error` | Cloud auth error message |
| `logout` / `change-password-toggle` | Account bar (cloud, signed in) |
| `password-current` / `password-new` / `password-submit` | Change-password form |
| `save-to-cloud` | Save-local-to-cloud button (local mode) |

## Coverage snapshot

| Stack | Lines | Branches |
|-------|-------|----------|
| web | ~97% | ~88% |
| api | ~98% | ~100% |

(Indicative; CI enforces the gates above.)

## Candidate scenarios (not yet automated)

- Cloud session create + manual add on the docker stack (local-mode L1 covers
  the UI; a cloud variant would also exercise the API persistence).
- Album All/Clear and import flows end-to-end (unit-tested today).
- Admin CRUD create/edit/delete through the rendered forms.
- Collector "delete everything" cascade from the backoffice.

## Notes

- **Manual entry without a camera** is now reachable: choosing "Enter manually"
  (or a device with no camera) renders the reps view in manual mode (camera
  scanner hidden, manual entry + grid + collection available). The L1/L2 flows
  exercise this path.
