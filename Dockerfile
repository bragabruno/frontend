# syntax=docker/dockerfile:1

# ---------- Builder ----------
# Base pinned by digest (node:20-alpine).
FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS builder

WORKDIR /app

# Install deps from the lockfile first for layer caching.
COPY package*.json ./
RUN npm ci

COPY . .
# Angular's `application` builder emits to <output-path>/browser.
RUN npm run build -- --output-path=dist/out

# ---------- Runtime ----------
# nginx-unprivileged runs as uid 101 and listens on 8080 — no root in the
# serving container. Base pinned by digest.
FROM nginxinc/nginx-unprivileged:1.27-alpine@sha256:65e3e85dbaed8ba248841d9d58a899b6197106c23cb0ff1a132b7bfe0547e4c0

# Static SPA assets (note the builder's browser/ subdirectory).
COPY --from=builder /app/dist/out/browser/ /usr/share/nginx/html/
# Real nginx server config (the old image copied an Angular proxy JSON here).
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
