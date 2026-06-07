# Cloud authentication

Date: 2026-06-06
Status: proposed (docs PR; implementation follows in incremental PRs)
ADR: [`docs/adr/0004-cloud-authentication.md`](../../adr/0004-cloud-authentication.md)

## Goal

Give cloud collectors an account so a collection follows them across devices,
without adding friction to local-only use and without locking down the public
board. Registration with a unique username + password; users can change their
password; admins can backfill/connect existing collectors.

## Non-goals

- Multi-session per user (kept 1:1 for now — see *Future evolution*).
- Renaming `sessions.user_name` → `display_name` (follow-up; see below).
- Soft-delete / admin purge of sessions (see *Future evolution*).
- Refresh tokens / OAuth / email verification / password reset by email.
- Authenticating the public read endpoints (leaderboard, read-only album).

### Future evolution

Recorded so the initial schema doesn't paint us into a corner; not built now:

- **Rename `sessions.user_name` → `sessions.display_name`** — make the
  login-vs-display distinction explicit in the schema (follow-up migration; the
  album key moves with it).
- **Multiple sessions per user** — drop the unique constraint on
  `sessions.user_id` and add session selection in the UI, so one login (e.g. a
  parent) can own several collections (one per child).
- **Soft-delete sessions** — `sessions.deleted_at`; users soft-delete, the
  backoffice permanently purges after review. Queries scope to non-deleted.

## Data model

```
users
  id              uuid pk
  username        string, unique, not null   # login; format ^[a-z0-9]+$, length 3..30
  password_digest string, not null           # bcrypt (has_secure_password)
  created_at, updated_at
  # unique index on lower(username) for case-insensitive uniqueness

sessions  (existing; add)
  user_id         uuid, null, unique, fk -> users(id)   # 1:1 (unique constraint)
  user_name       string, not null          # display name + album key (unchanged)
```

- `album_stickers` is unchanged (keyed by `user_name`).
- `user_id` nullable so existing sessions backfill gradually and local-origin
  data can land before being claimed; the `unique` constraint enforces 1:1.
- **Case-insensitive uniqueness**: Postgres `text` is case-sensitive by default
  and `citext` isn't enabled in `api/db/schema.rb`. Enforce with a unique index
  on `lower(username)` plus model-side normalization (downcase before validate),
  so DB and app agree. (We prefer the functional index over enabling `citext`.)
- `username` (login) and `session.user_name` (display name) are **distinct**: a
  new cloud registration defaults the display name to the username, but they need
  not match. New cloud registration creates a `user` and a `session`.

### Validation

- **username**: lowercase alphanumeric only — `^[a-z0-9]+$`, length **3–30**.
  No uppercase, spaces, or symbols. Enforced in the `User` model, the
  `/auth/register` endpoint, and the web form (the input lowercases + filters as
  you type). Uniqueness is over this normalized value (so case is moot).
- **password**: minimum **8** characters (model + endpoint + form).
- The collector display `user_name` stays free-form; for a **new** registration
  it equals the (constrained) username, while **backfill** can link any
  constrained username to an existing free-form `user_name`.

## API

All under `/api/v1`. JSON. JWT is `Authorization: Bearer <token>` (HS256, claim
`{ user_id, exp }`, 30-day expiry).

### Public (no token)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/register` | `{ username, password }` → creates user + session (`user_name = username`), returns `{ token, user, session }`. 422 on duplicate username / weak input. |
| POST | `/auth/login` | `{ username, password }` → `{ token, user, session }`; 401 on bad creds. |
| GET | `/leaderboard` | unchanged, open. |
| GET | `/album_stickers?user_name=` | unchanged, open (read-only board view). |

### Authenticated (Bearer JWT; acting user from token)

| Method | Path | Notes |
|--------|------|-------|
| POST/PATCH | `/auth/password` | change own password (`{ currentPassword, newPassword }`). |
| GET | `/auth/me` | current user + session. |
| sessions / scans / `album_stickers#toggle` / `album_stickers#sync` | as today, but **scoped to the token's user**. The server resolves the session from the token; see *Authorization scoping* below. |

#### Authorization scoping

The token's user is the only authority. Beyond ignoring client-supplied
`user_name`, **every record lookup is scoped to `current_user.session`** — IDs
in the request are not trusted on their own:

