# 🏗️ Nova Arquitetura - n.Oficios v2.0

**Architect:** Winston  
**Data:** 21 de Outubro de 2025  
**Mudança:** Migração completa Supabase → Clerk + PostgreSQL Direto

---

## 📊 DECISÃO ARQUITETURAL

### **Stack Anterior (v1.0):**
```
❌ Supabase (Auth + Database)
❌ Neon PostgreSQL (online)
```

### **Stack Novo (v2.0):**
```
✅ Clerk (Auth apenas)
✅ PostgreSQL direto (Docker local + VPS)
✅ Prisma ORM (acesso ao banco)
```

---

## 🎯 ARQUITETURA COMPLETA

### **Camadas:**

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 15.5)                            │
│  - Clerk Auth (Google OAuth + Email)               │
│  - API Routes (Next.js)                             │
│  - Prisma Client (database)                         │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  BACKEND PYTHON (Flask + Gunicorn)                  │
│  - Gmail Ingest API                                 │
│  - Processamento de PDFs                            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  DATABASE (PostgreSQL 16)                           │
│  - Container Docker local                           │
│  - PostgreSQL direto na VPS                         │
│  - Prisma Migrations                                │
└─────────────────────────────────────────────────────┘
```

---

## 📦 TECH STACK DEFINITIVO

| Categoria | Tecnologia | Versão | Justificativa |
|-----------|------------|--------|---------------|
| **Auth** | Clerk | Latest | UI pronta, Google OAuth, Email/Password |
| **Database** | PostgreSQL | 16 | Robusto, open-source, sem vendor lock-in |
| **ORM** | Prisma | 6.x | Type-safe, migrations, excelente DX |
| **Frontend** | Next.js | 15.5.6 | App Router, API Routes, SSR |
| **Backend** | Python + Flask | 3.12 + 3.x | Gmail API, PDF processing |
| **Container** | Docker Compose | Latest | Orquestração local + VPS |
| **Proxy** | Traefik | 3.2 | SSL automático, reverse proxy |

---

## 🗄️ DATABASE DESIGN

### **PostgreSQL Container (Local Dev):**

```yaml
# docker-compose.dev.yml
services:
  postgres:
    image: postgres:16-alpine
    container_name: oficios-db
    environment:
      POSTGRES_USER: oficios
      POSTGRES_PASSWORD: dev_password_local
      POSTGRES_DB: oficios_db
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U oficios"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### **PostgreSQL na VPS (Produção):**

```yaml
# docker-compose.vps.yml
services:
  postgres:
    image: postgres:16-alpine
    container_name: oficios-db-prod
    environment:
      POSTGRES_USER: oficios_prod
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: oficios_prod
    volumes:
      - /var/lib/postgresql/data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - oficios-network
```

---

## 🔧 PRISMA SCHEMA

### **Schema Completo:**

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// CORE MODELS
// ============================================

model Oficio {
  id                String   @id @default(cuid())
  numero            String   @unique
  autoridade        String
  processo          String?
  assunto           String?
  prazo             DateTime
  status            OficioStatus @default(ATIVO)
  confianca         Int?     // 0-100, confiança da IA na extração
  
  // Dados extraídos pela IA
  dadosExtraidos    Json?
  
  // HITL (Human-in-the-Loop)
  aguardandoRevisao Boolean  @default(false)
  revisadoPor       String?  // Clerk userId
  revisadoEm        DateTime?
  
  // Anexos
  pdfUrl            String?
  pdfPath           String?
  
  // Timestamps
  criadoEm          DateTime @default(now())
  atualizadoEm      DateTime @updatedAt
  criadoPor         String   // Clerk userId
  
  // Relacionamentos
  logs              OficioLog[]
  notificacoes      Notificacao[]
  
  @@index([status])
  @@index([prazo])
  @@index([aguardandoRevisao])
  @@index([criadoPor])
  @@map("oficios")
}

enum OficioStatus {
  ATIVO
  EM_RISCO
  VENCIDO
  RESPONDIDO
  ARQUIVADO
}

model OficioLog {
  id          String   @id @default(cuid())
  oficioId    String
  oficio      Oficio   @relation(fields: [oficioId], references: [id], onDelete: Cascade)
  
  acao        String
  descricao   String?
  usuarioId   String   // Clerk userId
  dadosAntes  Json?
  dadosDepois Json?
  
  criadoEm    DateTime @default(now())
  
  @@index([oficioId])
  @@index([usuarioId])
  @@map("oficio_logs")
}

model Notificacao {
  id          String   @id @default(cuid())
  oficioId    String?
  oficio      Oficio?  @relation(fields: [oficioId], references: [id], onDelete: SetNull)
  
  tipo        NotificacaoTipo
  titulo      String
  mensagem    String
  lida        Boolean  @default(false)
  usuarioId   String   // Clerk userId
  
  criadoEm    DateTime @default(now())
  
  @@index([usuarioId])
  @@index([lida])
  @@map("notificacoes")
}

