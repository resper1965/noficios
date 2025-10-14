# Dockerfile Multi-Stage para Next.js
# Otimizado para Cloud Run

# ============================================
# Etapa 1: Build (Dependencies + Build)
# ============================================
FROM node:18-alpine AS builder

# Instala dependências necessárias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copia arquivos de dependências
COPY package.json package-lock.json* ./

# Instala dependências
RUN npm ci

# Copia código fonte
COPY . .

# Configuração de ambiente para build
ENV NEXT_TELEMETRY_DISABLED 1

# Build da aplicação Next.js
RUN npm run build

# ============================================
# Etapa 2: Runtime (Production)
# ============================================
FROM node:18-alpine AS runner

WORKDIR /app

# Configuração de ambiente
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Cria usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos necessários do builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Define propriedade dos arquivos
RUN chown -R nextjs:nodejs /app

# Muda para usuário não-root
USER nextjs

# Expõe porta (Cloud Run usa variável PORT)
EXPOSE 3000

# Define variável de ambiente para porta
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Comando de inicialização
CMD ["node", "server.js"]





