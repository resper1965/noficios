# 🔐 Migração para Clerk - n.Oficios

**Data:** 21 de Outubro de 2025  
**Motivo:** Substituir Supabase Auth por Clerk para autenticação

---

## ✅ O QUE FOI FEITO

### **1. Instalação do Clerk (✅ Completo)**
```bash
npm install @clerk/nextjs@latest
```

**Versão instalada:** Latest (13 pacotes adicionados)

---

### **2. Middleware Criado (✅ Completo)**

**Arquivo:** `src/middleware.ts`

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**✅ Usa `clerkMiddleware()` (NÃO `authMiddleware()` - deprecated)**

---

### **3. Layout Atualizado (✅ Completo)**

**Arquivo:** `src/app/layout.tsx`

**Mudanças:**
- ✅ Removido: `AuthProvider` do Supabase
- ✅ Adicionado: `<ClerkProvider>` envolvendo toda aplicação
- ✅ Import: `@clerk/nextjs` (NÃO pages router)

---

### **4. Variáveis de Ambiente (✅ Configurado)**

**Arquivo criado:** `.env.local.example` (com placeholders)

**Variáveis necessárias:**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
```

**🔒 Segurança:**
- `.env*` já está no `.gitignore` ✅
- Apenas placeholders em arquivos tracked ✅
- Keys reais devem ir em `.env.local` (não commitado) ✅

---

## ⏳ PENDENTE (Próximos Passos)

### **5. Migrar Componentes UI (Pendente)**

Atualizar componentes que usam autenticação:

```typescript
// Trocar:
import { useAuthSupabase } from '@/hooks/useAuthSupabase';

// Por:
import { useUser, useAuth } from '@clerk/nextjs';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
```

**Componentes a atualizar:**
- [ ] Header/Navbar
- [ ] Dashboard
- [ ] Páginas protegidas

---

### **6. Migrar Rotas API (Pendente)**

Atualizar APIs que verificam autenticação:

```typescript
// Trocar:
import { createClient } from '@supabase/supabase-js';

// Por:
import { auth } from '@clerk/nextjs/server';

// Uso:
export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ...
}
```

**APIs a atualizar:**
- [ ] `/api/health`
- [ ] `/api/gmail/*`
- [ ] `/api/mcp/*`
- [ ] Outras rotas protegidas

---

### **7. Atualizar Database Schema (Pendente)**

Clerk usa `userId` (string) como identificador.

**Opções:**
1. **Migrar dados:** Mapear usuários Supabase → Clerk
2. **Dual auth temporário:** Manter ambos durante transição
3. **Restart:** Começar do zero (se aceitável)

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### **✅ Implementado:**
- [x] Clerk SDK instalado
- [x] `middleware.ts` com `clerkMiddleware()` criado
- [x] `<ClerkProvider>` no layout
- [x] `.env.local.example` criado
- [x] `.gitignore` protegendo `.env*`

### **⏳ Pendente:**
- [ ] Componentes UI migrados
- [ ] Rotas API migradas
- [ ] Database schema atualizado
- [ ] Testes de autenticação
- [ ] Documentação usuário atualizada

---

## 🔧 CONFIGURAÇÃO CLERK (Usuário)

### **Passo 1: Criar Conta Clerk**

1. Acesse: https://dashboard.clerk.com
2. Crie uma conta
3. Crie um novo "Application"
4. Nome: "n.Oficios"

### **Passo 2: Copiar Keys**

1. Vá em: **API Keys** (sidebar)
2. Copie:
   - `Publishable key`
   - `Secret key`

### **Passo 3: Configurar .env.local**

Crie arquivo `.env.local` no frontend:

```bash
cd oficios-portal-frontend
nano .env.local
```

Cole:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXX
CLERK_SECRET_KEY=sk_test_XXXXXXXXXX
W0_GMAIL_INGEST_URL=http://backend-python:8000/gmail/ingest
```

### **Passo 4: Configurar Providers**

No Clerk Dashboard:
1. **User & Authentication** → **Social Connections**
2. Ative: **Google**
3. Configure OAuth credentials (ou use Clerk's dev keys)

### **Passo 5: Testar**

```bash
cd oficios-portal-frontend
npm run dev
```

Acesse: http://localhost:3000

---

## 🚨 BREAKING CHANGES

### **O que VAI QUEBRAR:**

1. **Login atual não funcionará**
   - Supabase Auth será substituído
   - Usuários precisam fazer novo cadastro

2. **Sessões existentes inválidas**
   - Tokens Supabase não são compatíveis
   - Logout automático de todos

3. **Database user_id**
   - `userId` do Clerk é diferente do Supabase
   - Dados associados a usuários precisam migração

---

## 📊 COMPARAÇÃO

| Aspecto | Supabase Auth | Clerk |
|---------|---------------|-------|
| Provider | Supabase | Clerk |
| Auth Method | Google OAuth | Google + Muitos |
| UI | Custom | Pre-built |
| Middleware | Custom | `clerkMiddleware()` |
| Hooks | `useAuthSupabase` | `useUser()`, `useAuth()` |
| API Auth | Supabase client | `auth()` do Clerk |
| Free Tier | 50k users | 10k users |

---

## 🎯 PRÓXIMAS AÇÕES

### **Imediato:**
1. Usuário configura Clerk Dashboard
2. Usuário adiciona keys no `.env.local`
3. Migrar componentes UI

### **Logo após:**
4. Migrar rotas API
5. Testar fluxo completo
6. Atualizar documentação

### **Futuro:**
7. Migrar dados de usuários (se necessário)
8. Desativar Supabase Auth
9. Remover dependências Supabase

---

## 📝 COMANDOS ÚTEIS

```bash
# Build local
cd oficios-portal-frontend
npm run build

# Dev mode
npm run dev

# Remover Supabase (depois de migração completa)
npm uninstall @supabase/auth-helpers-nextjs @supabase/ssr @supabase/supabase-js
```

---

## ✅ VERIFICAÇÃO CLERK (AI Models)

### **✅ Checks Passados:**
1. ✅ `clerkMiddleware()` usado (não `authMiddleware()`)
2. ✅ `<ClerkProvider>` no layout (não `_app.tsx`)
3. ✅ Imports de `@clerk/nextjs` (correto para App Router)
4. ✅ App Router usado (não Pages Router)
5. ✅ Placeholders nas variáveis (não keys reais)
6. ✅ `.env*` no `.gitignore`

---

## 🏆 STATUS

**Migração:** 50% completa

- ✅ Infraestrutura Clerk
- ⏳ Componentes UI
- ⏳ Rotas API
- ⏳ Testes

**Próximo:** Migrar componentes UI + APIs

---

**Team All BMAD | Migração Clerk | App Router Compliant** ✅
