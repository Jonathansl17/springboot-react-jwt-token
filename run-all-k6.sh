#!/usr/bin/env bash
set -euo pipefail

TESTS=(
  "tc1-15/tc14-registro.js"
  "tc1-15/tc15-login.js"
  "tc16-30/tc29-listar-pedidos-pocos.js"
  "tc16-30/tc30-listar-pedidos-muchos.js"
  "tc39-43/tc45-load.js"
  "tc46-58/tc59-load.js"
  "tc46-58/tc60-stress.js"
)

PASS=0
FAIL=0
FAILED_TESTS=()

for script in "${TESTS[@]}"; do
  echo ""
  echo "=========================================="
  echo "  Running: $script"
  echo "=========================================="
  if k6 run "$script"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    FAILED_TESTS+=("$script")
  fi
done

echo ""
echo "=========================================="
echo "  RESULTS: $PASS passed, $FAIL failed"
if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo "  Failed:"
  for t in "${FAILED_TESTS[@]}"; do
    echo "    - $t"
  done
fi
echo "=========================================="

[ $FAIL -eq 0 ]
