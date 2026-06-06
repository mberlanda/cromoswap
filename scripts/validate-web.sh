#!/usr/bin/env bash
# Validate the web frontend: eslint, vitest, production build.
set -uo pipefail
# shellcheck source=scripts/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

step "web: install"     "cd '$ROOT/web' && { [ -d node_modules ] || npm ci; }"
step "web: lint"        "cd '$ROOT/web' && npm run lint"
step "web: audit"       "cd '$ROOT/web' && npm audit --omit=dev --audit-level=high"
step "web: test"        "cd '$ROOT/web' && npm run test:coverage"
step "web: build"       "cd '$ROOT/web' && npm run build"
step "web: bundle size" "cd '$ROOT/web' && npm run bundle:size"

finish "web"
