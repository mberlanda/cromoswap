# Shared helpers for the scripts/validate-*.sh family.
# Source this; it provides $ROOT, step(), and finish().

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STEP_FAILED=()

# step "label" "shell command"
step() {
  local label="$1" cmd="$2"
  printf '\n\033[1;36m▶ %s\033[0m\n' "$label"
  if (eval "$cmd"); then
    printf '\033[1;32m✓ %s\033[0m\n' "$label"
  else
    printf '\033[1;31m✗ %s\033[0m\n' "$label"
    STEP_FAILED+=("$label")
  fi
}

# finish "scope name" — print a summary and exit 0/1.
finish() {
  echo
  if [ ${#STEP_FAILED[@]} -eq 0 ]; then
    printf '\033[1;32m✅ %s: all checks passed.\033[0m\n' "${1:-validation}"
    exit 0
  fi
  printf '\033[1;31m❌ %s: %d check(s) failed:\033[0m\n' "${1:-validation}" "${#STEP_FAILED[@]}"
  printf '   - %s\n' "${STEP_FAILED[@]}"
  exit 1
}
