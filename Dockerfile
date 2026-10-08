# syntax=docker/dockerfile:1
# Multi-stage build for the Next.js app. Used by `docker compose --profile app up --build`.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build needs no secrets: every server setting is read at runtime.
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
# The migration runner and the SQL files are tiny; shipping them in this image lets the one-shot `migrate` service reuse it
# (the standalone build already contains `pg`) instead of building and storing a second ~900 MB image.
COPY --chown=app:app scripts/db ./scripts/db
COPY --chown=app:app db ./db
USER app
EXPOSE 3000
CMD ["node", "server.js"]