- `POST /scans` — `sessionId` must equal the token user's session; otherwise 403.
- `POST /sessions` / session writes — bind to the token user's session, not a
  client-passed `id`.
- `PATCH`/`DELETE /scans/:id` — `current_user.session.scans.find(params[:id])`
  (scoped finder), so a foreign scan id is 404, never updated/destroyed.

This closes the full open-write gap, not just the `user_name` part of it.

- A new `Authenticated` controller concern parses+verifies the JWT, loads the
  `current_user` and its `session`, and 401s on missing/invalid token.
- `BaseController` (JSON API) stays; auth is a mixin applied to the write
  controllers only.

### Save local → cloud

Client-driven, no special endpoint beyond the above:
1. `POST /auth/register` (or `/auth/login`) → token + cloud session.
2. With the token: `POST /album_stickers/sync` (owned codes) and `POST /scans`
   for the local scans. Idempotent enough to retry.

## Client (web)

- **Token store**: `localStorage` (`cromoswap-token`), so the session persists
  across reloads and browser restarts **on the same device**. `localStorage` does
  not sync across devices — cross-device continuity comes from logging in with the
  username + password on the new device, which mints a fresh token there. A small
  `auth` module: `getToken/setToken/clearToken`, `decodeUser`.
- **Authed fetch**: the cloud repos (`ApiSessionRepo`/`ApiScanRepo`/
  `ApiAlbumRepo`) take a token provider and send `Authorization` on writes.
- **Cloud gate**: in cloud mode, if there's no valid token, the session gate
  shows **Register / Log in** (username + password) instead of the plain name
  field. Browsing the board stays available without login.
- **Password change**: a small form (in settings/header) calling `/auth/password`.
- **Save to cloud**: from a local session, a "Save to cloud" action prompts for
  register/login and uploads the local album + scans (the flow above).
- **Local mode**: unchanged; no auth UI.

## Backoffice (admin)

Add to the Rails `/admin` panel:
- **Users** CRUD (index/new/create/show + delete) — create a user, see linked
  session.
- **Set/reset password** for a user.
- **Connect user ↔ collector**: link a `user` to an existing `session`
  (by `user_name`) — sets `sessions.user_id`. Enforces the 1:1 (a session and a
  user can each be linked once).

## Security

- Passwords: bcrypt via `has_secure_password`; never logged or returned.
- JWT signed with a dedicated secret (env/credentials), HS256, `exp` enforced.
- Write endpoints authorize by token → closes the open-write-API gap noted in
  `SECURITY.md`; public read endpoints stay open by design.
- Rate limiting on `/auth/*` is a future hardening (note, not in scope).

## Testing

- **API (RSpec):** register (happy + duplicate + weak), login (happy + bad
  creds), password change, JWT required/rejected on write endpoints, user
  scoping (can't touch another user's session/scans/album → 403), leaderboard +
  album read stay open, backoffice user CRUD + connect + reset.
- **Web (vitest):** auth module (token store/decode), authed repo sends bearer,
  cloud gate shows register/login without a token, password-change form,
  save-to-cloud uploads album+scans.
- **E2E:** register in cloud mode → add → reload → still signed in; board still
  browsable logged-out. (Docker stack; data-test-id selectors.)
- Coverage gates unchanged (line >90 / branch >80).

## UX / mockups

The cloud session gate changes (register/login vs name), plus a password-change
and a save-to-cloud affordance. Revisit the relevant `design-system/` mockups
and `docs/ux/` flows; update `docs/test-matrix.md` data-test-id registry.

## Incremental delivery (atomic PRs)

1. **Docs** (this PR): ADR + spec + plan; `@copilot` review.
2. **Backend identity**: `users` table + bcrypt + `User` model + `sessions.user_id`
   (nullable/unique), specs. No behavior change yet.
3. **Auth endpoints**: `/auth/register|login|me|password` + JWT lib + concern;
   specs. Public endpoints unchanged.
4. **Authorize writes**: require JWT + user scoping on sessions/scans/album
   writes (403 cross-user); leaderboard/album-read stay open; specs.
5. **Web auth**: token store + authed repos + cloud register/login gate +
   password change; tests.
6. **Save local → cloud**: the upload flow; tests + e2e.
7. **Backoffice user mgmt**: users CRUD + reset + connect; request specs.
8. **UX polish + mockups**: refresh gate mockups, docs/ux, test-matrix.

Each step is its own PR, kept atomic and green on CI.
