# syntax=docker/dockerfile:1.4
# BuildKit required for cache mounts (docker buildx build or DOCKER_BUILDKIT=1)

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

# ---- deps: install dependencies with cache ----
FROM base AS deps
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

# Cache yarn/npm packages between builds (massive speedup on repeat builds)
# Prefer package-lock.json (npm) when both exist - avoids yarn lockfile sync issues
RUN --mount=type=cache,target=/root/.yarn \
    --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; fi

# ---- builder: build Next.js with cache ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* must be set at BUILD time (baked into client bundle)
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Optional: increase memory for large builds
# ENV NODE_OPTIONS="--max-old-space-size=4096"

# Cache Next.js build output between builds (huge speedup on repeat builds)
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ---- runner: minimal production image ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 80
ENV PORT=80
CMD ["node", "server.js"]
