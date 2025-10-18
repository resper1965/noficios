-- ============================================
-- POLÍTICAS RLS OTIMIZADAS - n.Oficios
-- ============================================

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view own oficios" ON oficios;
DROP POLICY IF EXISTS "Users can create own oficios" ON oficios;
DROP POLICY IF EXISTS "Users can update own oficios" ON oficios;
DROP POLICY IF EXISTS "Users can delete own oficios" ON oficios;

-- Garantir que RLS está habilitado
ALTER TABLE oficios ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS OTIMIZADAS COM MÚLTIPLAS FORMAS DE AUTENTICAÇÃO
-- ============================================

-- SELECT: Ver próprios ofícios (suporta auth.uid() e auth.jwt()->>'email')
CREATE POLICY "Users can view own oficios"
ON oficios
FOR SELECT
USING (
  -- Suporta autenticação via auth.uid() ou email
  "userId" = COALESCE(
    auth.jwt()->>'email',
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- INSERT: Criar próprios ofícios
CREATE POLICY "Users can create own oficios"
ON oficios
FOR INSERT
WITH CHECK (
  "userId" = COALESCE(
    auth.jwt()->>'email',
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- UPDATE: Atualizar próprios ofícios
CREATE POLICY "Users can update own oficios"
ON oficios
FOR UPDATE
USING (
  "userId" = COALESCE(
    auth.jwt()->>'email',
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
)
WITH CHECK (
  "userId" = COALESCE(
    auth.jwt()->>'email',
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- DELETE: Deletar próprios ofícios
CREATE POLICY "Users can delete own oficios"
ON oficios
FOR DELETE
USING (
  "userId" = COALESCE(
    auth.jwt()->>'email',
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- ============================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================

-- Índice para busca por data de criação
CREATE INDEX IF NOT EXISTS idx_oficios_created_at ON oficios("createdAt" DESC);

-- Índice composto para queries filtradas por usuário e status
CREATE INDEX IF NOT EXISTS idx_oficios_userId_status ON oficios("userId", status);

-- Índice para busca full-text (PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_oficios_search ON oficios USING gin(
  to_tsvector('portuguese', COALESCE(numero, '') || ' ' || COALESCE(processo, '') || ' ' || COALESCE(autoridade, '') || ' ' || COALESCE(descricao, ''))
);

-- ============================================
-- FUNÇÃO PARA AUTO-ATUALIZAR updatedAt
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updatedAt automaticamente
DROP TRIGGER IF EXISTS update_oficios_updated_at ON oficios;
CREATE TRIGGER update_oficios_updated_at
  BEFORE UPDATE ON oficios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICAÇÃO DE SEGURANÇA
-- ============================================

-- Testar políticas (execute após fazer login)
-- SET request.jwt.claims = '{"email":"seu-email@exemplo.com"}';
-- SELECT * FROM oficios; -- Deve retornar apenas seus ofícios
-- INSERT INTO oficios (...) VALUES (...); -- Deve funcionar
-- UPDATE oficios SET status = 'respondido' WHERE id = 1; -- Deve funcionar apenas para seus ofícios
-- DELETE FROM oficios WHERE id = 1; -- Deve funcionar apenas para seus ofícios

-- ============================================
-- ✅ RLS OTIMIZADO CONCLUÍDO!
-- ============================================