enum NotificacaoTipo {
  PRAZO_PROXIMO
  VENCIDO
  REVISAO_PENDENTE
  SISTEMA
}

// ============================================
// MCP & GMAIL SYNC
// ============================================

model MCPJob {
  id            String   @id @default(cuid())
  tipo          String   // 'gmail-sync', 'pdf-extract', etc.
  status        JobStatus @default(PENDING)
  
  parametros    Json?
  resultado     Json?
  erro          String?
  
  usuarioId     String   // Clerk userId
  
  iniciadoEm    DateTime @default(now())
  finalizadoEm  DateTime?
  
  @@index([usuarioId])
  @@index([status])
  @@map("mcp_jobs")
}

enum JobStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

model GmailSync {
  id            String   @id @default(cuid())
  emailId       String   @unique  // Gmail message ID
  
  from          String
  subject       String
  receivedAt    DateTime
  body          String?
  
  processado    Boolean  @default(false)
  oficioId      String?
  
  usuarioId     String   // Clerk userId
  
  sincronizadoEm DateTime @default(now())
  
  @@index([processado])
  @@index([usuarioId])
  @@map("gmail_syncs")
}

// ============================================
// USER PREFERENCES
// ============================================

model UserPreferences {
  id                String   @id @default(cuid())
  userId            String   @unique  // Clerk userId
  
  notificacaoEmail  Boolean  @default(true)
  notificacaoPush   Boolean  @default(false)
  temaEscuro        Boolean  @default(true)
  
  gmailConnected    Boolean  @default(false)
  gmailAccessToken  String?  @db.Text
  gmailRefreshToken String?  @db.Text
  
  configuracoes     Json?
  
  criadoEm          DateTime @default(now())
  atualizadoEm      DateTime @updatedAt
  
  @@map("user_preferences")
}
```

---

## 🔐 AUTENTICAÇÃO - CLERK

### **Configuração:**

```typescript
// src/middleware.ts (✅ JÁ CRIADO)
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();
```

```typescript
// src/app/layout.tsx (✅ JÁ ATUALIZADO)
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      {/* ... */}
    </ClerkProvider>
  );
}
```

### **Em APIs:**

```typescript
// src/app/api/oficios/route.ts
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const oficios = await prisma.oficio.findMany({
    where: { criadoPor: userId },
    orderBy: { criadoEm: 'desc' }
  });
  
  return NextResponse.json({ oficios });
}
```

---

## 📂 ESTRUTURA DE ARQUIVOS (Atualizada)

```
noficios/
├── oficios-portal-frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── oficios/route.ts        # CRUD oficios
│   │   │   │   ├── gmail/
│   │   │   │   │   └── sync/route.ts       # Sync Gmail
│   │   │   │   ├── hitl/route.ts           # HITL endpoints
│   │   │   │   └── webhook/                # Webhooks
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── login/page.tsx              # Clerk SignIn
│   │   │   ├── sign-up/[[...sign-up]]/page.tsx  # Clerk SignUp
│   │   │   └── layout.tsx                  # ClerkProvider
│   │   ├── lib/
│   │   │   ├── prisma.ts                   # Prisma client (NOVO!)
│   │   │   └── clerk-utils.ts              # Helpers Clerk
│   │   ├── middleware.ts                   # Clerk middleware (✅ CRIADO)
│   │   └── components/
│   ├── prisma/
│   │   ├── schema.prisma                   # Schema completo (NOVO!)
│   │   ├── migrations/                     # Migrations Prisma
│   │   └── seed.ts                         # Seed inicial
│   ├── package.json
│   └── .env.local                          # Clerk keys + DB URL
│
├── backend-simple/                         # Backend Python
│   ├── api.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.dev.yml                  # Local: Postgres + Backend + Frontend (NOVO!)
├── docker-compose.vps.yml                  # VPS: Postgres + Backend + Frontend
└── docs/
    └── architecture/
        └── NOVA_ARQUITETURA_CLERK_POSTGRES.md
```

---

## 🐳 DOCKER COMPOSE - LOCAL DEV

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # PostgreSQL Local
  postgres:
    image: postgres:16-alpine
    container_name: oficios-db-dev
    environment:
      POSTGRES_USER: oficios
      POSTGRES_PASSWORD: dev_password_2024
      POSTGRES_DB: oficios_db
    ports:
      - "5432:5432"
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U oficios -d oficios_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - oficios-dev

  # Backend Python
  backend:
    build:
      context: ./backend-simple
      dockerfile: Dockerfile
    container_name: oficios-backend-dev
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - DATABASE_URL=postgresql://oficios:dev_password_2024@postgres:5432/oficios_db
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - oficios-dev

  # PgAdmin (Opcional - UI para DB)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: oficios-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@oficios.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    networks:
      - oficios-dev

networks:
  oficios-dev:
    driver: bridge

volumes:
  postgres-dev-data:
```

