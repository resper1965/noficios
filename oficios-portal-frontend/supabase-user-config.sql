-- ============================================
-- CONFIGURAÇÕES DE USUÁRIO - n.Oficios
-- ============================================

-- Criar tabela de configurações do usuário
CREATE TABLE IF NOT EXISTS user_config (
  id BIGSERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE, -- Email de login
  "gmailEmail" TEXT, -- Email Gmail para sincronizar (pode ser diferente)
  "gmailAccessToken" TEXT,
  "gmailRefreshToken" TEXT,
  "gmailConnectedAt" TIMESTAMPTZ,
  "notificationEmail" TEXT, -- Email para receber notificações
  "notificationsEnabled" BOOLEAN DEFAULT true,
  "autoSyncEnabled" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para busca rápida por userId
CREATE INDEX IF NOT EXISTS idx_user_config_userId ON user_config("userId");

-- Habilitar RLS
ALTER TABLE user_config ENABLE ROW LEVEL SECURITY;

-- Políticas: Usuários só podem ver/editar próprias configurações
CREATE POLICY "Users can view own config"
ON user_config
FOR SELECT
USING (
  "userId" = COALESCE(
    auth.jwt()->>'email',
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can insert own config"
ON user_config
FOR INSERT
WITH CHECK (
  "userId" = COALESCE(
    auth.jwt()->>'email',
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can update own config"
ON user_config
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

-- Trigger para auto-update
CREATE TRIGGER update_user_config_updated_at
  BEFORE UPDATE ON user_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ✅ TABELA USER_CONFIG CRIADA!
-- ============================================

-- EXEMPLO DE USO:
-- INSERT INTO user_config ("userId", "gmailEmail", "notificationEmail")
-- VALUES ('resper@bekaa.eu', 'oficios@ness.com.br', 'resper@bekaa.eu');

