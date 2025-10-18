# 🔍 DIAGNÓSTICO COMPLETO - n.Oficios

## 📊 **Status Atual**
- ✅ **Frontend**: Funcionando (Next.js 15.5.6)
- ✅ **Autenticação**: Funcionando (usuário "Ricardo E" logado)
- ❌ **Dados**: Contadores zerados (0 ofícios)

## 🎯 **Problema Identificado**
O dashboard mostra **"Nenhum ofício cadastrado ainda"** porque:

1. **Banco Supabase vazio** ou
2. **Dados não associados ao usuário correto** ou  
3. **API não está retornando dados**

## 🔧 **Soluções Imediatas**

### **1. Verificar Banco Supabase**
Execute no **Supabase SQL Editor**:

```sql
-- Verificar se há dados
SELECT COUNT(*) as total_oficios FROM oficios;

-- Verificar usuários
SELECT id, email FROM auth.users;

-- Verificar ofícios por usuário
SELECT 
  o.id, 
  o.numero_oficio, 
  o.status,
  o.user_id,
  u.email
FROM oficios o
LEFT JOIN auth.users u ON o.user_id = u.id;
```

### **2. Popular Dados de Teste**
Se o banco estiver vazio, execute:

```sql
-- Inserir dados de teste
INSERT INTO oficios (
  numero_oficio, 
  autoridade_emissora, 
  prazo_resposta, 
  status, 
  user_id,
  dados_extraidos,
  confianca_geral
) VALUES 
(
  'OF-2024-001',
  'Tribunal de Justiça - 1ª Vara Cível',
  '2024-11-15',
  'AGUARDANDO_COMPLIANCE',
  (SELECT id FROM auth.users WHERE email = 'resper@bekaa.eu' LIMIT 1),
  '{"numero_oficio": "OF-2024-001", "autoridade_emissora": "Tribunal de Justiça - 1ª Vara Cível", "prazo_resposta": "2024-11-15", "classificacao_intencao": "Intimação para cumprimento de sentença"}',
  85
),
(
  'OF-2024-002', 
  'Ministério Público - Promotoria Criminal',
  '2024-11-20',
  'AGUARDANDO_COMPLIANCE',
  (SELECT id FROM auth.users WHERE email = 'resper@bekaa.eu' LIMIT 1),
  '{"numero_oficio": "OF-2024-002", "autoridade_emissora": "Ministério Público - Promotoria Criminal", "prazo_resposta": "2024-11-20", "classificacao_intencao": "Intimação para audiência"}',
  92
);
```

### **3. Testar API Diretamente**
Acesse no navegador:
```
https://oficio.ness.tec.br/api/webhook/oficios/list-pending
```

## 🚀 **Próximos Passos**

1. **Execute os SQLs acima no Supabase**
2. **Recarregue a página do dashboard**
3. **Verifique se os contadores aparecem**
4. **Teste o fluxo HITL completo**

## 📍 **Localização dos Dados**

### **VPS** (`/opt/oficios/`)
- Frontend: `oficios-portal-frontend/`
- Backend: `oficios-automation/`
- Config: `.env`
- Logs: `docker compose logs oficios-frontend`

### **Supabase**
- Tabela: `oficios`
- Storage: `oficios-anexos`
- Auth: `auth.users`

### **Google Cloud**
- Firestore: Sincronização
- Functions: Processamento AI
- Vision: OCR

## 🎯 **Resultado Esperado**
Após executar os SQLs, você deve ver:
- ✅ Contadores preenchidos no dashboard
- ✅ Seção "Ofícios Aguardando Revisão" 
- ✅ Fluxo HITL funcionando
