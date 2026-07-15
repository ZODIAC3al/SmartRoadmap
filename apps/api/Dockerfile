# ── Build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /repo

# Copy only what's needed to resolve the workspace, so npm's layer stays cached
COPY package.json package-lock.json turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN npm ci

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build --workspace @smartroadmap/api

# Drop dev dependencies from the artifact we ship
RUN npm prune --omit=dev

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Never run the API as root
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/package.json ./package.json

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
