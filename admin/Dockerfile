FROM node:20-alpine AS builder
WORKDIR /app

# Cache de dependências (camada separada para não invalidar em mudanças de código)
COPY package*.json ./
RUN npm ci

# Build (NEXT_PUBLIC_* são baked no bundle em compile time)
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN npm run build

# ── Runner (imagem final enxuta) ──────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Dependências de produção apenas
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

# Artefatos do build e config de runtime
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["npm", "start"]
