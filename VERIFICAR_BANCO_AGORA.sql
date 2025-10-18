-- 🔍 VERIFICAR DADOS NO BANCO - Execute no Supabase SQL Editor
-- https://app.supabase.com/project/ghcqywthubgfenqqxoqb/sql/new

-- 1️⃣ TEM DADOS NA TABELA OFICIOS?
SELECT COUNT(*) as total_oficios FROM oficios;
-- Esperado: > 0

-- 2️⃣ TEM OFÍCIOS COM STATUS AGUARDANDO_COMPLIANCE?
SELECT COUNT(*) as aguardando_revisao 
FROM oficios 
WHERE status = 'AGUARDANDO_COMPLIANCE';
-- Esperado: > 0

-- 3️⃣ QUAL É O MEU USER ID?
SELECT id, email FROM auth.users ORDER BY created_at;

-- 4️⃣ VER TODOS OS OFICIOS
SELECT 
  oficio_id,
  numero,
  "userId",
  status,
  confianca_ia,
  autoridade,
  prazo
FROM oficios
ORDER BY "createdAt" DESC;

-- 5️⃣ SE NÃO TEM DADOS, POPULAR AGORA:
-- Copie seu user ID do resultado acima e substitua abaixo:

INSERT INTO oficios (
  oficio_id, "userId", numero, processo, autoridade, prazo,
  descricao, status, confianca_ia, dados_ia, "pdfUrl", "ocrText",
  "createdAt", "updatedAt"
) VALUES
(
  'test_hitl_001',
  'SEU_USER_ID_AQUI',  -- ← SUBSTITUA!
  '12345',
  '1234567-89.2024.1.00.0000',
  'TRF 1ª Região',
  CURRENT_DATE + INTERVAL '5 days',
  'Teste de revisão HITL',
  'AGUARDANDO_COMPLIANCE',
  0.72,
  jsonb_build_object(
    'numero_oficio', '12345',
    'numero_processo', '1234567-89.2024.1.00.0000',
    'autoridade_emissora', 'TRF 1ª Região',
    'prazo_resposta', (CURRENT_DATE + INTERVAL '5 days')::text,
    'confianca_geral', 0.72,
    'confiancas_por_campo', jsonb_build_object(
      'numero_oficio', 0.82,
      'numero_processo', 0.75,
      'autoridade_emissora', 0.68,
      'prazo_resposta', 0.85
    )
  ),
  NULL,
  'TRIBUNAL REGIONAL FEDERAL DA 1ª REGIÃO\nOfício nº 12345\nProcesso: 1234567-89.2024.1.00.0000',
  NOW(),
  NOW()
);

-- 6️⃣ VERIFICAR SE INSERIU
SELECT * FROM oficios WHERE oficio_id = 'test_hitl_001';

-- 7️⃣ REFRESH DASHBOARD: https://oficio.ness.tec.br/dashboard
-- Deve aparecer a seção HITL!

