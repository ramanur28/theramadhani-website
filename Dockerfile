# ==============================================================================
# Multi-Stage Production Dockerfile for Ramadhani Personal Brand Website
# Stage 1: Build static assets using Node.js
# Stage 2: Serve optimized static assets via ultra-fast Caddy web server
# ==============================================================================

# Stage 1: Node.js Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (utilizing layer cache)
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source code and build
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Minimal Caddy Production Server
FROM caddy:2-alpine AS runner

WORKDIR /var/www/ramadhani

# Copy custom Caddy configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /var/www/ramadhani

# Expose HTTP and HTTPS ports
EXPOSE 80 443 443/udp

# Healthcheck to verify Caddy is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD nc -z 127.0.0.1 80 || exit 1

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
