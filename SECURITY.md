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

- **Rate-limit counters are per process.** `rack-attack` throttles auth and
  write endpoints (see below) using an in-process memory store; with multiple
  app processes the effective limit multiplies. Fine for the single-instance
  deploy — swap in a shared cache store if that changes.
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
- **Rate limiting** (`rack-attack`): POSTs to `/api/v1/auth/*` are throttled to
  10/min per IP and API writes to 120/min per IP (tunable via
  `RACK_ATTACK_AUTH_LIMIT` / `RACK_ATTACK_WRITE_LIMIT`); throttled requests get
  a JSON 429 with `Retry-After`. Public reads are unthrottled.
- **Login timing** uses `User.authenticate_by`, which digests the password even
  for unknown usernames, so response timing can't enumerate accounts.
- **Host authorization** is set for the production host.
- **Security headers.** Every response (including the SPA document served from
  `public/`) gets a strict `Content-Security-Policy` (same-origin by default;
  `blob:` workers + `wasm-unsafe-eval` only because the self-hosted OCR engine
  needs them; `frame-ancestors 'none'`), a `Permissions-Policy` that disables
  everything except the scanner camera, and a
  `strict-origin-when-cross-origin` referrer policy. A Rails-served bundle
  calling a different API origin needs that origin in `CSP_CONNECT_SRC`.
- **CORS** is scoped to configured origins (not `*`).
- **Dependencies** are clean under `npm audit`, `bundler-audit`, `brakeman`, and
  Trivy (CI `security` job).
- **No third-party code at runtime.** tesseract.js used to pull its worker JS,
  wasm core, and language data from `cdn.jsdelivr.net` in the browser. Those
  assets are now copied at build time from the npm packages (integrity-pinned
  via `package-lock.json`) into `public/tesseract` and served same-origin.

## Reporting

Open a private advisory or contact the maintainer; do not file public issues for
undisclosed vulnerabilities.
