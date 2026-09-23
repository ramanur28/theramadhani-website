# 🚀 Deployment & Operations Guide: Ramadhani Brand Platform

This guide outlines how to build, deploy, and operate **The Ramadhani** authority platform across local, containerized, and native production Linux VPS environments.

---

## 📑 Table of Contents

1. [Local Development](#1-local-development)
2. [Production Deployment Methods](#2-production-deployment-methods)
   - [Method A: Direct Transfer via SCP (Recommended)](#method-a-direct-transfer-via-scp-recommended)
   - [Method B: Container Registry (Docker Hub / GHCR)](#method-b-container-registry-docker-hub--ghcr)
   - [Method C: Native Linux Host (No Docker)](#method-c-native-linux-host-no-docker)
3. [Zero-Downtime Hot Reload (Caddy)](#3-zero-downtime-hot-reload-caddy)
4. [Server Firewall & DNS Checklist](#4-server-firewall--dns-checklist)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Post-Deployment Verification & Health Checks](#6-post-deployment-verification--health-checks)
7. [Rollback & Emergency Recovery](#7-rollback--emergency-recovery)

---

## 1. Local Development

### Option A: Native Node.js (Recommended for Frontend Dev)
```bash
# 1. Install dependencies
npm install

# 2. Run Astro dev server
npm run dev

# 3. (Optional) Run Astro + Local Decap CMS concurrently
npm run dev:all
```
- **Astro Site**: [http://localhost:4321](http://localhost:4321)
- **Decap CMS Admin**: [http://localhost:4321/admin](http://localhost:4321/admin) (requires `npm run dev:all`)

### Option B: Via Docker Compose
```bash
docker compose -f docker-compose.dev.yml up
```

---

## 2. Production Deployment Methods

Building the Docker image locally saves CPU and RAM on your production VPS and ensures zero build overhead on the live server.

### Method A: Direct Transfer via SCP (Recommended)

This method packages the Docker image locally and pushes it directly to your VPS without requiring a public container registry.

#### Automated Script (`deploy.sh`)
The repository includes an automated script with automatic Windows/WSL path translation and custom SSH port support:

```bash
# Usage:
./deploy.sh [vps-user] [vps-ip] [path-to-ssh-key] [ssh-port]

# Examples:
./deploy.sh root 103.175.217.71
./deploy.sh root 103.175.217.71 ~/.ssh/my_vps_key
./deploy.sh ubuntu 103.175.217.71 "C:\Users\Name\.ssh\key.pem" 22
```

#### Manual Step-by-Step Breakdown:
1. **Build & compress image on local machine**:
   ```bash
   docker build --platform linux/amd64 -t ramadhani-web:latest .
   docker save ramadhani-web:latest | gzip > ramadhani-web.tar.gz
   ```
2. **Transfer image and configs to VPS**:
   ```bash
   scp ramadhani-web.tar.gz user@your-vps-ip:/var/www/ramadhani/
   scp docker-compose.prod.yml .env Caddyfile user@your-vps-ip:/var/www/ramadhani/
   ```
3. **Load and restart containers on VPS**:
   ```bash
   ssh user@your-vps-ip
   cd /var/www/ramadhani
   docker load < ramadhani-web.tar.gz
   docker compose -f docker-compose.prod.yml up -d
   rm ramadhani-web.tar.gz
   ```

---

### Method B: Container Registry (Docker Hub / GHCR)

Ideal for automated GitHub Actions pipelines and multi-server clusters.

#### Automated Script (`deploy-dockerhub.sh`)
```bash
# Usage:
./deploy-dockerhub.sh <dockerhub-username> [vps-user] [vps-ip] [path-to-ssh-key] [ssh-port]

# Example:
./deploy-dockerhub.sh ramanur root 103.175.217.71 ~/.ssh/my_key
```

#### Manual Step-by-Step Breakdown:
1. **Build and push image**:
   ```bash
   docker build --platform linux/amd64 -t yourusername/ramadhani-web:latest .
   docker push yourusername/ramadhani-web:latest
   ```
2. **Pull and run on VPS**:
   ```bash
   ssh user@your-vps-ip
   cd /var/www/ramadhani
   # Update .env to: WEB_IMAGE=yourusername/ramadhani-web:latest
   docker compose -f docker-compose.prod.yml pull web
   docker compose -f docker-compose.prod.yml up -d
   ```

---

### Method C: Native Linux Host (No Docker)

For environments running native Linux without Docker:

#### 1. Build Static Files Locally:
```bash
npm run check
npm run build
```
The production bundle is generated inside the `./dist` directory.

#### 2. Sync to VPS Web Root:
```bash
rsync -avz --delete ./dist/ root@your-vps-ip:/var/www/ramadhani/
```

#### 3. Install & Configure Native Caddy on Ubuntu:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

#### 4. Configure `/etc/caddy/Caddyfile`:
```caddy
ramadhani.cloud {
    root * /var/www/ramadhani
    encode zstd gzip
    file_server
    try_files {path} {path}/ /index.html

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    @hashed path /_astro/* /fonts/* /images/*
    header @hashed Cache-Control "public, max-age=31536000, immutable"
}
```

#### 5. Reload Caddy:
```bash
sudo systemctl reload caddy
```

---

## 3. Zero-Downtime Hot Reload (Caddy)

When updating reverse proxies, headers, or routing rules in `Caddyfile`, you **do not** need to restart the container:

```bash
# Run from repository root:
./reload-caddy.sh

# Or directly execute on VPS:
docker exec ramadhani-web-prod caddy reload --config /etc/caddy/Caddyfile
```
*Reload completes in under **50ms** with zero dropped connections or SSL certificate renegotiations.*

---

## 4. Server Firewall & DNS Checklist

### DNS Records:
| Record Type | Host | Points To | Note |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `<VPS_PUBLIC_IP>` | Primary website apex domain (`ramadhani.cloud`) |
| **A** or **CNAME** | `www` | `<VPS_PUBLIC_IP>` / `ramadhani.cloud` | Auto-redirects to apex via Caddy |
| **A** or **CNAME** | `analytics` | `<VPS_PUBLIC_IP>` / `ramadhani.cloud` | Umami Analytics dashboard |

### VPS Firewall Ports (UFW):
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment "SSH Remote Access"
sudo ufw allow 80/tcp comment "HTTP (ACME Challenge & Caddy)"
sudo ufw allow 443/tcp comment "HTTPS (Caddy)"
sudo ufw allow 443/udp comment "HTTP/3 QUIC (Caddy)"
sudo ufw enable
```

---

## 5. Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `WEB_IMAGE` | `ramadhani-web:latest` | Docker image tag for the website container |
| `SITE_DOMAIN` | `ramadhani.cloud` | Production domain used for TLS certificate generation |
| `SITE_URL` | `https://ramadhani.cloud` | Canonical URL used for SEO, OpenGraph, and XML sitemaps |
| `ACME_EMAIL` | `ramanur321@gmail.com` | Notification email for Let's Encrypt SSL/TLS certificates |
| `UMAMI_DB_NAME` | `umami_analytics` | PostgreSQL database name for analytics |
| `UMAMI_DB_USER` | `umami_admin` | PostgreSQL username |
| `UMAMI_DB_PASSWORD` | `[secure_pass]` | PostgreSQL password |
| `UMAMI_APP_SECRET` | `[32_char_salt]` | Random 32+ character salt for password and session hashing |
| `PUBLIC_UMAMI_WEBSITE_ID` | `1caa2dcc-...` | Umami tracking script identifier injected into frontend |
| `PUBLIC_UMAMI_HOST_URL` | `https://analytics.ramadhani.cloud` | Umami script endpoint |

---

## 6. Post-Deployment Verification & Health Checks

### Check Container Status:
```bash
docker compose -f docker-compose.prod.yml ps
```
*All three services (`ramadhani-web-prod`, `ramadhani-umami-app`, `ramadhani-umami-db`) should show `Up (healthy)`.*

### Inspect Logs:
```bash
# Check Caddy web server logs
docker logs -f ramadhani-web-prod --tail 50

# Check Umami analytics logs
docker logs -f ramadhani-umami-app --tail 50
```

### Validate Endpoints:
```bash
# Verify HTTP to HTTPS redirection
curl -I http://ramadhani.cloud

# Verify HTTP/2 or HTTP/3 HTTPS response
curl -I https://ramadhani.cloud

# Verify machine-readable direct answer endpoints
curl -s https://ramadhani.cloud/llms.txt | head -n 10
```

---

## 7. Rollback & Emergency Recovery

If a newly deployed image exhibits issues:

1. **Revert to Previous Docker Image**:
   ```bash
   docker image tag ramadhani-web:previous ramadhani-web:latest
   docker compose -f docker-compose.prod.yml up -d web
   ```
2. **Restore from Automated System Backup**:
   ```bash
   # Run the restore script with the latest backup archive:
   ./restore-server.sh ~/ramadhani_backups/ramadhani_migration_YYYYMMDD_HHMMSS.tar.gz
   ```
   *See [MIGRATION.md](file:///wsl.localhost/Ubuntu/home/ramadhani/ramadhani2/MIGRATION.md) for full disaster recovery steps.*