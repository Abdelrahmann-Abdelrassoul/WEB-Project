#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${YELLOW}[→]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   ClipSphere — Full Stack Verification Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Step 1: Build and start all containers ─────────────────────────────────────
info "Starting all containers..."
docker compose up --build -d
echo ""

# ── Step 2: Wait for backend to be healthy ─────────────────────────────────────
info "Waiting for backend to be healthy..."
RETRIES=20
until docker compose ps backend | grep -q "healthy" || [ $RETRIES -eq 0 ]; do
  sleep 3
  RETRIES=$((RETRIES - 1))
  echo -n "."
done
echo ""

if [ $RETRIES -eq 0 ]; then
  err "Backend did not become healthy in time."
  docker compose logs backend --tail=20
  exit 1
fi
log "All containers healthy."
echo ""

# ── Step 3: Seed the database ──────────────────────────────────────────────────
info "Seeding database with 50 videos..."
docker exec backend node scripts/seedVideos.js --count=50
log "Seeding complete."
echo ""

# ── Step 4: Verify endpoints ───────────────────────────────────────────────────
info "Verifying endpoints..."

check_endpoint() {
  local label=$1
  local url=$2
  local status
  status=$(curl -sk -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" = "200" ]; then
    log "$label → HTTP $status"
  else
    err "$label → HTTP $status (expected 200)"
  fi
}

check_endpoint "Health"        "http://localhost/health"
check_endpoint "Trending feed" "https://localhost/api/v1/videos?feed=trending&limit=8&skip=0"
check_endpoint "All feed"      "https://localhost/api/v1/videos?feed=all&limit=8&skip=0"
check_endpoint "Swagger UI"    "https://localhost/api-docs/"
echo ""

# ── Step 5: Verify Redis cache ─────────────────────────────────────────────────
info "Verifying Redis cache (MISS then HIT)..."
curl -sk "https://localhost/api/v1/videos?feed=trending&limit=8&skip=0" > /dev/null
curl -sk "https://localhost/api/v1/videos?feed=trending&limit=8&skip=0" > /dev/null
curl -sk "https://localhost/api/v1/videos?feed=trending&limit=8&skip=0" > /dev/null

CACHE_LOGS=$(docker compose logs backend 2>/dev/null | grep "\[cache\]" | tail -10)
MISS_COUNT=$(echo "$CACHE_LOGS" | grep -c "MISS" || true)
HIT_COUNT=$(echo "$CACHE_LOGS"  | grep -c "HIT"  || true)

echo "$CACHE_LOGS"
echo ""
log "Cache MISSes: $MISS_COUNT — HITs: $HIT_COUNT"
echo ""

# ── Step 6: Run k6 stress test (if installed) ──────────────────────────────────
if command -v k6 &> /dev/null; then
  info "Running k6 stress test (30s)..."
  k6 run --insecure-skip-tls-verify tests/k6/stress.js
  log "Stress test complete. Results saved to tests/k6/results.json"
else
  info "k6 not installed — skipping stress test."
  info "Install: https://k6.io/docs/get-started/installation/"
fi
echo ""

# ── Done ───────────────────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Verification complete."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""