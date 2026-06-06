#!/usr/bin/env bash
# Validate the Rails backend: rubocop, security audits, rspec.
# Needs a reachable Postgres (see api/config/database.yml; docker compose up -d db).
set -uo pipefail
# shellcheck source=scripts/lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

step "api: bundle"     "cd '$ROOT/api' && { bundle check || bundle install; }"
step "api: rubocop"    "cd '$ROOT/api' && bin/rubocop --no-server"
step "api: gem audit"  "cd '$ROOT/api' && bin/bundler-audit --update"
step "api: brakeman"   "cd '$ROOT/api' && bin/brakeman --quiet --no-pager --exit-on-warn --exit-on-error"
step "api: db prepare" "cd '$ROOT/api' && RAILS_ENV=test bin/rails db:test:prepare"
step "api: rspec"      "cd '$ROOT/api' && RAILS_ENV=test bundle exec rspec"

finish "api"