---

## 🚀 DOCKER COMPOSE - VPS PRODUÇÃO

```yaml
# docker-compose.vps.yml (ATUALIZADO)
version: '3.8'

services:
  # PostgreSQL Produção
  postgres:
    image: postgres:16-alpine
    container_name: oficios-db-prod
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres-prod-data:/var/lib/postgresql/data
      - ./backups:/backups  # Backup manual
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 5
    restart: unless-stopped
    networks:
      - oficios-network

  # Backend Python
  backend-python:
    build:
      context: ./backend-simple
      dockerfile: Dockerfile
    container_name: oficios-backend-python
    expose:
      - "8000"
    environment:
      - PORT=8000
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - oficios-network
      - traefik-network
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=traefik-public"
      - "traefik.http.routers.backend.rule=Host(`api.oficio.ness.tec.br`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
      - "traefik.http.services.backend.loadbalancer.server.port=8000"

  # Frontend Next.js
  frontend:
    build:
      context: ./oficios-portal-frontend
      dockerfile: Dockerfile
    container_name: oficios-frontend
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - W0_GMAIL_INGEST_URL=http://backend-python:8000/gmail/ingest
    env_file:
      - ./oficios-portal-frontend/.env.production
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - oficios-network
      - traefik-network
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=traefik-public"
      - "traefik.http.routers.frontend.rule=Host(`oficio.ness.tec.br`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.frontend.loadbalancer.server.port=3000"

networks:
  oficios-network:
    driver: bridge
  traefik-network:
    external: true
    name: traefik-public

volumes:
  postgres-prod-data:
```

---

## 📋 VARIÁVEIS DE AMBIENTE

### **Frontend (.env.local - Local Dev):**

```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXX
CLERK_SECRET_KEY=sk_test_XXXXXXXXXX

# Database (via Prisma)
DATABASE_URL="postgresql://oficios:dev_password_2024@localhost:5432/oficios_db"

# Backend Python
W0_GMAIL_INGEST_URL=http://localhost:8000/gmail/ingest
```

### **Frontend (.env.production - VPS):**

```bash
# Clerk Auth (PRODUÇÃO - pegar do Clerk Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_XXXXXXXXXX
CLERK_SECRET_KEY=sk_live_XXXXXXXXXX

# Database (Prisma - container interno)
DATABASE_URL="postgresql://oficios_prod:SENHA_FORTE@postgres:5432/oficios_prod"

# Backend Python
W0_GMAIL_INGEST_URL=http://backend-python:8000/gmail/ingest
```

### **VPS Root (.env):**

```bash
# Database credentials
DB_USER=oficios_prod
DB_PASSWORD=SENHA_FORTE_AQUI
DB_NAME=oficios_prod
```

---

## 🔨 IMPLEMENTAÇÃO - PASSO A PASSO

### **Fase 1: Prisma Setup (2h)**

1. Instalar Prisma:
```bash
cd oficios-portal-frontend
npm install prisma @prisma/client
npx prisma init
```

2. Criar schema (`prisma/schema.prisma`)
3. Criar Prisma client (`src/lib/prisma.ts`)
4. Primeira migration:
```bash
npx prisma migrate dev --name init
```

### **Fase 2: Migrar APIs (4h)**

1. Substituir todos `createClient()` Supabase por Prisma
2. Atualizar hooks para usar Clerk
3. Remover `useAuthSupabase`
4. Criar novos hooks com Clerk + Prisma

### **Fase 3: Remover Supabase (1h)**

```bash
npm uninstall @supabase/auth-helpers-nextjs @supabase/ssr @supabase/supabase-js
```

### **Fase 4: Docker Local (30 min)**

1. Criar `docker-compose.dev.yml`
2. Subir PostgreSQL local
3. Rodar migrations
4. Testar conexão

### **Fase 5: Deploy VPS (1h)**

1. Atualizar `docker-compose.vps.yml`
2. Adicionar PostgreSQL container
3. Configurar backups
4. Deploy e testar

---

## 💾 BACKUP STRATEGY

### **Local (Dev):**
- Volume Docker (snapshot automático)
- Backup manual quando necessário

### **VPS (Prod):**

```bash
# Script de backup automático (cron diário)
#!/bin/bash
docker exec oficios-db-prod pg_dump -U oficios_prod oficios_prod \
  | gzip > /var/www/noficios/backups/backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Manter últimos 7 dias
find /var/www/noficios/backups -name "backup-*.sql.gz" -mtime +7 -delete
```

