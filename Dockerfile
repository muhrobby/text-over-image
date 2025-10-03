# syntax=docker/dockerfile:1
# --- STAGE 1: builder ---
FROM node:20-bookworm-slim AS builder
ENV NODE_ENV=production
WORKDIR /app

# 1) deps dulu agar cache optimal
COPY package*.json ./
RUN npm ci

# 2) salin source
COPY . .
# (opsional) kalau pakai TypeScript:
# RUN npm run build

# --- STAGE 2: runtime ---
FROM node:20-bookworm-slim AS runtime

# butuh curl untuk healthcheck; tzdata untuk TZ Asia/Jakarta
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl tzdata tini fontconfig \
    fonts-dejavu-core fonts-dejavu-extra \
    fonts-liberation2 \
    fonts-noto fonts-noto-color-emoji fonts-noto-cjk \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=3002 \
    TZ=Asia/Jakarta

WORKDIR /app

# ambil node_modules dari builder + source runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./
# kalau pakai TypeScript dan build ke dist:
# COPY --from=builder /app/dist ./dist

# user non-root
USER node

EXPOSE 3002

ENTRYPOINT ["/usr/bin/tini", "--"]
# kalau pakai dist:
# CMD ["node", "dist/server.js"]
CMD ["node", "src/server.js"]
