#!/usr/bin/env bash
#
# Validate the whole repo the way CI does — run this before every change set.
#
# Usage:
#   scripts/validate.sh [all|web|api]   (default: all)
#
# Web  : eslint, vitest, production build
# API  : rubocop, security audits, rspec (needs a reachable Postgres)
#
# The API steps expect a Postgres matching api/config/database.yml. Locally:
#   docker compose up -d db
# In CI a `postgres` service provides it. DATABASE_* env vars override the
# defaults (host localhost, user/password sticker).
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCOPE="${1:-all}"
FAILED=()

step() {
  local label="$1" cmd="$2"
  printf '\n\033[1;36m▶ %s\033[0m\n' "$label"
  if (eval "$cmd"); then
    printf '\033[1;32m✓ %s\033[0m\n' "$label"
  else
    printf '\033[1;31m✗ %s\033[0m\n' "$label"
    FAILED+=("$label")
  fi
}

validate_web() {
  step "web: install"  "cd '$ROOT/web' && { [ -d node_modules ] || npm ci; }"
  step "web: lint"     "cd '$ROOT/web' && npm run lint"
  step "web: test"     "cd '$ROOT/web' && npm run test:run"
  step "web: build"    "cd '$ROOT/web' && npm run build"
}

validate_api() {
  step "api: bundle"      "cd '$ROOT/api' && { bundle check || bundle install; }"
  step "api: rubocop"     "cd '$ROOT/api' && bin/rubocop --no-server"
  step "api: gem audit"   "cd '$ROOT/api' && bin/bundler-audit --update"
  step "api: brakeman"    "cd '$ROOT/api' && bin/brakeman --quiet --no-pager --exit-on-warn --exit-on-error"
  step "api: db prepare"  "cd '$ROOT/api' && RAILS_ENV=test bin/rails db:test:prepare"
  step "api: rspec"       "cd '$ROOT/api' && RAILS_ENV=test bundle exec rspec"
}

case "$SCOPE" in
  web) validate_web ;;
  api) validate_api ;;
  all) validate_web; validate_api ;;
  *) echo "Unknown scope: $SCOPE (use all|web|api)"; exit 2 ;;
esac

echo
if [ ${#FAILED[@]} -eq 0 ]; then
  printf '\033[1;32m✅ All checks passed.\033[0m\n'
  exit 0
else
  printf '\033[1;31m❌ %d check(s) failed:\033[0m\n' "${#FAILED[@]}"
  printf '   - %s\n' "${FAILED[@]}"
  exit 1
fi
