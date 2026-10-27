#!/usr/bin/env bash
# Frontend security gate: secret scan, npm audit, prettier, lockfile hygiene, dist leak check.
# Exits non-zero on any finding OR if a required tool is missing (a skipped check must
# never look like a pass). Safe to re-run: it only reads and prints.
# Usage: scripts/security-check.sh
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Production build output only; dist/test-out holds unit-test bundles that legitimately
# contain test fixtures and must not be scanned.
DIST_DIR="dist/chubb-claims-frontend"
# Dev-only seed domain that must never ship in a production bundle.
LEAK_PATTERN="chubb.test"
AUDIT_TIMEOUT_SECONDS=120

declare -a results=()
failures=0

record() { # name status(PASS|FAIL|MISSING|SKIPPED)
  results+=("$(printf '%-30s %s' "$1" "$2")")
  case "$2" in PASS | SKIPPED) ;; *) failures=$((failures + 1)) ;; esac
}

have() { command -v "$1" >/dev/null 2>&1; }

# 1. Secrets: working tree and full git history (a secret removed later is still leaked).
if have gitleaks; then
  gitleaks detect --source . --no-git --redact --no-banner && tree=PASS || tree=FAIL
  record "gitleaks (working tree)" "$tree"
  if [[ -d .git ]]; then
    gitleaks detect --source . --redact --no-banner && hist=PASS || hist=FAIL
    record "gitleaks (git history)" "$hist"
  fi
else
  echo "MISSING TOOL: gitleaks (https://github.com/gitleaks/gitleaks#installing)" >&2
  record "gitleaks" "MISSING"
fi

# 2. Lockfile must be committed: without it audits and installs are not reproducible.
if [[ ! -f package-lock.json ]]; then
  echo "package-lock.json does not exist" >&2
  record "package-lock.json tracked" "FAIL"
elif git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git check-ignore -q package-lock.json; then
  echo "package-lock.json is matched by .gitignore" >&2
  record "package-lock.json tracked" "FAIL"
else
  record "package-lock.json tracked" "PASS"
fi

# 3. Dependencies. npm audit exits non-zero both for findings and for an unreachable
# registry; a timeout (exit 124) is also a failure, so an offline run can never pass.
if have npm; then
  if have timeout; then
    timeout "$AUDIT_TIMEOUT_SECONDS" npm audit --audit-level=high
  else
    npm audit --audit-level=high
  fi
  rc=$?
  [[ $rc -eq 124 ]] && echo "npm audit timed out after ${AUDIT_TIMEOUT_SECONDS}s (treated as FAIL)" >&2
  [[ $rc -eq 0 ]] && st=PASS || st=FAIL
  record "npm audit (high+)" "$st"
else
  echo "MISSING TOOL: npm" >&2
  record "npm audit (high+)" "MISSING"
fi

# 4. Format check, using the project-local prettier (no network fetch via npx).
if [[ -x node_modules/.bin/prettier ]]; then
  node_modules/.bin/prettier --check . && st=PASS || st=FAIL
  record "prettier --check" "$st"
else
  echo "MISSING TOOL: prettier (run npm ci)" >&2
  record "prettier --check" "MISSING"
fi

# 5. Optional: production bundle must not reference the dev seed domain.
if [[ -d "$DIST_DIR" ]]; then
  if hits="$(grep -rIl -- "$LEAK_PATTERN" "$DIST_DIR")" && [[ -n "$hits" ]]; then
    echo "'$LEAK_PATTERN' found in production build:" >&2
    echo "$hits" >&2
    record "dist has no '$LEAK_PATTERN'" "FAIL"
  else
    record "dist has no '$LEAK_PATTERN'" "PASS"
  fi
else
  echo "NOTE: $DIST_DIR not found; dist leak check skipped (run npm run build first)."
  record "dist has no '$LEAK_PATTERN'" "SKIPPED"
fi

echo
echo "===== security-check summary ====="
printf '%s\n' "${results[@]}"
if [[ $failures -gt 0 ]]; then
  echo "RESULT: FAILED ($failures check(s) failed or missing)"
  exit 1
fi
echo "RESULT: OK"