**Cron job:**
```cron
0 3 * * * /usr/local/bin/noficios-db-backup.sh >> /var/log/noficios-backup.log 2>&1
```

---

## 🔄 MIGRAÇÃO DE DADOS (Se necessário)

### **Se já tem dados no Neon/Supabase:**

```bash
# 1. Export do Neon
pg_dump -h NEON_HOST -U NEON_USER -d NEON_DB > dump.sql

# 2. Ajustar dump (trocar user_id Supabase por Clerk)
# Manual ou script Python

# 3. Import no PostgreSQL local
docker exec -i oficios-db-dev psql -U oficios -d oficios_db < dump-ajustado.sql
```

### **Se começar do zero:**
- Apenas rodar `prisma migrate dev`
- Seed inicial (se necessário)

---

## 📊 COMPARAÇÃO ARQUITETURAL

| Aspecto | v1.0 (Supabase) | v2.0 (Clerk + Postgres) |
|---------|-----------------|-------------------------|
| **Auth** | Supabase Auth | Clerk |
| **Database** | Neon (online) | PostgreSQL (Docker) |
| **ORM** | Supabase Client | Prisma |
| **Vendor Lock** | Alto (Supabase) | Zero (open-source) |
| **Custo** | $25/mês (Neon Pro) | $0 (self-hosted) |
| **Backup** | Neon automático | Script próprio |
| **Local Dev** | Neon online | Docker local |
| **Migrations** | Supabase | Prisma |
| **Type Safety** | Parcial | Total (Prisma) |

---

## ✅ VANTAGENS DA NOVA ARQUITETURA

1. **Zero Vendor Lock-in** - PostgreSQL é 100% portável
2. **Desenvolvimento Offline** - Database local via Docker
3. **Custo Zero** - Sem mensalidade de Neon
4. **Type Safety Completo** - Prisma gera tipos TypeScript
5. **Migrations Versionadas** - Controle total via Prisma
6. **Backup Simples** - pg_dump padrão
7. **Performance** - Database na mesma VPS (latência zero)
8. **Clerk UI** - Componentes prontos de login

---

## ⚠️ PONTOS DE ATENÇÃO

1. **Backup Manual** - Precisa configurar cron job
2. **Escalabilidade** - PostgreSQL em container tem limites
3. **Alta Disponibilidade** - Sem redundância automática
4. **Monitoramento DB** - Precisa adicionar (pg_stat)
5. **Clerk Free Tier** - Limite de 10k usuários/mês

---

## 📋 CHECKLIST DE MIGRAÇÃO

```
FASE 1 - SETUP PRISMA:
[ ] Instalar Prisma + client
[ ] Criar schema.prisma completo
[ ] Criar lib/prisma.ts
[ ] Rodar primeira migration

FASE 2 - DOCKER LOCAL:
[ ] Criar docker-compose.dev.yml
[ ] Subir PostgreSQL container
[ ] Testar conexão Prisma

FASE 3 - MIGRAR CÓDIGO:
[ ] Atualizar todas rotas API
[ ] Migrar hooks para Clerk
[ ] Remover useAuthSupabase
[ ] Criar novos hooks com Prisma

FASE 4 - REMOVER SUPABASE:
[ ] Desinstalar pacotes Supabase
[ ] Deletar lib/supabase.ts
[ ] Deletar hooks/useAuthSupabase.tsx
[ ] Limpar imports

FASE 5 - VPS:
[ ] Atualizar docker-compose.vps.yml
[ ] Adicionar container PostgreSQL
[ ] Configurar .env.production
[ ] Deploy e testar

FASE 6 - BACKUP:
[ ] Script de backup
[ ] Cron job diário
[ ] Testar restore
```

---

## ⏱️ ESTIMATIVA DE TEMPO

| Fase | Tempo | Prioridade |
|------|-------|------------|
| 1. Prisma Setup | 2h | 🔴 P0 |
| 2. Docker Local | 30 min | 🔴 P0 |
| 3. Migrar Código | 4h | 🔴 P0 |
| 4. Remover Supabase | 1h | 🟡 P1 |
| 5. Deploy VPS | 1h | 🟡 P1 |
| 6. Backup Config | 30 min | 🟢 P2 |
| **TOTAL** | **9 horas** | |

---

## 🎯 PRÓXIMOS PASSOS

### **Imediato:**
1. Criar `docker-compose.dev.yml`
2. Instalar Prisma
3. Criar schema completo
4. Primeira migration

### **Depois:**
5. Migrar todas APIs
6. Remover Supabase
7. Deploy VPS

**Quer que eu comece a implementação agora?** 🚀

---

**Winston | Architect | Nova Arquitetura Clerk + PostgreSQL**
