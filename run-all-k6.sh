#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
RESULTS="$ROOT/results.txt"

TESTS=(
  "tc1-15/tc14-registro.js:TC14"
  "tc1-15/tc15-login.js:TC15"
  "tc16-30/tc29-listar-pedidos-pocos.js:TC29"
  "tc16-30/tc30-listar-pedidos-muchos.js:TC30"
  "tc39-43/tc45-load.js:TC45"
  "tc46-58/tc59-load.js:TC59"
  "tc46-58/tc60-stress.js:TC60"
)

> "$RESULTS"

PASS=0
FAIL=0
FAILED_TESTS=()

for entry in "${TESTS[@]}"; do
  script="${entry%%:*}"
  tc="${entry##*:}"

  echo ""
  echo "=========================================="
  echo "  Running: $script ($tc)"
  echo "=========================================="

  TMP_SUMMARY="/tmp/k6_summary_${tc}.json"

  set +e
  k6 run --summary-export "$TMP_SUMMARY" "$script"
  K6_EXIT=$?
  set -e

  if [ -f "$TMP_SUMMARY" ]; then
    python3 - <<PYEOF >> "$RESULTS"
import json
with open('$TMP_SUMMARY') as f:
    d = json.load(f)
d['_tc'] = '$tc'
print(json.dumps(d))
PYEOF
  fi

  if [ $K6_EXIT -eq 0 ]; then
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

echo ""
echo "Generando charts y reporte..."
sudo -u jony python3 /home/jony/springboot-react-jwt-token/charts/charts.py && \
  sudo -u jony node /home/jony/springboot-react-jwt-token/charts/generate_report.js && \
  echo "Reporte generado: charts/reporte_rendimiento.docx"

[ $FAIL -eq 0 ]
