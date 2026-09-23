#!/usr/bin/env bash
# ==============================================================================
# Helper Script: Build Image Locally & Deploy to Production VPS
# Usage:
#   ./deploy.sh [vps-user] [vps-ip] [path-to-ssh-key] [ssh-port]
# Examples:
#   ./deploy.sh root 103.175.217.71
#   ./deploy.sh root 103.175.217.71 ~/.ssh/my_vps_key
#   ./deploy.sh ubuntu 103.175.217.71 /path/to/key.pem 22
# ==============================================================================

set -euo pipefail

VPS_USER="${1:-root}"
VPS_IP="${2:-103.175.217.71}"
SSH_KEY="${3:-}"
SSH_PORT="${4:-22}"

REMOTE_DIR="/var/www/ramadhani"
IMAGE_NAME="ramadhani-web:latest"
ARCHIVE_NAME="ramadhani-web.tar.gz"

# Configure SSH and SCP command options
SSH_OPTS=(-p "${SSH_PORT}")
SCP_OPTS=(-P "${SSH_PORT}")

if [[ -n "${SSH_KEY}" ]]; then
  # Convert Windows path if provided (e.g. C:\... to /mnt/c/...)
  if [[ "${SSH_KEY}" =~ ^[A-Za-z]:\\ ]]; then
    SSH_KEY="$(wslpath -u "${SSH_KEY}")"
  fi
  if [[ -f "${SSH_KEY}" ]]; then
    chmod 600 "${SSH_KEY}" 2>/dev/null || true
    SSH_OPTS+=(-i "${SSH_KEY}")
    SCP_OPTS+=(-i "${SSH_KEY}")
    echo "==> Using SSH Key: ${SSH_KEY}"
  else
    echo "Warning: Specified SSH key '${SSH_KEY}' was not found. Attempting standard SSH authentication..."
  fi
fi

echo "==> 1. Building production Docker image for Linux AMD64..."
docker build --platform linux/amd64 -t "${IMAGE_NAME}" .

echo "==> 2. Exporting and compressing Docker image (${ARCHIVE_NAME})..."
docker save "${IMAGE_NAME}" | gzip > "${ARCHIVE_NAME}"

echo "==> 3. Ensuring remote directory exists on VPS (${VPS_USER}@${VPS_IP}:${REMOTE_DIR})..."
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_IP}" "sudo mkdir -p ${REMOTE_DIR} && sudo chown -R ${VPS_USER}:${VPS_USER} ${REMOTE_DIR}"

echo "==> 4. Transferring image archive and configuration files to VPS..."
scp "${SCP_OPTS[@]}" "${ARCHIVE_NAME}" docker-compose.prod.yml .env Caddyfile "${VPS_USER}@${VPS_IP}:${REMOTE_DIR}/"

echo "==> 5. Loading image and restarting production stack on VPS..."
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_IP}" "
  cd ${REMOTE_DIR}
  
  # Determine docker command (with or without sudo)
  DOCKER_CMD=\"docker\"
  if ! docker ps >/dev/null 2>&1; then
    if sudo docker ps >/dev/null 2>&1; then
      DOCKER_CMD=\"sudo docker\"
    else
      echo 'Error: Cannot connect to Docker daemon even with sudo.'
      exit 1
    fi
  fi

  echo 'Loading image into Docker using ' \${DOCKER_CMD} '...'
  \${DOCKER_CMD} load < ${ARCHIVE_NAME}
  rm -f ${ARCHIVE_NAME}
  
  echo 'Starting production stack with docker compose...'
  \${DOCKER_CMD} compose -f docker-compose.prod.yml up -d
  \${DOCKER_CMD} compose -f docker-compose.prod.yml ps
"

# Clean up local archive
rm -f "${ARCHIVE_NAME}"

echo "==> Deployment completed successfully to https://ramadhani.cloud!"
