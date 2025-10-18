-- ============================================
-- DADOS DE TESTE REALISTAS - n.Oficios
-- ============================================

-- Limpar dados de teste antigos (opcional)
-- DELETE FROM oficios WHERE "userId" IN ('resper@ness.com.br', 'resper@bekaa.eu');

-- ============================================
-- OFÍCIOS DE TESTE - Cenários Realistas
-- ============================================

INSERT INTO oficios (numero, processo, autoridade, status, prazo, descricao, "userId", "createdAt")
VALUES
-- OFÍCIOS ATIVOS URGENTES (Vence hoje/amanhã)
('2024/00123', '0001234-56.2024.4.01.3800', 'Tribunal Regional Federal da 1ª Região', 'ativo', 
  (NOW() + INTERVAL '1 day')::TIMESTAMPTZ, 
  'Requisição de informações processuais sobre APF nº 2024.38.00.001234-5. Solicita-se esclarecimentos sobre a tramitação do processo e eventual manifestação da parte autora.', 
  'resper@ness.com.br', NOW() - INTERVAL '5 days'),

('2024/00124', '0002345-67.2024.8.26.0100', 'Tribunal de Justiça de São Paulo - 12ª Vara Cível', 'ativo', 
  NOW()::TIMESTAMPTZ, 
  'Ofício requisitório solicitando cópia integral dos autos do processo em epígrafe, incluindo todas as petições, decisões e documentos juntados até a presente data.', 
  'resper@ness.com.br', NOW() - INTERVAL '10 days'),

-- OFÍCIOS ATIVOS COM PRAZO MÉDIO (3-7 dias)
('2024/00125', '0003456-78.2024.5.02.0000', 'Tribunal Regional do Trabalho da 2ª Região', 'ativo', 
  (NOW() + INTERVAL '5 days')::TIMESTAMPTZ, 
  'Comunicação de redistribuição de processo. Informa-se a redistribuição do feito para a 5ª Vara do Trabalho. Solicita-se ciência e eventual manifestação no prazo legal.', 
  'resper@ness.com.br', NOW() - INTERVAL '2 days'),

('2024/00126', '0004567-89.2024.3.00.0000', 'Tribunal Regional Eleitoral de São Paulo', 'ativo', 
  (NOW() + INTERVAL '7 days')::TIMESTAMPTZ, 
  'Pedido de informações sobre registro de candidatura. Requer manifestação acerca dos documentos apresentados e eventual complementação necessária.', 
  'resper@ness.com.br', NOW() - INTERVAL '1 day'),

-- OFÍCIOS ATIVOS COM PRAZO LONGO (>7 dias)
('2024/00127', '0005678-90.2024.4.03.6100', 'Tribunal Regional Federal da 3ª Região - 3ª Vara', 'ativo', 
  (NOW() + INTERVAL '15 days')::TIMESTAMPTZ, 
  'Notificação de audiência de conciliação designada para o dia 15/11/2024 às 14h00. Solicita-se confirmação de presença e eventual apresentação de proposta de acordo.', 
  'resper@ness.com.br', NOW()),

('2024/00128', '0006789-01.2024.1.00.0000', 'Superior Tribunal de Justiça - 3ª Turma', 'ativo', 
  (NOW() + INTERVAL '20 days')::TIMESTAMPTZ, 
  'Intimação para apresentação de contrarrazões ao recurso especial interposto pela parte adversa. Prazo: 15 dias úteis conforme art. 1.030 do CPC.', 
  'resper@ness.com.br', NOW() - INTERVAL '3 days'),

('2024/00129', '0007890-12.2024.8.19.0001', 'Tribunal de Justiça do Rio de Janeiro - 2ª CC', 'ativo', 
  (NOW() + INTERVAL '12 days')::TIMESTAMPTZ, 
  'Solicitação de documentos complementares para instrução do processo. Requer apresentação de certidões atualizadas e comprovantes de endereço das partes.', 
  'resper@ness.com.br', NOW() - INTERVAL '7 days'),

-- OFÍCIOS VENCIDOS (Diferentes períodos)
('2024/00110', '0008901-23.2024.4.02.5101', 'Tribunal Regional Federal da 2ª Região', 'vencido', 
  (NOW() - INTERVAL '2 days')::TIMESTAMPTZ, 
  'Intimação para manifestação sobre decisão interlocutória. Prazo expirado, necessário justificar atraso e peticionar urgentemente.', 
  'resper@ness.com.br', NOW() - INTERVAL '30 days'),

('2024/00111', '0009012-34.2024.8.07.0000', 'Tribunal de Justiça do Distrito Federal', 'vencido', 
  (NOW() - INTERVAL '5 days')::TIMESTAMPTZ, 
  'Requisição de esclarecimentos sobre recurso interposto. Vencido há 5 dias, risco de preclusão.', 
  'resper@ness.com.br', NOW() - INTERVAL '25 days'),

('2024/00112', '0000123-45.2024.3.01.0000', 'Tribunal Regional Eleitoral de Minas Gerais', 'vencido', 
  (NOW() - INTERVAL '15 days')::TIMESTAMPTZ, 
  'Pedido de regularização de documentação. Prazo excedido, necessário protocolar com urgência.', 
  'resper@ness.com.br', NOW() - INTERVAL '45 days'),

