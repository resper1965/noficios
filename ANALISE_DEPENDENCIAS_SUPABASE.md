# 🔍 ANÁLISE COMPLETA - Dependências Supabase/Neon

**Architect:** Winston  
**Data:** 21 de Outubro de 2025  
**Análise:** Identificar TODAS dependências para remoção

---

## 📊 RESUMO EXECUTIVO

**Total encontrado:** 142 arquivos com referências
**Críticos (código):** 15 arquivos
**Documentação:** 127 arquivos

---

## 🔴 ARQUIVOS CRÍTICOS (Código-fonte)

### **1. APIs - 8 arquivos**

```
/src/app/api/health/route.ts
/src/app/api/gmail/auto-sync/route.ts
/src/app/api/mcp/status/[jobId]/route.ts
/src/app/api/mcp/history/route.ts
/src/app/api/webhook/oficios/route.ts
/src/app/api/webhook/oficios/get/route.ts
/src/app/api/webhook/oficios/list-pending/route.ts
/src/app/api/usuarios/route.ts
```

**Ação:** Migrar para `auth()` do Clerk + Prisma

---

### **2. Hooks - 4 arquivos**

```
/src/hooks/useAuthSupabase.tsx          ❌ DELETAR
/src/hooks/useOficios.tsx               🔄 Migrar Prisma
/src/hooks/useOficiosAguardandoRevisao.tsx  🔄 Migrar Prisma
/src/hooks/useNotificacoes.tsx          🔄 Migrar Prisma
```

**Ação:** Criar novos hooks com Clerk + Prisma

---

### **3. Libs - 2 arquivos**

```
/src/lib/supabase.ts                    ❌ DELETAR
/src/lib/api-client.ts                  🔄 Remover Supabase
```

**Ação:** Deletar ou limpar

---

### **4. Componentes - 1 arquivo**

```
/src/components/hitl/ComplianceReviewForm.tsx  🔄 Migrar Prisma
```

**Ação:** Usar Prisma para save

---

### **5. Tests - 1 arquivo**

```
/src/__tests__/setup.ts                 🔄 Remover Supabase mock
```

**Ação:** Atualizar para Prisma

---

### **6. Services - 1 arquivo**

```
/src/services/mcp/MCPExecutor.ts        🔄 Migrar Prisma
```

**Ação:** Trocar Supabase por Prisma

---

### **7. Package.json**

```json
"@supabase/auth-helpers-nextjs": "^0.10.0",
"@supabase/ssr": "^0.7.0",
"@supabase/supabase-js": "^2.75.1",
```

**Ação:** Desinstalar após migração completa

---

## 📁 ARQUIVOS DE CONFIGURAÇÃO

### **Docker Compose:**

```
✅ docker-compose.dev.yml      - Criado (PostgreSQL)
⚠️ docker-compose.vps.yml      - Precisa adicionar PostgreSQL
```

### **Env Files (VPS):**

```
⚠️ .env.production - Precisa trocar SUPABASE_* por DATABASE_URL
```

---

## 📝 ARQUIVOS DE DOCUMENTAÇÃO (127)

**Ação:** Arquivar ou atualizar conforme necessário

Exemplos:
- `SUPABASE_SETUP.md`
- `AUTENTICACAO_SUPABASE.md`
- `supabase-setup.sql`
- `POPULAR_DADOS_TESTE.sql` (usa Supabase)
- etc...

**Recomendação:** Mover para pasta `docs/archive/v1-supabase/`

---

## 🎯 ANÁLISE POR CATEGORIA

### **A. AUTENTICAÇÃO (100% Supabase → Clerk)**

**Arquivos afetados:**
1. `src/hooks/useAuthSupabase.tsx` ❌ DELETAR
2. `src/app/login/page.tsx` ✅ MIGRADO
3. `src/app/layout.tsx` ✅ MIGRADO
4. `src/middleware.ts` ✅ CRIADO
5. Todas APIs com `supabase.auth.getUser()` 🔄 MIGRAR

**Status:** 60% completo (layout + middleware OK)

---

### **B. DATABASE (100% Supabase Client → Prisma)**

