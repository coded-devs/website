# Build from the repository root: docker build -f apps/admin/Dockerfile .
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
WORKDIR /workspace

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/auth-contract/package.json packages/auth-contract/package.json
COPY packages/auth-contract/index.js packages/auth-contract/index.js
COPY packages/auth-contract/index.d.ts packages/auth-contract/index.d.ts
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @codeddevs/admin build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /workspace/apps/admin/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /workspace/apps/admin/.next/static ./apps/admin/.next/static
COPY --chown=nextjs:nodejs apps/admin/start.mjs apps/admin/api-origin.mjs ./apps/admin/
USER nextjs
EXPOSE 3001
CMD ["node", "apps/admin/start.mjs"]
