# Security posture

This is a local-first hobby app (Panini sticker scanner) with an optional Rails
backend. This document records the security model, known risks, and the actions
an operator must take before exposing the app publicly.

## Threat model in one line

The web app is local-first; the backend exists for optional cross-device sync and
a leaderboard. The **public JSON API is intentionally unauthenticated**; the
**admin backoffice is the only privileged surface** and is gated by HTTP Basic
auth over HTTPS.

## Operator checklist (required for a public deployment)

1. **Rotate the leaked Rails key.** `api/config/master.key` was committed to this
   public repo, so `secret_key_base` is compromised. Regenerate credentials and
   stop tracking the key:
   ```bash
   cd api
   rm config/credentials.yml.enc config/master.key
   EDITOR=vi bin/rails credentials:edit         # creates a fresh key + secret_key_base
   git rm --cached config/master.key            # already gitignored going forward
   ```
   Set the new key as `RAILS_MASTER_KEY` in the deploy environment (Render), and
   consider purging the old key from git history (`git filter-repo`).
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

- **Unauthenticated public API.** `POST /api/v1/sessions`, `scans` CRUD,
  `album_stickers#toggle`/`sync` accept any `user_name` with no auth or rate
  limiting. Anyone can add/modify/delete any collector's data or spam the DB.
  This matches the local-first model; for a hardened deployment, add a write
  token and/or rate limiting (e.g. `rack-attack`).

## Reviewed and OK

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
