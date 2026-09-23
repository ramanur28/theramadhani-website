#!/usr/bin/env bash
# ==============================================================================
# The Ramadhani - Zero-Downtime Caddy Hot Reload
# Reloads Caddy configuration instantly without restarting the website container.
# ==============================================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Reloading Caddy configuration (Zero-Downtime)...${NC}"

if ! docker ps --format '{{.Names}}' | grep -q "^ramadhani-web-prod$"; then
    echo -e "${RED}Error: Container ramadhani-web-prod is not running!${NC}"
    exit 1
fi

docker exec ramadhani-web-prod caddy reload --config /etc/caddy/Caddyfile

echo -e "${GREEN}✓ Caddy reloaded successfully in ~50ms without restarting the container!${NC}"
