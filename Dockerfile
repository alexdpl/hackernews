# ==========================================
# STAGE 1: Build Environment
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Installazione pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy manifest delle dipendenze per sfruttare il layer caching di Docker
COPY package.json pnpm-lock.yaml ./

# Installazione dipendenze complete
RUN pnpm install --frozen-lockfile

# Copia del codice sorgente
COPY . .

# Variabili d'ambiente di build per bypassare i controlli lato Nitro durante la compilazione
ENV NODE_ENV=production
ENV NUXT_TELEMETRY_DISABLED=1

# Compilazione del bundle Nitro (.output/server/index.mjs)
RUN pnpm run build

# ==========================================
# STAGE 2: Lightweight Production Runtime
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Creazione utente non-root per massima sicurezza container
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

# Copia esclusiva dell'output compilato da Nitro dallo Stage 1
COPY --from=builder /app/.output ./.output

USER nuxtjs

EXPOSE 3000

# Avvio diretto del server Nitro senza pnpm/npm
CMD ["node", ".output/server/index.mjs"]