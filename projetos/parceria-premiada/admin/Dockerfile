FROM node:22-alpine AS builder
WORKDIR /app

# Cache de dependências separado do código
COPY package*.json ./
RUN npm install

# Build — NEXT_PUBLIC_* são baked no bundle em compile time
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN npm run build

# ── Runner (imagem final enxuta) ──────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Deps de produção apenas
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Artefatos do build
COPY --from=builder --chown=nextjs:nodejs /app/.next        ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public       ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/login || exit 1

CMD ["node_modules/.bin/next", "start", "-p", "3000"]
