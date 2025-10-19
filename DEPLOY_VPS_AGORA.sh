#!/bin/bash

# 🚀 Script de Deploy Completo na VPS
# n.Oficios - Backend Python + Frontend Next.js
# BMad Master - 2025-10-18

set -e

echo "════════════════════════════════════════════════════════════"
echo "  🚀 DEPLOY COMPLETO - n.Oficios VPS"
echo "════════════════════════════════════════════════════════════"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

VPS_HOST="root@62.72.8.164"
VPS_DIR="/opt/oficios"

echo "📦 Passo 1/6: Empacotando arquivos..."
cd /home/resper/noficios

# Empacotar backend
tar -czf backend-simple-deploy.tar.gz backend-simple/

# Empacotar frontend (se necessário rebuild)
cd oficios-portal-frontend
npm run build
cd ..

echo -e "${GREEN}✅ Arquivos empacotados${NC}"
echo ""

echo "📤 Passo 2/6: Enviando para VPS..."

# Enviar backend
scp backend-simple-deploy.tar.gz $VPS_HOST:$VPS_DIR/

# Enviar docker-compose atualizado
scp docker-compose.vps.yml $VPS_HOST:$VPS_DIR/docker-compose.yml

# Enviar planejamento
scp PLANEJAMENTO_VPS_COMPLETO.md $VPS_HOST:$VPS_DIR/

echo -e "${GREEN}✅ Arquivos enviados${NC}"
echo ""

echo "📂 Passo 3/6: Extraindo na VPS..."

ssh $VPS_HOST << 'ENDSSH'
cd /opt/oficios

# Extrair backend
tar -xzf backend-simple-deploy.tar.gz
rm backend-simple-deploy.tar.gz

# Criar diretórios necessários
mkdir -p data/emails
mkdir -p data/logs

# Verificar estrutura
echo "Estrutura criada:"
ls -la

ENDSSH

echo -e "${GREEN}✅ Estrutura criada${NC}"
echo ""

echo "⚠️  Passo 4/6: Verificação de Configuração..."
echo ""
echo -e "${YELLOW}ATENÇÃO: Verificar se estes arquivos existem na VPS:${NC}"
echo "  1. /opt/oficios/gmail-sa-key.json (Service Account Google)"
echo "  2. /opt/oficios/oficios-portal-frontend/.env.production"
echo ""
echo "Se NÃO existirem, configure antes de continuar:"
echo ""
echo "  # Service Account (criar no Google Cloud Console)"
echo "  scp gmail-sa-key.json $VPS_HOST:/opt/oficios/"
echo ""
echo "  # Environment variables"
echo "  # Editar .env.production e adicionar:"
echo "  # W0_GMAIL_INGEST_URL=http://backend-python:8000/gmail/ingest"
echo "  # GMAIL_SYNC_API_KEY=<sua-chave>"
echo ""
read -p "Arquivos configurados? Pressione ENTER para continuar ou CTRL+C para cancelar..."

echo ""
echo "🐳 Passo 5/6: Build e Deploy dos Containers..."

ssh $VPS_HOST << 'ENDSSH'
cd /opt/oficios

echo "Building containers..."

# Parar containers antigos
docker-compose down

# Build novos containers
docker-compose build

echo "Starting services..."

# Subir serviços
docker-compose up -d

echo "Waiting for services to be healthy..."
sleep 10

# Verificar status
docker-compose ps

ENDSSH

echo -e "${GREEN}✅ Containers deployados${NC}"
echo ""

echo "🧪 Passo 6/6: Validação..."

# Testar backend
echo "Testing backend health..."
ssh $VPS_HOST "curl -f http://localhost:8000/health" && echo -e "${GREEN}✅ Backend OK${NC}" || echo -e "${RED}❌ Backend FAIL${NC}"

# Testar frontend
echo "Testing frontend health..."
ssh $VPS_HOST "curl -f http://localhost:3000/api/health" && echo -e "${GREEN}✅ Frontend OK${NC}" || echo -e "${RED}❌ Frontend FAIL${NC}"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  🎉 DEPLOY COMPLETO!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 Serviços rodando:"
echo "   Backend:  http://62.72.8.164:8000"
echo "   Frontend: http://62.72.8.164:3000"
echo ""
echo "🔧 Comandos úteis:"
echo "   ssh $VPS_HOST"
echo "   cd /opt/oficios"
echo "   docker-compose logs -f                # Ver logs"
echo "   docker-compose restart                # Reiniciar"
echo "   docker-compose ps                     # Status"
echo ""
echo "🧪 Testar Gmail sync:"
echo "   ./sync-gmail-real.sh"
echo ""
echo "════════════════════════════════════════════════════════════"

