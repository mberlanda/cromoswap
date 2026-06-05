# Admin backoffice + board-from-home

Date: 2026-06-05
Branch: `feat/admin-backoffice`
Status: approved design

## Summary

Two connected additions:

1. **Rails `/admin` backoffice** — a server-rendered, HTTP-Basic-auth-protected
   admin panel with full CRUD over every entity (sessions, scans, album
   stickers), a per-collector cleanup action, and a "dump all data" export in
   both JSON and SQL (`pg_dump`). This is the single admin surface.
2. **Board from the home screen** — a "View board" link on the session gate
   (cloud mode) that opens the existing leaderboard + read-only collector
   selection without first starting a session; that collector view links out to
   the `/admin` backoffice.

The backoffice is where all editing/deleting lives. The React app gains no
in-app editing of other collectors — it only links to the backoffice, so admin
logic has one home.

## Background

- The Rails API is **API-only** (`config.api_only = true`): the Flash, Cookies,
  and Session middleware are not loaded. `SpaController` already inherits
  `ActionController::Base` and serves the bundled SPA, so non-API controllers
  work; but scaffolded views that use `flash` and CSRF-protected forms need that
  middleware added back.
- Models: `Session has_many :scans, dependent: :destroy`; `AlbumSticker` is keyed
  by `user_name` (no association to Session). So deleting a collector means
  destroying their `Session`s (scans cascade) **and** their `AlbumSticker`s by
  `user_name`.
- The public JSON API (`sessions#create`, `scans` CRUD, `album_stickers#toggle`
  / `sync`, `leaderboard`) is **unauthenticated** and the SPA depends on that.
- The board today lives only inside a session: `Board` tab → `LeaderboardView`
  → "Open X selection" → read-only `AlbumView` (state `boardSelectionUserName`
  in `App`). `App` returns `SessionGate` whenever there is no active session, so
  the board is currently unreachable pre-session.
- The one-image root `Dockerfile` installs `libpq-dev` but **not**
  `postgresql-client`, so `pg_dump` is absent from the runtime image.

## Feature A — Rails `/admin` backoffice

### Authentication

- `Admin::BaseController < ActionController::Base`.
- `http_basic_authenticate_with` driven by env, with local-friendly defaults:
  - `ADMIN_EMAIL` (default `admin@cromoswap.local`)
  - `ADMIN_PASSWORD` (default `!cromoswap!`)
- Credentials read once at boot into constants on the base controller. A failed
  auth returns the standard 401 Basic challenge (the browser's password prompt —
  this is the "password to unblock" from the original ask).

### Middleware (re-enable for views)

In `application.rb`, after `config.api_only = true`, add back the middleware the
admin views need (these do not affect JSON API controllers, which don't read
them):

```ruby
config.middleware.use ActionDispatch::Cookies
config.middleware.use ActionDispatch::Session::CookieStore
config.middleware.use ActionDispatch::Flash
```

Admin controllers enable `protect_from_forgery with: :exception` (now that
session/cookies exist). API controllers are unaffected (`ActionController::API`
has no CSRF).

### Resources (full CRUD)

Under `namespace :admin`, scaffold-style controllers + ERB views + one shared
layout (`app/views/layouts/admin.html.erb`, plain CSS, no asset pipeline):

- `Admin::SessionsController` — index / show / new / create / edit / update /
  destroy (destroy cascades scans).
- `Admin::ScansController` — index / show / new / create / edit / update /
  destroy.
- `Admin::AlbumStickersController` — index / show / new / create / edit /
  update / destroy.

Index pages are simple tables with edit/delete links; show pages list fields;
new/edit are standard `form_with` forms. Strong params per model.

### Collectors page + cleanup

- `Admin::CollectorsController#index` — lists distinct `user_name`s with counts
  (owned stickers, sessions, scans) by aggregating `AlbumSticker` and `Session`.
- `#destroy` (`DELETE /admin/collectors/:user_name`) — in one transaction:
  destroy all `Session`s for that `user_name` (scans cascade) and
  `delete_all` their `AlbumSticker`s. This is the "delete the collection
  altogether" / "clean up test resources" action, with a confirm prompt.

### Data export ("dump database")

`Admin::ExportsController`:

- `#json` (`GET /admin/export.json`) — streams a downloadable JSON document:
  `{ sessions: [...with scans...], albumStickers: [...], exportedAt }`. Built
  from ActiveRecord, works in any environment.
