-- ============================================
-- SUPABASE SETUP SIMPLES - n.Oficios
-- Project ID: ghcqywthubgfenqqxoqb
-- ============================================

-- 1. Criar tabela de oficios
CREATE TABLE IF NOT EXISTS oficios (
  id BIGSERIAL PRIMARY KEY,
  numero TEXT NOT NULL,
  processo TEXT NOT NULL,
  autoridade TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  prazo TIMESTAMPTZ NOT NULL,
  descricao TEXT,
  resposta TEXT,
  anexos TEXT[] DEFAULT '{}',
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_oficios_userId ON oficios("userId");
CREATE INDEX IF NOT EXISTS idx_oficios_status ON oficios(status);
CREATE INDEX IF NOT EXISTS idx_oficios_prazo ON oficios(prazo);

-- 3. DESABILITAR RLS temporariamente para teste
ALTER TABLE oficios DISABLE ROW LEVEL SECURITY;

-- 4. Inserir dados de teste
INSERT INTO oficios (numero, processo, autoridade, status, prazo, descricao, "userId")
VALUES
  ('12345', '1234567-89.2024.1.00.0000', 'Tribunal Regional Federal - 1ª Região', 'ativo', '2024-10-19T23:59:59Z', 'Requisição de informações processuais', 'resper@ness.com.br'),
  ('12344', '1234566-88.2024.1.00.0000', 'Superior Tribunal de Justiça', 'ativo', '2024-10-22T23:59:59Z', 'Solicitação de documentos', 'resper@ness.com.br'),
  ('12343', '1234565-87.2024.1.00.0000', 'Tribunal de Justiça de São Paulo', 'vencido', '2024-10-16T23:59:59Z', 'Pedido de esclarecimentos', 'resper@ness.com.br'),
  ('12342', '1234564-86.2024.1.00.0000', 'Ministério Público Federal', 'respondido', '2024-10-05T23:59:59Z', 'Informações sobre investigação', 'resper@ness.com.br')
ON CONFLICT DO NOTHING;

-- 5. Verificar dados inseridos
SELECT * FROM oficios ORDER BY id;

-- ============================================
-- ✅ SETUP COMPLETO!
-- ============================================

