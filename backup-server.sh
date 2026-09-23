#!/usr/bin/env bash
# ==============================================================================
# The Ramadhani - Automated Server Backup Script
# Creates a compressed, encrypted-ready archive containing Umami PostgreSQL dump,
# environment variables, and custom media uploads.
# ==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${HOME}/ramadhani_backups"
WORK_DIR="/var/www/ramadhani"
ARCHIVE_NAME="ramadhani_migration_${TIMESTAMP}.tar.gz"
TEMP_STAGE="${BACKUP_DIR}/stage_${TIMESTAMP}"

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  The Ramadhani - Starting Automated System Backup    ${NC}"
echo -e "${BLUE}  Timestamp: ${TIMESTAMP}                              ${NC}"
echo -e "${BLUE}======================================================${NC}"

mkdir -p "${BACKUP_DIR}" "${TEMP_STAGE}"

# 1. Export PostgreSQL Database from Umami DB Container
echo -e "\n${YELLOW}[1/4] Dumping Umami PostgreSQL database from container...${NC}"
if docker ps --format '{{.Names}}' | grep -q "^ramadhani-umami-db$"; then
    docker exec -t ramadhani-umami-db pg_dump -U umami_admin umami_analytics > "${TEMP_STAGE}/umami_database.sql"
    echo -e "${GREEN}✓ Database dump successful ($(du -h "${TEMP_STAGE}/umami_database.sql" | cut -f1))${NC}"
else
    echo -e "${RED}Warning: Container ramadhani-umami-db is not running! Checking local dump...${NC}"
    if [ -f "${WORK_DIR}/umami_backup.sql" ]; then
        cp "${WORK_DIR}/umami_backup.sql" "${TEMP_STAGE}/umami_database.sql"
        echo -e "${YELLOW}✓ Using existing umami_backup.sql${NC}"
    else
        echo -e "${RED}Error: No database found to backup!${NC}"
        exit 1
    fi
fi

# 2. Copy Configuration & Environment Files
echo -e "\n${YELLOW}[2/4] Collecting configuration & environment files...${NC}"
if [ -f "${WORK_DIR}/.env" ]; then
    cp "${WORK_DIR}/.env" "${TEMP_STAGE}/.env"
elif [ -f "./.env" ]; then
    cp "./.env" "${TEMP_STAGE}/.env"
fi

if [ -f "${WORK_DIR}/Caddyfile" ]; then
    cp "${WORK_DIR}/Caddyfile" "${TEMP_STAGE}/Caddyfile"
fi

if [ -f "${WORK_DIR}/docker-compose.prod.yml" ]; then
    cp "${WORK_DIR}/docker-compose.prod.yml" "${TEMP_STAGE}/docker-compose.prod.yml"
fi

# 3. Archive Custom Media Uploads (if any)
echo -e "\n${YELLOW}[3/4] Packaging uploaded media assets...${NC}"
mkdir -p "${TEMP_STAGE}/uploads"
if [ -d "${WORK_DIR}/public/images/uploads" ]; then
    cp -r "${WORK_DIR}/public/images/uploads/"* "${TEMP_STAGE}/uploads/" 2>/dev/null || true
fi

# 4. Create Compressed Tarball Archive
echo -e "\n${YELLOW}[4/4] Creating compressed tarball archive...${NC}"
tar -czf "${BACKUP_DIR}/${ARCHIVE_NAME}" -C "${TEMP_STAGE}" .
rm -rf "${TEMP_STAGE}"

# Generate SHA256 Checksum
cd "${BACKUP_DIR}"
sha256sum "${ARCHIVE_NAME}" > "${ARCHIVE_NAME}.sha256"

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  ✓ Backup Completed Successfully!                   ${NC}"
echo -e "${GREEN}  Archive:  ${BACKUP_DIR}/${ARCHIVE_NAME}${NC}"
echo -e "${GREEN}  Size:     $(du -h "${BACKUP_DIR}/${ARCHIVE_NAME}" | cut -f1)${NC}"
echo -e "${GREEN}  SHA256:   $(cat "${BACKUP_DIR}/${ARCHIVE_NAME}.sha256" | cut -d' ' -f1)${NC}"
echo -e "${GREEN}======================================================${NC}"
