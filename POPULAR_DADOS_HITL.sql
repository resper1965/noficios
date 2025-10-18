-- 🎯 Popular dados para testar Portal HITL
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar ofícios aguardando revisão (com confiança baixa)
INSERT INTO oficios (
  oficio_id,
  "userId",
  numero,
  processo,
  autoridade,
  prazo,
  descricao,
  status,
  confianca_ia,
  dados_ia,
  "pdfUrl",
  "ocrText",
  "createdAt",
  "updatedAt"
) VALUES
(
  'oficio_hitl_001',
  (SELECT id FROM auth.users LIMIT 1), -- Pega primeiro usuário
  '12345',
  '1234567-89.2024.1.00.0000',
  'TRF 1ª Região',
  CURRENT_DATE + INTERVAL '5 days',
  'Requisição de informações processuais',
  'AGUARDANDO_COMPLIANCE', -- Status que dispara HITL
  0.72, -- 72% de confiança (baixa, precisa revisão)
  jsonb_build_object(
    'numero_oficio', '12345',
    'numero_processo', '1234567-89.2024.1.00.0000',
    'autoridade_emissora', 'TRF 1ª Região',
    'prazo_resposta', (CURRENT_DATE + INTERVAL '5 days')::text,
    'classificacao_intencao', 'Requisição de Informações',
    'confianca_geral', 0.72,
    'confiancas_por_campo', jsonb_build_object(
      'numero_oficio', 0.82,
      'numero_processo', 0.75,
      'autoridade_emissora', 0.68,
      'prazo_resposta', 0.85
    )
  ),
  NULL,
  'TRIBUNAL REGIONAL FEDERAL DA 1ª REGIÃO

Ofício nº 12345

Processo: 1234567-89.2024.1.00.0000

Senhor Diretor,

Solicitamos, com fundamento no art. 5º da Lei 105/2001, informações detalhadas sobre...',
  NOW(),
  NOW()
),
(
  'oficio_hitl_002',
  (SELECT id FROM auth.users LIMIT 1),
  '12346',
  '7654321-12.2024.2.00.0001',
  'Tribunal de Contas da União',
  CURRENT_DATE + INTERVAL '2 days',
  'Auditoria de contas',
  'AGUARDANDO_COMPLIANCE',
  0.68, -- 68% de confiança (muito baixa!)
  jsonb_build_object(
    'numero_oficio', '12346',
    'numero_processo', '7654321-12.2024.2.00.0001',
    'autoridade_emissora', 'TCU',
    'prazo_resposta', (CURRENT_DATE + INTERVAL '2 days')::text,
    'classificacao_intencao', 'Auditoria',
    'confianca_geral', 0.68,
    'confiancas_por_campo', jsonb_build_object(
      'numero_oficio', 0.75,
      'numero_processo', 0.60,
      'autoridade_emissora', 0.55,
      'prazo_resposta', 0.82
    )
  ),
  NULL,
  'TRIBUNAL DE CONTAS DA UNIÃO
Ofício nº 12346
Processo: 7654321-12.2024.2.00.0001
...',
  NOW(),
  NOW()
),
(
  'oficio_hitl_003',
  (SELECT id FROM auth.users LIMIT 1),
  '12347',
  '9876543-21.2024.4.00.0002',
  'Ministério Público Federal',
  CURRENT_DATE + INTERVAL '7 days',
  'Solicitação de documentos',
  'AGUARDANDO_COMPLIANCE',
  0.75, -- 75% de confiança (média)
  jsonb_build_object(
    'numero_oficio', '12347',
    'numero_processo', '9876543-21.2024.4.00.0002',
    'autoridade_emissora', 'MPF',
    'prazo_resposta', (CURRENT_DATE + INTERVAL '7 days')::text,
    'classificacao_intencao', 'Solicitação de Documentos',
    'confianca_geral', 0.75,
    'confiancas_por_campo', jsonb_build_object(
      'numero_oficio', 0.88,
      'numero_processo', 0.72,
      'autoridade_emissora', 0.65,
      'prazo_resposta', 0.90
    )
  ),
  NULL,
  'MINISTÉRIO PÚBLICO FEDERAL
Ofício nº 12347
...',
  NOW(),
  NOW()
);

-- 2. Verificar dados inseridos
SELECT 
  oficio_id,
  numero,
  autoridade,
  status,
  confianca_ia,
  prazo
FROM oficios
WHERE status = 'AGUARDANDO_COMPLIANCE'
ORDER BY "createdAt" DESC;

-- 3. Resultado esperado: 3 ofícios aguardando revisão

