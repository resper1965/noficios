#!/bin/bash

###############################################################################
# 🚀 DEPLOY PORTAL HITL PARA VPS
# Script de deploy do Portal HITL para a VPS Ubuntu
###############################################################################

set -e  # Exit on error

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
VPS_HOST="62.72.8.164"
VPS_USER="root"
VPS_PATH="/opt/oficios"
LOCAL_PATH="$(pwd)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🏗️  DEPLOY PORTAL HITL - n.Oficios${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. Verificar se estamos no diretório correto
echo -e "${YELLOW}📂 Verificando diretório...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script do diretório oficios-portal-frontend${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Diretório correto${NC}"
echo ""

# 2. Build local
echo -e "${YELLOW}🔨 Building aplicação Next.js...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build concluído${NC}"
echo ""

# 3. Criar arquivo .env para deploy
echo -e "${YELLOW}🔧 Criando .env para produção...${NC}"
cat > .env.deploy << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Backend Python/GCP
NEXT_PUBLIC_PYTHON_BACKEND_URL=https://southamerica-east1-oficio-noficios.cloudfunctions.net
NEXT_PUBLIC_GCP_PROJECT_ID=oficio-noficios

# Server-side (não expor ao cliente)
PYTHON_BACKEND_URL=https://southamerica-east1-oficio-noficios.cloudfunctions.net/webhook-update
GCP_PROJECT_ID=oficio-noficios
# FIREBASE_ADMIN_TOKEN=<configurar na VPS manualmente>

# Domínio
NEXT_PUBLIC_SITE_URL=https://oficio.ness.tec.br
EOF
echo -e "${GREEN}✓ .env.deploy criado${NC}"
echo ""

# 4. Sincronizar arquivos via rsync
echo -e "${YELLOW}📤 Sincronizando arquivos com VPS...${NC}"
echo -e "${BLUE}   Destino: ${VPS_USER}@${VPS_HOST}:${VPS_PATH}${NC}"

# Lista de arquivos/diretórios a sincronizar
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '*.log' \
  --exclude '.env.local' \
  --delete \
  ./ ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

# Copiar .env.deploy como .env
scp .env.deploy ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/.env

echo -e "${GREEN}✓ Arquivos sincronizados${NC}"
echo ""

# 5. Executar comandos na VPS
echo -e "${YELLOW}🔧 Executando comandos na VPS...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e
cd /opt/oficios

echo "🧹 Limpando containers antigos..."
docker-compose down || true

echo "🗑️  Removendo imagens antigas..."
docker system prune -f --volumes

echo "🏗️  Rebuilding imagens Docker (sem cache)..."
docker-compose build --no-cache --force-rm

echo "🚀 Iniciando containers..."
docker-compose up -d --force-recreate

echo "⏳ Aguardando containers iniciarem (15s)..."
sleep 15

echo "📊 Status dos containers:"
docker-compose ps

echo "📝 Logs recentes:"
docker-compose logs --tail=50

echo ""
echo "✅ Deploy concluído!"
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao executar comandos na VPS${NC}"
    exit 1
fi
echo ""

# 6. Testar aplicação
echo -e "${YELLOW}🧪 Testando aplicação...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://oficio.ness.tec.br)

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Aplicação está respondendo (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${YELLOW}⚠️  Aplicação retornou HTTP $HTTP_STATUS${NC}"
fi
echo ""

# 7. Resumo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 URL: ${GREEN}https://oficio.ness.tec.br${NC}"
echo -e "${BLUE}📋 Portal HITL: ${GREEN}https://oficio.ness.tec.br/revisao/[id]${NC}"
echo ""
echo -e "${YELLOW}⚠️  PRÓXIMOS PASSOS:${NC}"
echo -e "   1. Configure FIREBASE_ADMIN_TOKEN no .env da VPS"
echo -e "   2. Teste o Portal HITL: /revisao/mock-1"
echo -e "   3. Conecte com backend Python (W3)"
echo -e "   4. Habilite seção HITL no dashboard (linha 92)"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Limpar .env.deploy local
rm -f .env.deploy