**Padrão Atual (Supabase):**
```typescript
const supabase = createClient(url, key);
const { data } = await supabase
  .from('oficios')
  .select('*')
  .eq('user_id', userId);
```

**Padrão Novo (Prisma):**
```typescript
const oficios = await prisma.oficio.findMany({
  where: { criadoPor: userId }
});
```

**Arquivos afetados:** Todos os 8 arquivos de API + 4 hooks

**Status:** 0% completo

---

### **C. STORAGE (Supabase Storage → ?)** 

**Arquivo:** `src/lib/storage.ts`

**Decisão necessária:**
- Upload PDFs onde?
- Opções: S3, Local filesystem, Cloud Storage

**Status:** Precisa definição

---

## ⚠️ DEPENDÊNCIAS OCULTAS

### **1. Firebase/Firestore**

Encontrado em `package.json`:
```json
"firebase": "^12.4.0",
"firebase-admin": "^13.5.0",
```

**Questão:** Isso ainda é usado?

**Arquivos:**
- `src/lib/firebase-auth.ts`
- `src/app/api/auth/sync-firebase/route.ts`

---

### **2. Python Backend**

**Arquivo:** `backend-simple/requirements.txt`

Contém `psycopg2` ou similar para PostgreSQL?

**Ação:** Verificar e atualizar

---

## 📋 PLANO DE REMOÇÃO SISTEMÁTICA

### **FASE 1: Preparação (2h)**

```
✅ 1.1 docker-compose.dev.yml criado
✅ 1.2 Prisma instalado
⏳ 1.3 Schema Prisma completo
⏳ 1.4 lib/prisma.ts criado
⏳ 1.5 Primeira migration rodada
⏳ 1.6 PostgreSQL local UP
```

---

### **FASE 2: Migração Backend (4h)**

```
⏳ 2.1 Migrar 8 rotas API
⏳ 2.2 Migrar MCPExecutor
⏳ 2.3 Migrar ComplianceReviewForm
⏳ 2.4 Atualizar api-client.ts
⏳ 2.5 Testar cada endpoint
```

---

### **FASE 3: Migração Frontend (3h)**

```
⏳ 3.1 Criar useOficios com Prisma
⏳ 3.2 Criar useOficiosAguardandoRevisao
⏳ 3.3 Criar useNotificacoes
⏳ 3.4 Atualizar dashboard/page.tsx
⏳ 3.5 Atualizar oficios/page.tsx
⏳ 3.6 Atualizar revisao/[id]/page.tsx
```

---

### **FASE 4: Limpeza (1h)**

```
⏳ 4.1 Deletar useAuthSupabase.tsx
⏳ 4.2 Deletar lib/supabase.ts
⏳ 4.3 Desinstalar pacotes Supabase
⏳ 4.4 Remover imports não usados
⏳ 4.5 Atualizar tests/setup.ts
```

---

### **FASE 5: Produção (2h)**

```
⏳ 5.1 Atualizar docker-compose.vps.yml
⏳ 5.2 Configurar .env.production
⏳ 5.3 Deploy PostgreSQL na VPS
⏳ 5.4 Rodar migrations prod
⏳ 5.5 Deploy frontend/backend
⏳ 5.6 Testes E2E
```

---

## 🚨 BREAKING CHANGES IDENTIFICADOS

### **1. User IDs Mudaram**

**Supabase:** UUID v4 (`123e4567-e89b-12d3-a456-426614174000`)
**Clerk:** Custom format (`user_2xxx...`)

**Impacto:** Todos registros com `user_id` ou `criadoPor`

**Solução:**
- Se tem dados: Script de migração
- Se não tem: Começar do zero ✅ RECOMENDADO

---

### **2. Auth Flow Diferente**

**Supabase:** `signInWithOAuth('google')`
**Clerk:** `<SignInButton />` ou `<SignIn />`

**Impacto:** Login/SignUp pages

**Solução:** ✅ Já migrado parcialmente

---

### **3. Database Client Diferente**

**Supabase:** `.from().select().eq()`
**Prisma:** `.findMany({ where: {} })`

