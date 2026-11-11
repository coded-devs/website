# Build from the repository root: docker build -f apps/api/Dockerfile .
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
RUN pnpm --filter @codeddevs/api build
RUN pnpm --filter @codeddevs/api --prod deploy --legacy /prod/api
RUN cp -R apps/api/dist /prod/api/dist && cp -R apps/api/drizzle /prod/api/drizzle

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs api
COPY --from=build --chown=api:nodejs /prod/api/ ./
USER api
EXPOSE 4000
CMD ["node", "dist/index.js"]
