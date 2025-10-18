-- 📧 POPULAR DADOS DE TESTE - Sistema MCP
-- Execute no Supabase SQL Editor

-- 1. Inserir dados de teste na tabela oficios
INSERT INTO oficios (
  numero_oficio,
  autoridade_emissora,
  prazo_resposta,
  status,
  user_id,
  dados_extraidos,
  confianca_geral,
  conteudo_bruto,
  created_at
) VALUES 
(
  'OF-2024-001',
  'Tribunal de Justiça - 1ª Vara Cível',
  '2024-11-15',
  'AGUARDANDO_COMPLIANCE',
  (SELECT id FROM auth.users LIMIT 1),
  '{"numero_oficio": "OF-2024-001", "autoridade_emissora": "Tribunal de Justiça - 1ª Vara Cível", "prazo_resposta": "2024-11-15", "classificacao_intencao": "Intimação para cumprimento de sentença", "confianca_geral": 0.85, "confiancas_por_campo": {"numero_oficio": 0.95, "autoridade_emissora": 0.90, "prazo_resposta": 0.80, "classificacao_intencao": 0.75}}',
  85,
  'CONTEÚDO BRUTO DO OFÍCIO - Intimação para cumprimento de sentença. Processo nº 1234567-89.2024.8.26.0001. Prazo: 15 dias úteis.',
  NOW()
),
(
  'OF-2024-002', 
  'Ministério Público - Promotoria Criminal',
  '2024-11-20',
  'AGUARDANDO_COMPLIANCE',
  (SELECT id FROM auth.users LIMIT 1),
  '{"numero_oficio": "OF-2024-002", "autoridade_emissora": "Ministério Público - Promotoria Criminal", "prazo_resposta": "2024-11-20", "classificacao_intencao": "Intimação para audiência", "confianca_geral": 0.92, "confiancas_por_campo": {"numero_oficio": 0.98, "autoridade_emissora": 0.95, "prazo_resposta": 0.90, "classificacao_intencao": 0.85}}',
  92,
  'CONTEÚDO BRUTO DO OFÍCIO - Intimação para audiência. Processo nº 9876543-21.2024.8.26.0002. Prazo: 20 dias úteis.',
  NOW()
),
(
  'OF-2024-003',
  'Defensoria Pública - Núcleo Criminal',
  '2024-11-25',
  'AGUARDANDO_COMPLIANCE',
  (SELECT id FROM auth.users LIMIT 1),
  '{"numero_oficio": "OF-2024-003", "autoridade_emissora": "Defensoria Pública - Núcleo Criminal", "prazo_resposta": "2024-11-25", "classificacao_intencao": "Intimação para defesa", "confianca_geral": 0.78, "confiancas_por_campo": {"numero_oficio": 0.88, "autoridade_emissora": 0.85, "prazo_resposta": 0.70, "classificacao_intencao": 0.65}}',
  78,
  'CONTEÚDO BRUTO DO OFÍCIO - Intimação para defesa. Processo nº 5555555-55.2024.8.26.0003. Prazo: 25 dias úteis.',
  NOW()
);

-- 2. Verificar se os dados foram inseridos
SELECT 
  COUNT(*) as total_oficios,
  COUNT(CASE WHEN status = 'AGUARDANDO_COMPLIANCE' THEN 1 END) as aguardando_revisao
FROM oficios;

-- 3. Verificar usuários
SELECT id, email FROM auth.users LIMIT 5;
