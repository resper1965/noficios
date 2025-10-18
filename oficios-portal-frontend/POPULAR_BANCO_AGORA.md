# 📊 POPULAR BANCO DE DADOS - n.Oficios

## 🚨 PROBLEMA IDENTIFICADO:
A tabela `oficios` está **vazia** (0 registros). Por isso o dashboard não mostra dados.

---

## ✅ SOLUÇÃO RÁPIDA (2 minutos):

### PASSO 1: Abrir SQL Editor do Supabase

👉 **https://supabase.com/dashboard/project/ghcqywthubgfenqqxoqb/sql/new**

---

### PASSO 2: Copiar e Executar este SQL

```sql
-- Inserir dados de teste realistas
INSERT INTO oficios (numero, processo, autoridade, status, prazo, descricao, "userId", "createdAt")
VALUES
-- OFÍCIOS ATIVOS URGENTES
('2024/00123', '0001234-56.2024.4.01.3800', 'Tribunal Regional Federal da 1ª Região', 'ativo', 
  (NOW() + INTERVAL '1 day')::TIMESTAMPTZ, 
  'Requisição de informações processuais sobre APF nº 2024.38.00.001234-5.', 
  'resper@bekaa.eu', NOW() - INTERVAL '5 days'),

('2024/00124', '0002345-67.2024.8.26.0100', 'Tribunal de Justiça de São Paulo', 'ativo', 
  NOW()::TIMESTAMPTZ, 
  'Ofício requisitório solicitando cópia integral dos autos.', 
  'resper@bekaa.eu', NOW() - INTERVAL '10 days'),

-- OFÍCIOS ATIVOS PRAZO MÉDIO
('2024/00125', '0003456-78.2024.5.02.0000', 'Tribunal Regional do Trabalho da 2ª Região', 'ativo', 
  (NOW() + INTERVAL '5 days')::TIMESTAMPTZ, 
  'Comunicação de redistribuição de processo.', 
  'resper@bekaa.eu', NOW() - INTERVAL '2 days'),

('2024/00126', '0004567-89.2024.3.00.0000', 'Tribunal Regional Eleitoral de SP', 'ativo', 
  (NOW() + INTERVAL '7 days')::TIMESTAMPTZ, 
  'Pedido de informações sobre registro de candidatura.', 
  'resper@bekaa.eu', NOW() - INTERVAL '1 day'),

-- OFÍCIOS VENCIDOS
('2024/00110', '0008901-23.2024.4.02.5101', 'Tribunal Regional Federal da 2ª Região', 'vencido', 
  (NOW() - INTERVAL '2 days')::TIMESTAMPTZ, 
  'Intimação para manifestação - VENCIDO', 
  'resper@bekaa.eu', NOW() - INTERVAL '30 days'),

('2024/00111', '0009012-34.2024.8.07.0000', 'Tribunal de Justiça do DF', 'vencido', 
  (NOW() - INTERVAL '5 days')::TIMESTAMPTZ, 
  'Requisição de esclarecimentos - VENCIDO', 
  'resper@bekaa.eu', NOW() - INTERVAL '25 days'),

-- OFÍCIOS RESPONDIDOS
('2024/00100', '0001234-56.2024.4.04.7100', 'Tribunal Regional Federal da 4ª Região', 'respondido', 
  (NOW() - INTERVAL '10 days')::TIMESTAMPTZ, 
  'Pedido de vista dos autos - CONCLUÍDO',
  'resper@bekaa.eu', NOW() - INTERVAL '40 days'),

('2024/00101', '0002345-67.2024.8.09.0051', 'Tribunal de Justiça do Paraná', 'respondido', 
  (NOW() - INTERVAL '20 days')::TIMESTAMPTZ, 
  'Intimação para certidões - ATENDIDO',
  'resper@bekaa.eu', NOW() - INTERVAL '50 days');

-- Verificar dados inseridos
SELECT 
  numero,
  status,
  ROUND(EXTRACT(EPOCH FROM (prazo - NOW())) / 86400) as dias_restantes
FROM oficios
WHERE "userId" = 'resper@bekaa.eu'
ORDER BY prazo ASC;
```

---

### PASSO 3: Executar

1. Cole o SQL acima no editor
2. Clique no botão **"RUN"** (Executar)
3. Aguarde confirmação

---

### PASSO 4: Verificar

Você deve ver:
```
✅ 8 rows inserted
```

E a tabela de verificação mostrando os ofícios.

---

## 🧪 TESTAR

1. Acesse: https://oficio.ness.tec.br/dashboard
2. ✅ Deve mostrar:
   - 4 ofícios ativos
   - 2 ofícios vencidos
   - 2 ofícios respondidos
   - Notificações no sino 🔔

---

## ⚠️ IMPORTANTE

**Use seu email:** `resper@bekaa.eu`

Os dados estão configurados para este email. Se você fizer login com outro email, não verá nada (isso é correto - isolamento RLS funcionando!)

---

## 🔧 SE PRECISAR TROCAR O EMAIL

Substitua todas as ocorrências de `'resper@bekaa.eu'` pelo email que você está usando para login.

---

**Execute o SQL agora e recarregue o dashboard!** 🚀

