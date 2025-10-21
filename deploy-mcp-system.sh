#!/bin/bash

# 🚀 DEPLOY MCP USER-FRIENDLY SYSTEM
# Script para deploy completo do sistema MCP

echo "🏗️ Iniciando deploy do sistema MCP user-friendly..."

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# 2. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 3. Fazer build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

# 4. Deploy para VPS
echo "🚀 Fazendo deploy para VPS..."

# Copiar arquivos para VPS
echo "📁 Copiando arquivos para VPS..."
sshpass -p 'Gordinh@2009' scp -o StrictHostKeyChecking=no -r oficios-portal-frontend/src/types root@oficio.ness.tec.br:/opt/oficios/oficios-portal-frontend/src/
sshpass -p 'Gordinh@2009' scp -o StrictHostKeyChecking=no -r oficios-portal-frontend/src/services root@oficio.ness.tec.br:/opt/oficios/oficios-portal-frontend/src/
sshpass -p 'Gordinh@2009' scp -o StrictHostKeyChecking=no -r oficios-portal-frontend/src/hooks root@oficio.ness.tec.br:/opt/oficios/oficios-portal-frontend/src/
sshpass -p 'Gordinh@2009' scp -o StrictHostKeyChecking=no -r oficios-portal-frontend/src/components/mcp root@oficio.ness.tec.br:/opt/oficios/oficios-portal-frontend/src/components/
sshpass -p 'Gordinh@2009' scp -o StrictHostKeyChecking=no -r oficios-portal-frontend/src/app/api/mcp root@oficio.ness.tec.br:/opt/oficios/oficios-portal-frontend/src/app/api/
sshpass -p 'Gordinh@2009' scp -o StrictHostKeyChecking=no -r oficios-portal-frontend/src/app/dashboard/mcp root@oficio.ness.tec.br:/opt/oficios/oficios-portal-frontend/src/app/dashboard/

# 5. Executar SQL no Supabase
echo "🗄️ Executando schema SQL no Supabase..."
echo "Execute o arquivo 'supabase-mcp-schema.sql' no Supabase SQL Editor"

# 6. Reiniciar container
echo "🔄 Reiniciando container..."
sshpass -p 'Gordinh@2009' ssh -o StrictHostKeyChecking=no root@oficio.ness.tec.br "cd /opt/oficios && docker compose restart oficios-frontend"

# 7. Verificar status
echo "✅ Verificando status do deploy..."
sshpass -p 'Gordinh@2009' ssh -o StrictHostKeyChecking=no root@oficio.ness.tec.br "cd /opt/oficios && docker compose ps"

echo "🎉 Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute o SQL 'supabase-mcp-schema.sql' no Supabase"
echo "2. Acesse: https://oficio.ness.tec.br/dashboard/mcp"
echo "3. Teste a execução MCP"
echo ""
echo "🔗 Links úteis:"
echo "- Dashboard MCP: https://oficio.ness.tec.br/dashboard/mcp"
echo "- Supabase SQL Editor: https://supabase.com/dashboard/project/ghcqywthubgfenqqxoqb/sql"




