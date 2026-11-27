# syntax=docker/dockerfile:1
FROM node:22.23.4-bookworm-slim AS dependencies
WORKDIR /workspace
RUN npm install --global pnpm@10.11.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/storefront/package.json apps/storefront/package.json
RUN --mount=type=cache,target=/root/.local/share/pnpm/store NODE_OPTIONS=--max-old-space-size=768 pnpm install --frozen-lockfile --child-concurrency=2 --network-concurrency=4

FROM dependencies AS development
ENV MEDUSA_DISABLE_TELEMETRY=true NEXT_TELEMETRY_DISABLED=1
COPY . .

FROM development AS build
RUN NODE_OPTIONS=--max-old-space-size=1024 pnpm --dir apps/backend build
RUN NODE_OPTIONS=--max-old-space-size=1024 pnpm --dir apps/storefront build

FROM node:22.23.4-bookworm-slim AS backend-runtime
ENV NODE_ENV=production MEDUSA_DISABLE_TELEMETRY=true
WORKDIR /workspace/apps/backend/.medusa/server
COPY --from=build --chown=node:node /workspace/node_modules /workspace/node_modules
COPY --from=build --chown=node:node /workspace/apps/backend/node_modules /workspace/apps/backend/node_modules
COPY --from=build --chown=node:node /workspace/apps/backend/.medusa/server ./
USER node
CMD ["sh", "-c", "exec node ../../node_modules/@medusajs/cli/cli.js start --host 0.0.0.0 --port \"${PORT:-9000}\""]

FROM node:22.23.4-bookworm-slim AS storefront-runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /workspace/apps/storefront
COPY --from=build --chown=node:node /workspace/node_modules /workspace/node_modules
COPY --from=build --chown=node:node /workspace/apps/storefront/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/apps/storefront/.next ./.next
COPY --from=build --chown=node:node /workspace/apps/storefront/public ./public
COPY --from=build --chown=node:node /workspace/apps/storefront/package.json ./package.json
COPY --from=build --chown=node:node /workspace/apps/storefront/next.config.mjs ./next.config.mjs
USER node
CMD ["sh", "-c", "exec node ./node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port \"${PORT:-8000}\""]
