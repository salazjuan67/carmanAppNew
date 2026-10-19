#!/usr/bin/env bash
# Verificación E2E iOS Expo Push (tras deploy de carman-back + TestFlight 14.2.1+)
set -euo pipefail

API_BASE="${API_BASE:-https://carmanparking.com/api}"
TOKEN="${TOKEN:-}"
ESTABLISHMENT_ID="${ESTABLISHMENT_ID:-}"

echo "== 1) register-device debe existir (no HTML 404) =="
HTTP=$(curl -sS -o /tmp/reg-device.body -w '%{http_code}' -X POST \
  "${API_BASE}/notifications/register-device" \
  -H "Content-Type: application/json" \
  ${TOKEN:+-H "Authorization: Bearer ${TOKEN}"} \
  -d "{\"deviceToken\":\"ExponentPushToken[TEST]\",\"establishmentId\":\"${ESTABLISHMENT_ID:-507f1f77bcf86cd799439011}\",\"platform\":\"ios\"}" || true)
echo "HTTP $HTTP"
head -c 300 /tmp/reg-device.body; echo
if grep -qi 'Cannot POST' /tmp/reg-device.body; then
  echo "FAIL: backend sin deploy. Ver carman-back/DEPLOY_EXPO_PUSH.md"
  exit 1
fi
echo "OK: endpoint responde (401/400/200 esperable según token)"

echo
echo "== 2) Checklist iPhone físico (manual) =="
cat <<'EOF'
1. Instalar TestFlight build 14.2.1+ (buildNumber >= 25)
2. Login → permitir notificaciones
3. Logs: token ExponentPushToken[...] y register-device success
4. Desde ticket web: solicitar vehículo del mismo establecimiento
5. Background: llega push "Vehículo solicitado"
6. Tap → Home / Solicitados
7. Foreground: lista se refresca sin esperar polling
EOF
