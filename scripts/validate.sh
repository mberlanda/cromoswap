#!/usr/bin/env bash
#
# Orchestrate the scoped validators. Each scope is also runnable on its own:
#   scripts/validate-web.sh   scripts/validate-api.sh   scripts/validate-e2e.sh
#
# Usage:
#   scripts/validate.sh [web|api|e2e|all|ci]
#     web   eslint + vitest + build
#     api   rubocop + audits + rspec   (needs Postgres)
#     e2e   docker compose + Playwright (needs Docker; ports 3000/5432 free)
#     all   web + api                  (default — the fast pre-commit gate)
#     ci    web + api + e2e            (everything)
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCOPE="${1:-all}"
FAILED=()

run() { "$DIR/validate-$1.sh" || FAILED+=("$1"); }

case "$SCOPE" in
  web) run web ;;
  api) run api ;;
  e2e) run e2e ;;
  all) run web; run api ;;
  ci)  run web; run api; run e2e ;;
  *)   echo "Unknown scope: $SCOPE (use web|api|e2e|all|ci)"; exit 2 ;;
esac

echo
if [ ${#FAILED[@]} -eq 0 ]; then
  printf '\033[1;32m✅ %s: all scopes passed.\033[0m\n' "$SCOPE"
  exit 0
fi
printf '\033[1;31m❌ %s: failed scope(s): %s\033[0m\n' "$SCOPE" "${FAILED[*]}"
exit 1
