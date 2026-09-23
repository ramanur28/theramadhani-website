#!/usr/bin/env bash
# ==============================================================================
# The Ramadhani - Pull Production Data & Database to Local Machine
# Downloads latest Umami database dump and uploaded media from VPS to local workspace.
# ==============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ $# -lt 1 ]; then
    echo -e "${RED}Usage: $0 <VPS_IP_ADDRESS> [SSH_USER (default: root)] [SSH_KEY_PATH]${NC}"
    echo -e "${YELLOW}Example: $0 103.175.217.71 root ~/.ssh/id_rsa${NC}"
    exit 1
fi

VPS_IP="$1"
SSH_USER="${2:-root}"
SSH_KEY="${3:-}"

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=15"
if [ -n "${SSH_KEY}" ]; then
    SSH_OPTS="${SSH_OPTS} -i ${SSH_KEY}"
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOCAL_BACKUP_DIR="./backups"
mkdir -p "${LOCAL_BACKUP_DIR}"

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}  The Ramadhani - Pulling Production Data to Local Machine      ${NC}"
echo -e "${BLUE}  Source VPS: ${SSH_USER}@${VPS_IP}                             ${NC}"
echo -e "${BLUE}================================================================${NC}"

# 1. Trigger Live Database Dump on VPS
echo -e "\n${YELLOW}[1/3] Triggering live PostgreSQL database dump on VPS...${NC}"
ssh ${SSH_OPTS} "${SSH_USER}@${VPS_IP}" "
  docker exec -t ramadhani-umami-db pg_dump -U umami_admin umami_analytics > /tmp/umami_prod_dump_${TIMESTAMP}.sql
"
echo -e "${GREEN}✓ Database dump generated on remote server.${NC}"

# 2. Download Database Dump to Local Machine
echo -e "\n${YELLOW}[2/3] Downloading database dump to ./backups/...${NC}"
scp ${SSH_OPTS} "${SSH_USER}@${VPS_IP}:/tmp/umami_prod_dump_${TIMESTAMP}.sql" "${LOCAL_BACKUP_DIR}/umami_prod_${TIMESTAMP}.sql"
ssh ${SSH_OPTS} "${SSH_USER}@${VPS_IP}" "rm -f /tmp/umami_prod_dump_${TIMESTAMP}.sql"
echo -e "${GREEN}✓ Downloaded database: ${LOCAL_BACKUP_DIR}/umami_prod_${TIMESTAMP}.sql (${GREEN}$(du -h "${LOCAL_BACKUP_DIR}/umami_prod_${TIMESTAMP}.sql" | cut -f1)${NC})${NC}"

# 3. Sync Uploaded Media Assets from Production to Local
echo -e "\n${YELLOW}[3/3] Syncing CMS uploaded media assets to local public/images/uploads/...${NC}"
mkdir -p "./public/images/uploads"
scp -r ${SSH_OPTS} "${SSH_USER}@${VPS_IP}:/var/www/ramadhani/public/images/uploads/*" "./public/images/uploads/" 2>/dev/null || echo -e "${YELLOW}(No new media files found on remote server)${NC}"

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}  ✓ Production Data Successfully Synced to Local Machine!       ${NC}"
echo -e "${GREEN}  Database Backup: ${LOCAL_BACKUP_DIR}/umami_prod_${TIMESTAMP}.sql${NC}"
echo -e "${GREEN}================================================================${NC}"
