# ADR-0004: Cloud authentication

Status: proposed · Date: 2026-06-06

## Context

The app is local-first (IndexedDB) with an optional cloud backend for cross-device
sync and a leaderboard. Today the cloud API is **fully unauthenticated**: any
client can create/modify/delete any collector's sessions, scans, and album
stickers (`user_name` is just a string in the request). That is both a data
-integrity/abuse risk and the reason a collection can't safely follow a person
across devices — there's no identity.

We need accounts so a collector's session persists across devices, while keeping
local-only use friction-free and the public board readable without login.

## Decision

### Identity & storage

- Add a **`users`** table (separate from `sessions`) holding credentials:
  `id (uuid)`, `username` (unique, case-insensitive), `password_digest`,
  timestamps. Passwords hashed with **bcrypt** via `has_secure_password`.
- **1:1 user ↔ session** (per the requirement): `sessions.user_id` is a unique,
  nullable FK to `users`. Nullable so existing rows backfill gradually and
  local-origin data can exist server-side before being claimed.
- The album stays keyed by `sessions.user_name` (the collector's display name).
  A session's `user_name` is the collector identity for the board/leaderboard;
  the linked `user.username` is the login. For new cloud registrations they are
  the same value; backfill may link any username to an existing `user_name`.

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
    the acting user from the token and **ignores client-supplied `user_name` for
    authorization**: you may only modify your own session/scans/album.

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
