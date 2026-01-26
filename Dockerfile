# syntax=docker/dockerfile:1

# ============================================
# STAGE 1: Dependencies Builder
# ============================================
FROM node:20-bookworm-slim AS builder

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy application source
COPY . .

# ============================================
# STAGE 2: Production Runtime
# ============================================
FROM node:20-bookworm-slim AS runtime

# Install system dependencies for Sharp and fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Sharp dependencies
    libvips42 \
    # Utilities
    curl \
    tzdata \
    tini \
    # Fonts for text rendering
    fontconfig \
    fonts-dejavu-core \
    fonts-dejavu-extra \
    fonts-liberation2 \
    fonts-noto \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
 && rm -rf /var/lib/apt/lists/* \
 && fc-cache -fv

# Environment configuration
ENV NODE_ENV=production \
    PORT=3000 \
    TZ=Asia/Jakarta

WORKDIR /app

# Copy node_modules and application from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/openapi.yaml ./
COPY --from=builder /app/.env.example ./

# Create non-root user and set permissions
RUN chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start application
CMD ["node", "src/server.js"]
