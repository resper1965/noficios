# 🔍 DIAGNÓSTICO - Por que dados não aparecem no Dashboard

## 🎯 **PROBLEMA**

Mesmo com dados no banco Supabase com status `AGUARDANDO_COMPLIANCE`, a seção HITL não aparece no dashboard.

---

## 🔎 **INVESTIGAÇÃO**

### **1. Código está deployado? ✅ SIM**
- Hook `useOficiosAguardandoRevisao.tsx` ✅ Presente
- Dashboard importa o hook ✅ Sim
- API `/api/webhook/oficios/list-pending` ✅ Deployada

### **2. Fluxo de dados:**

```typescript
// Dashboard
const { oficios: oficiosAguardandoRevisao, loading } = useOficiosAguardandoRevisao();

// Hook carrega dados
useEffect(() => {
  if (user) loadOficiosPendentes();
}, [user]);

// Chama API
const oficiosData = await apiClient.listPendingOficios();

// API Client
export const apiClient = {
  async listPendingOficios() {
    const response = await authenticatedFetch('/api/webhook/oficios/list-pending');
    const data = await response.json();
    return data.oficios || [];
  }
}

// API Route: /api/webhook/oficios/list-pending
export async function GET(request) {
  // 1. Tenta Backend Python
  // 2. Se falhar → Fallback Supabase
  
  // FALLBACK SUPABASE:
  const { data: oficios } = await supabase
    .from('oficios')
    .select('*')
    .eq('userId', user.id)  // ← PROBLEMA POTENCIAL!
    .eq('status', 'AGUARDANDO_COMPLIANCE')
    .order('createdAt', { ascending: false });
}
```

---

## 🔴 **CAUSA RAIZ PROVÁVEL**

### **Problema: Campo `userId` não bate!**

**No SQL de popular dados:**
```sql
"userId", (SELECT id FROM auth.users LIMIT 1)
```

**Na API:**
```typescript
.eq('userId', user.id)
```

**Se o user.id da sessão ≠ userId do ofício → Zero resultados!**

---

## ✅ **SOLUÇÕES**

### **Solução 1: Verificar userId no banco** (Rápido)

Execute no Supabase SQL Editor:

```sql
-- Ver qual userId está nos ofícios
SELECT oficio_id, numero, "userId", status 
FROM oficios 
WHERE status = 'AGUARDANDO_COMPLIANCE';

-- Ver qual é seu user.id atual
SELECT id, email FROM auth.users;

-- Se forem diferentes, UPDATE:
UPDATE oficios
SET "userId" = '<seu_user_id_aqui>'
WHERE status = 'AGUARDANDO_COMPLIANCE';
```

---

### **Solução 2: API mais permissiva** (Temporário para debug)

Modificar API para retornar TODOS os ofícios (sem filtrar por userId):

```typescript
// src/app/api/webhook/oficios/list-pending/route.ts
const { data: oficios } = await supabase
  .from('oficios')
  .select('*')
  // .eq('userId', user.id)  // ← COMENTAR TEMPORARIAMENTE
  .eq('status', 'AGUARDANDO_COMPLIANCE')
  .order('createdAt', { ascending: false });
```

---

### **Solução 3: SQL melhor** (Correto)

Usar o userId do usuário logado:

```sql
-- Popular com SEU userId real
INSERT INTO oficios (..., "userId", ...)
VALUES (..., '<copiar_seu_user_id_do_auth>', ...);

-- Para descobrir seu userId:
-- 1. Fazer login no app
-- 2. Abrir Console do navegador (F12)
-- 3. Application → Local Storage → supabase.auth.token
-- 4. Copiar o "sub" (user id)
```

---

## 🧪 **TESTE RÁPIDO**

**Para confirmar o problema:**

Execute no Supabase SQL Editor:

```sql
-- Teste 1: Tem ofícios AGUARDANDO_COMPLIANCE?
SELECT COUNT(*) as total 
FROM oficios 
WHERE status = 'AGUARDANDO_COMPLIANCE';

-- Se retornar 0 → Problema: não tem dados
-- Se retornar >0 → Problema é userId ou query

-- Teste 2: Qual userId está nos ofícios?
SELECT DISTINCT "userId" 
FROM oficios 
WHERE status = 'AGUARDANDO_COMPLIANCE';

-- Teste 3: Tem dados no banco em geral?
SELECT COUNT(*) FROM oficios;

-- Teste 4: Ver todos campos
SELECT * FROM oficios LIMIT 5;
```

---

## 🎯 **PRÓXIMO PASSO**

**Execute agora no Supabase SQL Editor:**

```sql
-- Ver se tem dados e com qual userId
SELECT 
  oficio_id,
  numero,
  "userId",
  status,
  confianca_ia,
  "createdAt"
FROM oficios
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Me diga o resultado e vou ajustar!** 📊

---

**Suspeita:** userId dos ofícios ≠ userId do usuário logado
