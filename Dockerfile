# --- Builder Stage ---
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@12 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY patches ./patches

RUN pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm run build

# --- Production Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

ENV PORT=8080
EXPOSE 8080

CMD ["node", ".output/server/index.mjs"]