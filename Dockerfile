# ==========================================
# STAGE 1: Build & Dependencies
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Abilita pnpm nativo
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia i file dei requisiti e installa le dipendenze
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copia il codice sorgente e compila il bundle di produzione
COPY . .
ENV NODE_ENV=production
RUN pnpm build

# ==========================================
# STAGE 2: Production Minimal Runner
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Sicurezza: Esegui come utente non-root (Principio di Minimo Privilegio)
USER node

# Copia SOLTANTO l'output compilato di Nitro
COPY --chown=node:node --from=builder /app/.output ./.output

# Variabili d'ambiente di Runtime
ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps --max-old-space-size=4096"

EXPOSE 8080

# Avvio diretto del server Nitro Standalone (Senza pnpm/npm sopra)
CMD ["node", ".output/server/index.mjs"]