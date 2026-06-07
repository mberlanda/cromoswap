# ADR-0004: Cloud authentication

Status: proposed · Date: 2026-06-06

## Context

The app is local-first (IndexedDB) with an optional cloud backend for a shared
leaderboard. Today a collection lives in the local session that created it: you
can edit it from that device, but you cannot resume it from another device. The
cloud API is also **fully unauthenticated** — any client can create/modify/delete
any collector's sessions, scans, and album stickers (`user_name` is just a free
string with no uniqueness or format constraint). That is both a data-integrity/
abuse risk and the reason a collection can't follow a person across devices:
there's no identity.

We need accounts so a collector can resume their collection on another device by
logging in, while keeping local-only use friction-free and the public board
readable without login.

## Decision

### Identity & storage

- Add a **`users`** table (separate from `sessions`) holding credentials:
  `id (uuid)`, `username` (unique; format `^[a-z0-9]+$`, length 3–30),
  `password_digest`, timestamps. Passwords hashed with **bcrypt** via
  `has_secure_password` (min length 8). Case-insensitive uniqueness is enforced
  at the DB layer with a unique index on `lower(username)` (Postgres `text` is
  case-sensitive by default; we avoid enabling `citext`). The model normalizes
  `username` to lowercase before save, so the index and validation agree.
- **1:1 user ↔ session for now** (per the original requirement): `sessions.user_id`
  is a unique, nullable FK to `users`. Nullable so existing rows backfill
  gradually and local-origin data can exist server-side before being claimed. The
  unique constraint is what enforces 1:1; relaxing it is the documented path to
  multiple sessions per user (see *Future evolution*).
- The album stays keyed by `sessions.user_name` (the collector's display name).
  `user.username` is the **login** (constrained, `^[a-z0-9]+$`); `session.user_name`
  is the **display name** shown on the board/leaderboard (free-form). They are
  distinct concerns: for a new cloud registration the display name defaults to the
  username, but they need not match, and backfill may link any username to an
  existing free-form `user_name`.

### Future evolution (out of scope for the initial implementation)

These are recorded now because they shape the schema, but are deliberately not
built in the first pass (kept simple per the original 1:1 requirement):

- **Rename `sessions.user_name` → `sessions.display_name`** to make the
  login-vs-display-name distinction explicit in the schema. A follow-up migration.
- **Multiple sessions per user**: one credential owning several collections — e.g.
  a parent's login with one session per child's album. Reached by dropping the
  unique constraint on `sessions.user_id` and adding session selection to the UI.
- **Soft-delete sessions**: users can soft-delete a session; the backoffice can
  permanently purge it after review (add `sessions.deleted_at`, scope queries to
  non-deleted, admin hard-delete).

### Authentication mechanism

- **JWT** (HS256, signed with `secret_key_base`/a dedicated secret) via the
  `jwt` gem. Login/register returns a token carrying `user_id` (+ `exp`, 30 days).
  No refresh tokens — re-login on expiry (keep it simple).
- Endpoints:
  - **Public (no token):** `POST /auth/register`, `POST /auth/login`,
    `GET /leaderboard`, `GET /album_stickers` (read-only album view used by the
    board). These stay open.
  - **Authenticated (Bearer JWT):** everything that writes — `sessions`,
    `scans`, `album_stickers#toggle`/`sync`, `auth/password`. The server derives
    the acting user from the token and **scopes every record lookup to that
    user's session** — not just `user_name`, but all ID-based access:
    `sessionId` on `POST /scans`, the session `id` on session writes, and
    `Scan.find` on scan update/destroy. A mismatched or foreign ID is 403/404,
    never honored. Client-supplied `user_name` is ignored for authorization.

### Modes

- **Local mode:** unchanged — no API, no auth.
- **Cloud mode:** requires login/registration before any write. The leaderboard
  and read-only album browsing work without login.
- **Save local → cloud:** a flow that registers (or logs in) a user and uploads
  the local album + scans into that user's cloud session.

### Backoffice (admin)

The Rails `/admin` backoffice gains user management: create a user, set/reset a
password, and **connect a user to an existing collector** (link `user_id` on the
session with that `user_name`) — to backfill today's collectors.

## Alternatives considered

- **Rails `MessageVerifier` signed tokens** instead of the `jwt` gem — no
  dependency, but the requirement explicitly says JWT and JWT is more portable
  for future clients. Chosen: `jwt`.
- **Server as source of truth / accounts required everywhere** — rejected;
  breaks the local-first, offline, no-login-to-browse properties.
- **Credentials on the `sessions` row** — rejected in favor of a separate
  `users` table (cleaner, lets identity outlive a single session later).

## Consequences

- Closes the open-write-API security gap (see `SECURITY.md`): writes now require
  a token scoped to the user. The public read endpoints remain open by design.
- Adds `bcrypt` + `jwt` gems and a `users` table; the API gains an auth layer and
  per-request user scoping.
- 1:1 user↔session is a deliberate simplification; multi-session-per-user is a
  future change if ever needed.
- Existing collectors keep working read-only until connected to a user in the
  backoffice (or until they register and claim their name).
