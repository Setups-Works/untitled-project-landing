# syntax=docker/dockerfile:1
# Multi-stage build for the Next.js app. Used by `docker compose --profile app up --build`.

ARG NODE_VERSION=24-alpine

# Dependencies layer: only re-runs when the lockfile changes. The npm cache is a BuildKit cache mount, so it never lands in an image layer.
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build needs no secrets: every server setting is read at runtime. The Next.js compiler cache is kept between builds.
RUN --mount=type=cache,target=/app/.next/cache npm run build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
# Copy order: least to most frequently changing, so a code change only invalidates the last layers.
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/.next/standalone ./
# The migration runner and the SQL files are tiny; shipping them in this image lets the one-shot `migrate` service reuse it
# (the standalone build already contains `pg`) instead of building and storing a second ~900 MB image.
COPY --chown=app:app scripts/db ./scripts/db
COPY --chown=app:app db ./db
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1
CMD ["node", "server.js"]
