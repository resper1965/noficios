-- Schema para MCP User-Friendly System
-- Preparado para RBAC e multitenancy futuro

-- Tabela de organizações (preparação multitenancy)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de usuários (preparação RBAC)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de jobs MCP
CREATE TABLE IF NOT EXISTS mcp_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  gmail_account VARCHAR(255) NOT NULL,
  emails_processed INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Política: usuários só veem seus próprios dados
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own jobs" ON mcp_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Política: organizações são públicas para leitura
CREATE POLICY "Organizations are public for reading" ON organizations
  FOR SELECT USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mcp_jobs_user_id ON mcp_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_jobs_status ON mcp_jobs(status);
CREATE INDEX IF NOT EXISTS idx_mcp_jobs_created_at ON mcp_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir organização padrão
INSERT INTO organizations (id, name, domain) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Organização Padrão', 'ness.tec.br')
ON CONFLICT (id) DO NOTHING;

-- Inserir usuário padrão (se não existir)
INSERT INTO users (id, email, name, role, organization_id)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'admin@ness.tec.br',
  'Administrador',
  'admin',
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@ness.tec.br'
);



