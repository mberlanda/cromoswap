#!/usr/bin/env bash
# Validate end-to-end against the assembled docker stack (Rails serving the web
# bundle + API + admin + Postgres on one origin). Brings the stack up, runs the
# unified Playwright suite in docker mode, and always tears the stack down.
#
# Locally this needs port 3000 and 5432 free (stop any conflicting Postgres).
set -uo pipefail
# shellcheck source=scripts/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

COMPOSE="docker compose -f '$ROOT/docker-compose.yml'"
BASE_URL="${E2E_BASE_URL:-http://localhost:3000}"

cleanup() { eval "$COMPOSE down -v" >/dev/null 2>&1 || true; }
trap cleanup EXIT

step "e2e: stack up"     "eval $COMPOSE up -d --build"
step "e2e: wait health"  "for i in \$(seq 1 60); do curl -fsS '$BASE_URL/up' >/dev/null 2>&1 && exit 0; sleep 5; done; eval $COMPOSE logs app; exit 1"
step "e2e: browser"      "cd '$ROOT/web' && { [ -d node_modules ] || npm ci; } && npx playwright install --with-deps chromium"
step "e2e: playwright"   "cd '$ROOT/web' && E2E_BASE_URL='$BASE_URL' npm run e2e:docker"

finish "e2e"
