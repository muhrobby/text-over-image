# syntax=docker/dockerfile:1

# Base image
FROM node:20-alpine AS base

WORKDIR /app

# Install minimal runtime deps sometimes needed by native modules
RUN apk add --no-cache libc6-compat

# Copy manifests first for better layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Environment
ENV NODE_ENV=production \
    PORT=3000 \
    TZ=Asia/Jakarta

# Expose port
EXPOSE 3000

# Use tini for proper signal handling (optional but recommended)
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

# Start the server directly (avoid relying on package.json start)
CMD ["node", "src/server.js"]

