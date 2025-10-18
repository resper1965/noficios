# 🧪 TESTE RÁPIDO - Verificar Portal HITL

## 🎯 **PROBLEMA**

Dados não aparecem no dashboard mesmo após deploy.

---

## 🔍 **DIAGNÓSTICO RÁPIDO**

### **Execute no Supabase SQL Editor:**

**Link:** https://app.supabase.com/project/ghcqywthubgfenqqxoqb/sql/new

**SQL:**
```sql
-- 1. Tem dados?
SELECT COUNT(*) FROM oficios;

-- 2. Tem status AGUARDANDO_COMPLIANCE?
SELECT COUNT(*) FROM oficios WHERE status = 'AGUARDANDO_COMPLIANCE';

-- 3. Qual seu user ID?
SELECT id, email FROM auth.users;

-- 4. Ver TODOS os ofícios (ignorar userId)
SELECT 
  oficio_id,
  numero,
  "userId",
  status,
  confianca_ia
FROM oficios
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## 💡 **RESULTADO ESPERADO**

### **Se COUNT = 0:**
→ Não tem dados! Execute `POPULAR_DADOS_HITL.sql`

### **Se COUNT > 0 mas userId diferente:**
→ Execute:
```sql
UPDATE oficios 
SET "userId" = 'SEU_USER_ID' 
WHERE status = 'AGUARDANDO_COMPLIANCE';
```

### **Se COUNT > 0 e userId correto:**
→ Problema é na API ou no hook

---

## 🚀 **TESTE ALTERNATIVO (Sem depender de dados)**

Acesse diretamente o Portal HITL com ID mock:

```
https://oficio.ness.tec.br/revisao/mock-1
```

**O que deve aparecer:**
- Wizard 4 passos
- Mensagem de erro "Ofício não encontrado"
- Botão "Voltar ao Dashboard"

**Se NÃO aparecer nada:**
→ Problema no deployment do código

---

## 📝 **CHECKLIST**

Execute NA ORDEM:

- [ ] 1. Acessar https://oficio.ness.tec.br/login
- [ ] 2. Fazer login
- [ ] 3. Ir para https://oficio.ness.tec.br/dashboard
- [ ] 4. Abrir Console (F12)
- [ ] 5. Ver tab Network
- [ ] 6. Refresh página
- [ ] 7. Procurar por "list-pending" nas chamadas
- [ ] 8. Ver resposta da API

**Se não aparecer chamada "list-pending":**
→ Hook não está executando

**Se aparecer e retornar `{ oficios: [], count: 0 }`:**
→ Query não encontra dados (problema de userId)

**Se aparecer erro 401:**
→ Problema de autenticação

---

## 🎯 **PRÓXIMO PASSO IMEDIATO**

**Faça isto agora:**

1. Abra https://oficio.ness.tec.br/dashboard
2. Abra Console (F12)
3. Tab Network
4. Refresh (F5)
5. Procure por "list-pending"
6. Me diga o que apareceu!

**Ou simplesmente execute os SQLs de verificação e me diga os resultados!** 📊