- `#sql` (`GET /admin/export.sql`) — shells out to `pg_dump` against the app's
  database config and streams the `.sql` as an attachment. Requires
  `postgresql-client` in the runtime image (see Docker change). If `pg_dump` is
  unavailable, respond 503 with a clear message rather than 500.
- An `Admin::DashboardController#index` (the `/admin` root) links to the
  resource indexes, the collectors page, and both export downloads.

### Docker

Add `postgresql-client` to the runtime `apt-get install` in the root one-image
`Dockerfile` so `pg_dump` exists for the SQL export.

### Routing

```ruby
namespace :admin do
  root "dashboard#index"
  resources :sessions
  resources :scans
  resources :album_stickers
  resources :collectors, only: %i[index destroy], param: :user_name
  get "export", to: "exports#json", defaults: { format: :json }
  get "export.sql", to: "exports#sql"
end
```

Mounted before the SPA catch-all so `/admin*` is handled by Rails, not the SPA
fallback. The SPA catch-all constraint already excludes `/api/`; extend it to
also exclude `/admin`.

## Feature B — React board from the home screen

### Board pre-session

- `App` currently early-returns `SessionGate` when `!active`. Add a
  `homeView: 'gate' | 'board'` state. When `homeView === 'board'` and there's no
  active session, render the board UI (the existing `LeaderboardView` +
  `boardSelectionUserName` read-only `AlbumView` block, extracted into a small
  `BoardPanel` component reused by both the in-session tab and the gate) with a
  "Back" control returning to the gate.
- `SessionGate` gains an `onOpenBoard?` prop; it renders a **"View board"**
  button only when board browsing is available (i.e. `fetchLeaderboard` is wired,
  cloud mode). Clicking it sets `homeView = 'board'` and loads the leaderboard.

### Backoffice link

- The board's collector read-only view (`BoardPanel`, used both in-session and
  from the gate) shows an **"Open admin backoffice"** link to `/admin`
  (`target="_blank"`). No in-React editing/deleting. The link is always present
  in the collector view; clicking through hits the backoffice's Basic-auth
  prompt.

### Extraction

Pull the board rendering currently inline in `App` (the `tab === 'board'` block)
into `BoardPanel` so it is rendered identically from the in-session tab and the
gate. `App` keeps the leaderboard fetch + `boardSelectionUserName` state and
passes them down.

## Security model

- The backoffice and its destructive/export actions are gated by HTTP Basic auth
  (env credentials). This is the protected management surface.
- The **public JSON API stays unauthenticated**, exactly as today — the SPA uses
  it without credentials and locking it down would break normal use. The Basic
  auth on `/admin` is therefore a usability/cleanup guard, not a guarantee that
  data can't be changed by other means. This is an accepted, documented limit.
- `pg_dump` output may contain all collector data; it is only reachable behind
  Basic auth.

## Testing

Backend (RSpec request specs):
- Auth: every `/admin` route returns 401 without credentials and 200/302 with
  them.
- CRUD: index renders; create/update persist; destroy removes (session destroy
  cascades scans).
- Collectors: `#destroy` removes that user's sessions, scans, and album stickers
  and leaves other users intact.
- Export: `#json` returns the expected shape with sessions+scans+albumStickers;
  `#sql` returns a `.sql` attachment when `pg_dump` is stubbed/available and 503
  when the binary is missing.

Frontend (vitest):
- `SessionGate` shows "View board" only when `onOpenBoard` is provided; clicking
  calls it.
- `App` renders the board from the gate (leaderboard + open a collector) and the
  "Back" control returns to the gate.
- `BoardPanel` collector view renders an "Open admin backoffice" link to
  `/admin`.

## Out of scope

- Authenticating the existing public JSON API.
- Token/JWT auth or a login form (HTTP Basic is sufficient and conventional).
- Importing the SQL/JSON dump back through the admin UI (export only).
- Any change to the OCR/scan/album feature behavior.

## Implementation order

1. **Backend backoffice** (independent): middleware, `Admin::BaseController`
   auth, resource controllers + views + layout, collectors, exports, routes,
   Dockerfile `postgresql-client`, RSpec specs.
2. **Frontend board-from-gate** (independent): extract `BoardPanel`, gate "View
   board" button, backoffice link, tests.

The two phases are independent and could ship as separate PRs; they share only
the conceptual "admin/board" theme.
