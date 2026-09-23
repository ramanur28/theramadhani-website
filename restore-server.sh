#!/usr/bin/env bash
# ==============================================================================
# The Ramadhani - Automated Server Restore & Bootstrap Script
# Restores database, configuration, and launches all Docker containers on the new VPS.
# ==============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TARGET_DIR="/var/www/ramadhani"

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  The Ramadhani - Starting Automated System Restore   ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check for backup archive argument
if [ $# -lt 1 ]; then
    echo -e "${RED}Usage: $0 <path_to_ramadhani_migration_backup.tar.gz>${NC}"
    exit 1
fi

ARCHIVE_PATH="$1"
if [ ! -f "${ARCHIVE_PATH}" ]; then
    echo -e "${RED}Error: Backup archive '${ARCHIVE_PATH}' not found!${NC}"
    exit 1
fi

# 1. Verify and Extract Backup
echo -e "\n${YELLOW}[1/5] Extracting backup archive to ${TARGET_DIR}...${NC}"
mkdir -p "${TARGET_DIR}"
TEMP_RESTORE="/tmp/ramadhani_restore_$(date +%s)"
mkdir -p "${TEMP_RESTORE}"
tar -xzf "${ARCHIVE_PATH}" -C "${TEMP_RESTORE}"

# Move config files
if [ -f "${TEMP_RESTORE}/.env" ]; then
    cp "${TEMP_RESTORE}/.env" "${TARGET_DIR}/.env"
fi
if [ -f "${TEMP_RESTORE}/Caddyfile" ]; then
    cp "${TEMP_RESTORE}/Caddyfile" "${TARGET_DIR}/Caddyfile"
fi
if [ -f "${TEMP_RESTORE}/docker-compose.prod.yml" ]; then
    cp "${TEMP_RESTORE}/docker-compose.prod.yml" "${TARGET_DIR}/docker-compose.prod.yml"
fi
if [ -d "${TEMP_RESTORE}/uploads" ]; then
    mkdir -p "${TARGET_DIR}/public/images/uploads"
    cp -r "${TEMP_RESTORE}/uploads/"* "${TARGET_DIR}/public/images/uploads/" 2>/dev/null || true
fi

# 2. Check Docker & Docker Compose
echo -e "\n${YELLOW}[2/5] Checking Docker environment...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker is not installed. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
fi

# 3. Pull & Launch Containers
echo -e "\n${YELLOW}[3/5] Starting Docker containers on new VPS...${NC}"
cd "${TARGET_DIR}"
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d

# 4. Wait for PostgreSQL & Restore Database
echo -e "\n${YELLOW}[4/5] Waiting for PostgreSQL database to be healthy...${NC}"
for i in {1..30}; do
    if docker exec ramadhani-umami-db pg_isready -U umami_admin -d umami_analytics &>/dev/null; then
        echo -e "${GREEN}✓ PostgreSQL is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

if [ -f "${TEMP_RESTORE}/umami_database.sql" ]; then
    echo -e "${YELLOW}Restoring Umami analytics database...${NC}"
    cat "${TEMP_RESTORE}/umami_database.sql" | docker exec -i ramadhani-umami-db psql -U umami_admin -d umami_analytics
    echo -e "${GREEN}✓ Database restored successfully!${NC}"
fi

# Clean up temp restore
rm -rf "${TEMP_RESTORE}"

# 5. Restart Web Container to Trigger SSL on New Host
echo -e "\n${YELLOW}[5/5] Restarting Caddy web container for SSL initialization...${NC}"
docker restart ramadhani-web-prod

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  ✓ Server Migration & Restore Completed!            ${NC}"
echo -e "${GREEN}  Containers Status:                                 ${NC}"
docker compose -f "${TARGET_DIR}/docker-compose.prod.yml" ps
echo -e "${GREEN}======================================================${NC}"
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Update your Domain DNS A Record (for @, www, and analytics) to point to this new VPS IP."
echo -e "2. Once DNS is updated, Caddy will automatically issue the HTTPS SSL certificates."
