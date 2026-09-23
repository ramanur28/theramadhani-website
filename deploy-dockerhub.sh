#!/usr/bin/env bash
# ==============================================================================
# Helper Script: Build, Push to Docker Hub & Deploy to Production VPS
# Usage:
#   ./deploy-dockerhub.sh <dockerhub-username> [vps-user] [vps-ip] [path-to-ssh-key] [ssh-port]
# Examples:
#   ./deploy-dockerhub.sh yourusername root 103.175.217.71
#   ./deploy-dockerhub.sh yourusername root 103.175.217.71 ~/.ssh/my_key
# ==============================================================================

set -euo pipefail

DOCKERHUB_USER="${1:-}"

if [[ -z "${DOCKERHUB_USER}" ]]; then
  echo "Error: Silakan masukkan username Docker Hub Anda."
  echo "Format: ./deploy-dockerhub.sh <dockerhub_username> [vps_user] [vps_ip] [ssh_key]"
  echo "Contoh: ./deploy-dockerhub.sh ramanur root 103.175.217.71"
  exit 1
fi

VPS_USER="${2:-root}"
VPS_IP="${3:-103.175.217.71}"
SSH_KEY="${4:-}"
SSH_PORT="${5:-22}"

REMOTE_DIR="/var/www/ramadhani"
IMAGE_TAG="${DOCKERHUB_USER}/ramadhani-web:latest"

# Configure SSH and SCP command options
SSH_OPTS=(-p "${SSH_PORT}")
SCP_OPTS=(-P "${SSH_PORT}")

if [[ -n "${SSH_KEY}" ]]; then
  if [[ "${SSH_KEY}" =~ ^[A-Za-z]:\\ ]]; then
    SSH_KEY="$(wslpath -u "${SSH_KEY}")"
  fi
  if [[ -f "${SSH_KEY}" ]]; then
    chmod 600 "${SSH_KEY}" 2>/dev/null || true
    SSH_OPTS+=(-i "${SSH_KEY}")
    SCP_OPTS+=(-i "${SSH_KEY}")
    echo "==> Menggunakan SSH Key: ${SSH_KEY}"
  fi
fi

echo "==> 1. Mem-build Docker image untuk Linux AMD64: ${IMAGE_TAG}..."
docker build --platform linux/amd64 -t "${IMAGE_TAG}" .

echo "==> 2. Meng-upload (push) image ke Docker Hub..."
docker push "${IMAGE_TAG}"

echo "==> 3. Memastikan direktori ${REMOTE_DIR} ada di VPS..."
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_IP}" "sudo mkdir -p ${REMOTE_DIR} && sudo chown -R ${VPS_USER}:${VPS_USER} ${REMOTE_DIR}"

echo "==> 4. Mengirim file konfigurasi (docker-compose.prod.yml, .env, Caddyfile) ke VPS..."
scp "${SCP_OPTS[@]}" docker-compose.prod.yml .env Caddyfile "${VPS_USER}@${VPS_IP}:${REMOTE_DIR}/"

echo "==> 5. Menarik image dari Docker Hub & menjalankan kontainer di VPS..."
ssh "${SSH_OPTS[@]}" "${VPS_USER}@${VPS_IP}" "
  cd ${REMOTE_DIR}
  
  # Update WEB_IMAGE di .env
  if grep -q '^WEB_IMAGE=' .env; then
    sed -i 's|^WEB_IMAGE=.*|WEB_IMAGE=${IMAGE_TAG}|g' .env
  else
    echo 'WEB_IMAGE=${IMAGE_TAG}' >> .env
  fi

  DOCKER_CMD=\"docker\"
  if ! docker ps >/dev/null 2>&1; then
    if sudo docker ps >/dev/null 2>&1; then
      DOCKER_CMD=\"sudo docker\"
    else
      echo 'Error: Tidak dapat mengakses Docker daemon di VPS.'
      exit 1
    fi
  fi

  echo 'Pulling image ${IMAGE_TAG} dari Docker Hub...'
  \${DOCKER_CMD} compose -f docker-compose.prod.yml pull web
  
  echo 'Memulai stack produksi...'
  \${DOCKER_CMD} compose -f docker-compose.prod.yml up -d
  \${DOCKER_CMD} compose -f docker-compose.prod.yml ps
"

echo "==> Sukses! Aplikasi berhasil di-deploy via Docker Hub ke https://ramadhani.cloud"