-- OFÍCIOS RESPONDIDOS (Com respostas)
('2024/00100', '0001234-56.2024.4.04.7100', 'Tribunal Regional Federal da 4ª Região', 'respondido', 
  (NOW() - INTERVAL '10 days')::TIMESTAMPTZ, 
  'Pedido de vista dos autos do processo administrativo nº 2024.123456-7.',
  'resper@ness.com.br', NOW() - INTERVAL '40 days'),

('2024/00101', '0002345-67.2024.8.09.0051', 'Tribunal de Justiça do Paraná - 4ª Vara de Família', 'respondido', 
  (NOW() - INTERVAL '20 days')::TIMESTAMPTZ, 
  'Intimação para apresentação de certidões de nascimento e casamento. Atendido em 15/10/2024.',
  'resper@ness.com.br', NOW() - INTERVAL '50 days'),

('2024/00102', '0003456-78.2024.5.03.0000', 'Tribunal Regional do Trabalho da 3ª Região', 'respondido', 
  (NOW() - INTERVAL '30 days')::TIMESTAMPTZ, 
  'Solicitação de cálculos de liquidação. Respondido com planilha detalhada em 01/10/2024.',
  'resper@ness.com.br', NOW() - INTERVAL '60 days'),

-- OFÍCIOS ALTA COMPLEXIDADE
('2024/00130', '0004567-89.2023.4.01.3400', 'Supremo Tribunal Federal - Plenário', 'ativo', 
  (NOW() + INTERVAL '30 days')::TIMESTAMPTZ, 
  'Habeas Corpus nº 123456. Intimação para sustentação oral em sessão plenária designada para 15/12/2024. Processo de alta complexidade envolvendo interpretação constitucional.', 
  'resper@ness.com.br', NOW() - INTERVAL '1 day'),

('2024/00131', '0005678-90.2024.1.00.0000', 'Conselho Nacional de Justiça - Corregedoria', 'ativo', 
  (NOW() + INTERVAL '10 days')::TIMESTAMPTZ, 
  'Procedimento de Controle Administrativo. Requer apresentação de documentos e esclarecimentos sobre irregularidades apontadas em processo disciplinar.', 
  'resper@ness.com.br', NOW()),

-- OFÍCIOS DIFERENTES AUTORIDADES
('2024/00132', '00123456789/2024', 'Ministério Público Federal - Procuradoria da República no DF', 'ativo', 
  (NOW() + INTERVAL '8 days')::TIMESTAMPTZ, 
  'Notificação para prestar esclarecimentos em inquérito civil público nº 1.00.000.123456/2024. Matéria: proteção de dados pessoais e conformidade com LGPD.', 
  'resper@ness.com.br', NOW() - INTERVAL '2 days'),

('2024/00133', 'PA-2024/123456', 'Tribunal de Contas da União - 2ª Câmara', 'ativo', 
  (NOW() + INTERVAL '25 days')::TIMESTAMPTZ, 
  'Processo de Tomada de Contas. Solicita esclarecimentos sobre aplicação de recursos federais em convênio nº 123456/2023.', 
  'resper@ness.com.br', NOW() - INTERVAL '5 days'),

('2024/00134', '2024-CADE-00123', 'Conselho Administrativo de Defesa Econômica', 'ativo', 
  (NOW() + INTERVAL '18 days')::TIMESTAMPTZ, 
  'Processo Administrativo de Análise de Ato de Concentração. Requer apresentação de documentos societários e financeiros atualizados.', 
  'resper@ness.com.br', NOW() - INTERVAL '4 days'),

-- OFÍCIOS DE DIFERENTES USUÁRIOS (para testar isolamento)
('2024/00201', '0009876-54.2024.4.01.3800', 'Tribunal Regional Federal da 1ª Região', 'ativo', 
  (NOW() + INTERVAL '6 days')::TIMESTAMPTZ, 
  'Ofício de teste para outro usuário - não deve aparecer para resper@ness.com.br', 
  'outro@usuario.com', NOW());

-- ============================================
-- VERIFICAÇÕES
-- ============================================

-- Contar ofícios por status
SELECT status, COUNT(*) as quantidade
FROM oficios
WHERE "userId" = 'resper@ness.com.br'
GROUP BY status
ORDER BY status;

-- Contar ofícios por urgência de prazo
SELECT 
  CASE 
    WHEN prazo < NOW() THEN 'Vencido'
    WHEN prazo < NOW() + INTERVAL '2 days' THEN 'Urgente (0-2 dias)'
    WHEN prazo < NOW() + INTERVAL '7 days' THEN 'Médio prazo (3-7 dias)'
    ELSE 'Prazo longo (>7 dias)'
  END as urgencia,
  COUNT(*) as quantidade
FROM oficios
WHERE "userId" = 'resper@ness.com.br'
AND status = 'ativo'
GROUP BY urgencia
ORDER BY 
  CASE 
    WHEN prazo < NOW() THEN 1
    WHEN prazo < NOW() + INTERVAL '2 days' THEN 2
    WHEN prazo < NOW() + INTERVAL '7 days' THEN 3
    ELSE 4
  END;

-- Verificar dados inseridos
SELECT 
  numero,
  LEFT(processo, 20) as processo,
  status,
  EXTRACT(DAY FROM (prazo - NOW())) as dias_restantes
FROM oficios
WHERE "userId" = 'resper@ness.com.br'
ORDER BY prazo ASC
LIMIT 10;

-- ============================================
-- ✅ DADOS DE TESTE INSERIDOS!
-- Total: 17 ofícios (3 vencidos, 10 ativos, 3 respondidos)
-- ============================================