**Impacto:** Todas queries

**Solução:** Migração manual sistemática

---

## 📊 MATRIZ DE DEPENDÊNCIAS

| Arquivo | Supabase Auth | Supabase DB | Prioridade | Status |
|---------|---------------|-------------|------------|--------|
| `layout.tsx` | ✅ | - | P0 | ✅ Migrado |
| `middleware.ts` | ✅ | - | P0 | ✅ Criado |
| `login/page.tsx` | ✅ | - | P0 | ✅ Migrado |
| `useAuthSupabase.tsx` | ✅ | - | P0 | ❌ Deletar |
| `lib/supabase.ts` | ✅ | ✅ | P0 | ❌ Deletar |
| `/api/health/route.ts` | - | ✅ | P1 | ⏳ Migrar |
| `/api/webhook/oficios/route.ts` | ✅ | ✅ | P1 | ⏳ Migrar |
| `useOficios.tsx` | - | ✅ | P1 | ⏳ Migrar |
| `dashboard/page.tsx` | ✅ | ✅ | P1 | ⏳ Migrar |
| Outros 7 arquivos | ✅/- | ✅ | P2 | ⏳ Migrar |

---

## 🔧 DECISÕES ARQUITETURAIS NECESSÁRIAS

### **1. Storage de PDFs**

**Supabase tinha:** `.storage.from('oficios')`

**Opções:**
1. **Local Filesystem** - Simples, grátis, backup manual
2. **S3/R2** - Escalável, CDN, custo
3. **Cloud Storage** - Similar S3

**Recomendação Winston:** Local filesystem inicialmente

```typescript
// src/lib/storage.ts (novo)
import fs from 'fs/promises';
import path from 'path';

export async function savePDF(file: File, oficioId: string) {
  const uploadDir = process.env.UPLOADS_DIR || './uploads/pdfs';
  const filename = `${oficioId}-${Date.now()}.pdf`;
  const filepath = path.join(uploadDir, filename);
  
  await fs.writeFile(filepath, Buffer.from(await file.arrayBuffer()));
  
  return `/uploads/pdfs/${filename}`;
}
```

---

### **2. Firebase - Ainda Usado?**

Encontrei:
```json
"firebase": "^12.4.0",
"firebase-admin": "^13.5.0",
```

**Arquivos:**
- `src/lib/firebase-auth.ts`
- `src/app/api/auth/sync-firebase/route.ts`

**Questão:** Firebase é usado? Ou é legacy?

**Recomendação:** Se não usado, remover também

---

### **3. MCP Jobs - Como armazenar?**

Atualmente usa Supabase.

**Opção 1:** Prisma (banco)
**Opção 2:** Redis (cache)
**Opção 3:** Filesystem (JSON)

**Recomendação:** Prisma (já teremos schema `MCPJob`)

---

## ✅ VERIFICAÇÃO DE COMPLETUDE

### **Código-fonte TypeScript:**

```bash
# Busca completa
grep -r "supabase" oficios-portal-frontend/src/*.{ts,tsx} --include="*.ts" --include="*.tsx"

# Resultado esperado após migração: 0 matches
```

### **Dependências:**

```bash
# package.json
grep "@supabase" oficios-portal-frontend/package.json

# Resultado esperado: 0 matches
```

### **Environment:**

```bash
# Env files
grep -i "supabase\|neon" oficios-portal-frontend/.env*

# Resultado esperado: 0 matches
```

---

## 🎯 PRÓXIMA AÇÃO RECOMENDADA

Antes de continuar migração, preciso de 3 decisões:

**1. Dados existentes?**
- [ ] Sim, migrar do Neon
- [ ] Não, começar do zero ✅ Recomendado

**2. Firebase?**
- [ ] Usado, manter
- [ ] Legacy, remover ✅ Provável

**3. Storage PDFs?**
- [ ] Local filesystem ✅ Recomendado
- [ ] S3/Cloud

**Quer que eu proceda com recomendações (zero dados + remover Firebase + local storage)?**

---

**Winston | Análise Completa | 142 arquivos identificados**
