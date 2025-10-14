#!/bin/bash
# Script de Deploy Local para Desenvolvimento/Staging
# Uso: ./deploy-local.sh [service-name]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo ""
echo "================================================"
echo "  Deploy Local - Frontend Cloud Run"
echo "================================================"
echo ""

# Verifica se está no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Execute este script no diretório raiz do frontend"
    exit 1
fi

# Obtém PROJECT_ID (com fallback para produção)
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    # Usa PROJECT_ID de produção como padrão
    PROJECT_ID="oficio-automation-production-2024"
    log_warn "PROJECT_ID não configurado, usando padrão: $PROJECT_ID"
    log_warn "Configure com: gcloud config set project oficio-automation-production-2024"
fi

log_info "Projeto GCP: $PROJECT_ID"

# Nome do serviço (fixo para produção)
SERVICE_NAME=${1:-"oficios-portal-frontend"}
log_info "Nome do serviço: $SERVICE_NAME"

# Região (fixo para produção)
REGION=${GCP_REGION:-"southamerica-east1"}
log_info "Região: $REGION"

# Repositório de imagens
IMAGE_REPO="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
log_info "Repositório de imagens: $IMAGE_REPO"

# Prompt para confirmação
echo ""
read -p "Deseja continuar com o deploy? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    log_warn "Deploy cancelado"
    exit 0
fi

# Passo 1: Build da imagem Docker localmente (opcional, para teste)
log_info "Testando build Docker localmente..."

docker build -t $SERVICE_NAME:local . || {
    log_error "Falha no build Docker local"
    exit 1
}

log_info "✅ Build local bem-sucedido"

# Passo 2: Build e push usando Cloud Build
log_info "Executando Cloud Build..."

gcloud builds submit \
    --tag $IMAGE_REPO \
    --timeout=15m \
    --project=$PROJECT_ID \
    . || {
    log_error "Falha no Cloud Build"
    exit 1
}

log_info "✅ Imagem construída e armazenada no GCR: $IMAGE_REPO"

# Passo 3: Deploy no Cloud Run
log_info "Deploying no Cloud Run (região: $REGION)..."

# Verifica se há variáveis de ambiente no .env.local
if [ -f ".env.local" ]; then
    log_info "Carregando variáveis de .env.local"
    
    # Lê variáveis e constrói --set-env-vars
    ENV_VARS=""
    while IFS='=' read -r key value; do
        # Ignora comentários e linhas vazias
        if [[ ! $key =~ ^# ]] && [ -n "$key" ]; then
            # Remove aspas do valor
            value=$(echo $value | sed 's/^"//;s/"$//')
            
            if [ -z "$ENV_VARS" ]; then
                ENV_VARS="$key=$value"
            else
                ENV_VARS="$ENV_VARS,$key=$value"
            fi
        fi
    done < .env.local
    
    ENV_VARS_ARG="--set-env-vars=$ENV_VARS"
else
    log_warn "Arquivo .env.local não encontrado. Deploy sem variáveis de ambiente."
    ENV_VARS_ARG=""
fi

gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_REPO \
    --region $REGION \
    --platform managed \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --cpu-throttling \
    $ENV_VARS_ARG \
    --quiet || {
    log_error "Falha no deploy Cloud Run"
    exit 1
}

# Obtém URL do serviço
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format 'value(status.url)')

echo ""
echo "================================================"
log_info "🎉 Deploy concluído com sucesso!"
echo "================================================"
echo ""
echo "🌐 URL do serviço: $SERVICE_URL"
echo ""
echo "Próximos passos:"
echo "  1. Acessar: $SERVICE_URL"
echo "  2. Testar login e navegação"
echo "  3. Verificar logs: gcloud run logs read $SERVICE_NAME --region $REGION"
echo "  4. Monitorar: gcloud run services describe $SERVICE_NAME --region $REGION"
echo ""

