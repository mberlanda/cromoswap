# Security posture

This is a local-first hobby app (Panini sticker scanner) with an optional Rails
backend. This document records the security model, known risks, and the actions
an operator must take before exposing the app publicly.

## Threat model in one line

The web app is local-first; the backend exists for optional cross-device sync and
a leaderboard. **Write endpoints require a Bearer JWT** scoped to the acting user
(register/login mint the token); **reads stay public** (leaderboard + read-only
album/session views). The **admin backoffice** is a separate privileged surface
gated by HTTP Basic auth over HTTPS.

## Operator checklist (required for a public deployment)

1. **Rotate the leaked Rails key.** `api/config/master.key` was committed to this
   public repo, so `secret_key_base` is compromised. The key is no longer tracked
   (gitignored and removed from the index), but the historical leak still requires
   rotation. Regenerate credentials:
   ```bash
   cd api
   rm config/credentials.yml.enc config/master.key
   EDITOR=vi bin/rails credentials:edit         # creates a fresh key + secret_key_base
   ```
   Set the new key as `RAILS_MASTER_KEY` in the deploy environment (Render), and
   consider purging the old key from git history (`git filter-repo`). Until then,
   set a dedicated `JWT_SECRET` so tokens are not signed with the leaked
   `secret_key_base`.
2. **Set a strong `ADMIN_PASSWORD`** (and `ADMIN_EMAIL`) in the deploy env. With
   the default password the backoffice is **disabled in production** (returns
   503) — it can dump and delete every collector's data, so it must not run on a
   public default.
3. **Serve over HTTPS.** Production now sets `assume_ssl` + `force_ssl` (HSTS,
   secure cookies, http→https redirect, `/up` excluded). Keep TLS termination at
   the proxy.
4. **Restrict `CORS_ORIGINS`** to your real front-end origin(s); the default is
   localhost dev ports only.

## Known, accepted risks

- **No rate limiting on `/auth/*` or writes.** Auth and write endpoints are not
  rate-limited; brute-force and spam are possible. For a hardened deployment add
  rate limiting (e.g. `rack-attack`). Tracked as future hardening.
- **Public reads are open by design.** `GET /leaderboard`, `GET /album_stickers`,
  and session reads require no token, so anyone can browse the board. UUID
  session ids are unguessable but not secret.

## Reviewed and OK

- **Authenticated, user-scoped writes.** `sessions`/`scans` CRUD and
  `album_stickers#toggle`/`sync` require a Bearer JWT; the acting user comes from
  the token, never the request body. Every lookup is scoped to the token user's
  session (foreign `sessionId`/`userName` → 403, foreign scan id → 404), closing
  the former open-write gap. Passwords are bcrypt (`has_secure_password`); the
  digest is never returned. JWT is HS256 with a 30-day expiry.
- **No injection:** controllers use strong params; the `pg_dump` export shells
  out via `Open3.capture3` with array args (no shell); no user input is
  interpolated into SQL.
- **Host authorization** is set for the production host.
- **CORS** is scoped to configured origins (not `*`).
- **Dependencies** are clean under `npm audit`, `bundler-audit`, `brakeman`, and
  Trivy (CI `security` job).

## Reporting

Open a private advisory or contact the maintainer; do not file public issues for
undisclosed vulnerabilities.
