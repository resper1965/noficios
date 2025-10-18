-- ============================================
-- SUPABASE SETUP - n.Oficios
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

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE oficios ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança

-- Permitir que usuários vejam apenas seus próprios ofícios
CREATE POLICY "Users can view own oficios"
ON oficios
FOR SELECT
USING ("userId" = current_setting('request.jwt.claims', true)::json->>'email');

-- Permitir que usuários criem seus próprios ofícios
CREATE POLICY "Users can create own oficios"
ON oficios
FOR INSERT
WITH CHECK ("userId" = current_setting('request.jwt.claims', true)::json->>'email');

-- Permitir que usuários atualizem seus próprios ofícios
CREATE POLICY "Users can update own oficios"
ON oficios
FOR UPDATE
USING ("userId" = current_setting('request.jwt.claims', true)::json->>'email');

-- Permitir que usuários excluam seus próprios ofícios
CREATE POLICY "Users can delete own oficios"
ON oficios
FOR DELETE
USING ("userId" = current_setting('request.jwt.claims', true)::json->>'email');

-- 5. Inserir dados de teste
INSERT INTO oficios (numero, processo, autoridade, status, prazo, descricao, "userId")
VALUES
  ('12345', '1234567-89.2024.1.00.0000', 'Tribunal Regional Federal - 1ª Região', 'ativo', '2024-10-19T23:59:59Z', 'Requisição de informações processuais', 'resper@ness.com.br'),
  ('12344', '1234566-88.2024.1.00.0000', 'Superior Tribunal de Justiça', 'ativo', '2024-10-22T23:59:59Z', 'Solicitação de documentos', 'resper@ness.com.br'),
  ('12343', '1234565-87.2024.1.00.0000', 'Tribunal de Justiça de São Paulo', 'vencido', '2024-10-16T23:59:59Z', 'Pedido de esclarecimentos', 'resper@ness.com.br'),
  ('12342', '1234564-86.2024.1.00.0000', 'Ministério Público Federal', 'respondido', '2024-10-05T23:59:59Z', 'Informações sobre investigação', 'resper@ness.com.br');

-- 6. Verificar dados inseridos
SELECT COUNT(*) as total_oficios FROM oficios;

-- ============================================
-- ✅ SETUP COMPLETO!
-- ============================================

