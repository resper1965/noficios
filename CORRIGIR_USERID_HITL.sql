-- 🔧 CORRIGIR userId dos Ofícios para o Usuário Logado
-- Execute este SQL no Supabase SQL Editor

-- PASSO 1: Ver quantos ofícios existem
SELECT COUNT(*) as total_oficios FROM oficios;

-- PASSO 2: Ver quais userIds estão nos ofícios
SELECT DISTINCT "userId", COUNT(*) as quantidade
FROM oficios
GROUP BY "userId";

-- PASSO 3: Ver usuários autenticados
SELECT id, email FROM auth.users;

-- PASSO 4: ATUALIZAR todos ofícios para o primeiro usuário
-- ⚠️ Use com cuidado! Isso atribui TODOS os ofícios ao primeiro usuário
UPDATE oficios
SET "userId" = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
WHERE "userId" IS NULL OR "userId" NOT IN (SELECT id FROM auth.users);

-- PASSO 5: Verificar correção
SELECT 
  oficio_id,
  numero,
  "userId",
  status,
  confianca_ia
FROM oficios
WHERE status = 'AGUARDANDO_COMPLIANCE';

-- RESULTADO ESPERADO: Deve mostrar seus ofícios com userId correto

