#!/usr/bin/env bash
# ==============================================================================
# The Ramadhani - One-Click Direct Server-to-Server Migration Script
# Automates the entire backup from the OLD VPS and direct restore to the NEW VPS.
# ==============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ $# -lt 2 ]; then
    echo -e "${RED}Usage: $0 <OLD_VPS_IP> <NEW_VPS_IP> [SSH_USER (default: root)] [SSH_KEY_PATH]${NC}"
    echo -e "${YELLOW}Example: $0 103.175.217.71 103.175.217.99 root ~/.ssh/id_rsa${NC}"
    exit 1
fi

OLD_IP="$1"
NEW_IP="$2"
SSH_USER="${3:-root}"
SSH_KEY="${4:-}"

SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=15"
if [ -n "${SSH_KEY}" ]; then
    SSH_OPTS="${SSH_OPTS} -i ${SSH_KEY}"
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="ramadhani_migration_${TIMESTAMP}.tar.gz"

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}  The Ramadhani - One-Click Server Migration                     ${NC}"
echo -e "${BLUE}  Source (Old VPS):  ${SSH_USER}@${OLD_IP}                       ${NC}"
echo -e "${BLUE}  Target (New VPS):  ${SSH_USER}@${NEW_IP}                       ${NC}"
echo -e "${BLUE}================================================================${NC}"

# 1. Run Backup on Old VPS
echo -e "\n${YELLOW}[Step 1/4] Executing automated backup on Old VPS (${OLD_IP})...${NC}"
ssh ${SSH_OPTS} "${SSH_USER}@${OLD_IP}" "bash -s" < ./backup-server.sh

# Find latest backup filename on old VPS
LATEST_BACKUP=$(ssh ${SSH_OPTS} "${SSH_USER}@${OLD_IP}" "ls -t ~/ramadhani_backups/ramadhani_migration_*.tar.gz | head -n 1")
echo -e "${GREEN}✓ Identified backup archive: ${LATEST_BACKUP}${NC}"

# 2. Transfer Project Code & Backup to New VPS
echo -e "\n${YELLOW}[Step 2/4] Transferring backup and deployment files to New VPS (${NEW_IP})...${NC}"
ssh ${SSH_OPTS} "${SSH_USER}@${NEW_IP}" "mkdir -p /var/www/ramadhani ~/ramadhani_backups"

# Download backup locally to stream/pipe to new VPS
echo -e "Transferring backup archive..."
scp ${SSH_OPTS} "${SSH_USER}@${OLD_IP}:${LATEST_BACKUP}" "/tmp/${BACKUP_NAME}"
scp ${SSH_OPTS} "/tmp/${BACKUP_NAME}" "${SSH_USER}@${NEW_IP}:~/ramadhani_backups/${BACKUP_NAME}"
rm -f "/tmp/${BACKUP_NAME}"

# Transfer latest repository scripts to new VPS
scp ${SSH_OPTS} ./docker-compose.prod.yml ./Caddyfile ./restore-server.sh ./backup-server.sh "${SSH_USER}@${NEW_IP}:/var/www/ramadhani/"

# 3. Execute Restore on New VPS
echo -e "\n${YELLOW}[Step 3/4] Restoring database and launching containers on New VPS (${NEW_IP})...${NC}"
ssh ${SSH_OPTS} "${SSH_USER}@${NEW_IP}" "bash /var/www/ramadhani/restore-server.sh ~/ramadhani_backups/${BACKUP_NAME}"

# 4. Summary & DNS Reminder
echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}  ✓ Direct Server-to-Server Migration Finished Successfully!    ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "${YELLOW}Final Action Required:${NC}"
echo -e "Update your Domain DNS Records at your DNS Manager (Cloudflare/Registrar):"
echo -e "  - A Record:  ${BLUE}@ (ramadhani.cloud)${NC}           -> ${GREEN}${NEW_IP}${NC}"
echo -e "  - A Record:  ${BLUE}www (www.ramadhani.cloud)${NC}     -> ${GREEN}${NEW_IP}${NC}"
echo -e "  - A Record:  ${BLUE}analytics (analytics...)${NC}     -> ${GREEN}${NEW_IP}${NC}"
