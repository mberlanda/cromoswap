# Cloud authentication — implementation plan

> Execute with superpowers:subagent-driven-development or executing-plans. Each
> numbered phase is its own atomic PR, TDD, green on all CI gates before merge.

Spec: [`../specs/2026-06-06-cloud-authentication-design.md`](../specs/2026-06-06-cloud-authentication-design.md)
ADR: [`../../adr/0004-cloud-authentication.md`](../../adr/0004-cloud-authentication.md)

## Phase 1 — Docs (#54, merged)
- [x] ADR-0004, spec, this plan; link from `docs/INDEX.md`.
- [x] `@copilot` review; address; merge.

## Phase 2 — Backend identity (#56, merged)
- [x] Add `bcrypt` gem.
- [x] Migration: `users` (uuid, `username`, `password_digest`) with a **unique
      index on `lower(username)`** (case-insensitive uniqueness without `citext`)
      + `sessions.user_id` (uuid, null, unique, fk).
- [x] `User` model: `has_secure_password`, `has_one :session`,
      `before_validation { username&.downcase! }`, username presence +
      **format `/\A[a-z0-9]+\z/` length 3..30** + case-insensitive uniqueness;
      password min length 8; `Session belongs_to :user, optional`.
- [x] Model specs (validations incl. format/length/normalization, digest,
      association). No API/route change.

## Phase 3 — Auth endpoints + JWT (#57, merged)
- [x] Add `jwt` gem; `JsonWebToken` encode/decode helper (HS256, exp 30d).
- [x] `Authenticated` controller concern: parse Bearer, set `current_user`,
      401 on missing/invalid.
- [x] `Api::V1::AuthController`: `register`, `login`, `me`, `password`.
      register creates user + session (`user_name = username`).
- [x] Routes for `/auth/*`. Request specs (happy/duplicate/bad-creds/expired).

## Phase 4 — Authorize writes (this PR)
- [x] Apply `Authenticated` to `sessions`/`scans`/`album_stickers` write actions.
- [x] Resolve the session from the token and **scope all lookups** through it:
      `current_user.session.scans.find(...)`, reject mismatched `sessionId`/
      session `id`, ignore client `user_name`. Foreign ids → 403/404.
- [x] Keep `leaderboard` + `album_stickers#index` open.
- [x] Request specs for: token required, cross-user 403/404 (incl. foreign
      `sessionId` and scan `id`), own-data 200, reads open.
- [x] Update `SECURITY.md` (writes now authenticated).

## Phase 5 — Web auth (#59 data layer, #60 UI; merged)
- [x] `auth` module: token store (localStorage), decode, current user.
- [x] Inject a token provider into the cloud repos; send Bearer on writes.
- [x] Cloud session gate: Register / Log in (username + password) when no token;
      board browsing stays logged-out-friendly.
- [x] Password-change form. Unit tests + `data-test-id`s.

## Phase 6 — Save local → cloud (this PR)
- [x] "Save to cloud" action from a local session: register/login + upload album
      (`sync`) + scans. `CloudSaver` + `SaveToCloud` UI; unit tests.

## Phase 7 — Backoffice user management
- [ ] `Admin::UsersController` CRUD + set/reset password + connect user↔collector
      (link `sessions.user_id` by `user_name`, enforce 1:1). Request specs.

## Phase 8 — UX polish + mockups
- [ ] Refresh the session-gate mockups (`design-system/`), update `docs/ux/`
      flows and `docs/test-matrix.md` data-test-id registry.

## Risks / watch-outs
- Don't break local mode (no auth path).
- Cross-user authorization must be enforced server-side (never trust client
  `user_name`).
- Migrating `user_id` as nullable avoids a breaking change; backfill via Phase 7.
- Keep public read endpoints open (leaderboard, album read) — verify in specs.
