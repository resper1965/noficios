#!/bin/bash
# Script de deploy automatizado para as Cloud Functions
# Uso: ./deploy.sh [all|w1_ingest|w1_process]

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
PROJECT_ID=${GCP_PROJECT_ID:-""}
REGION=${GCP_REGION:-"southamerica-east1"}
SERVICE_ACCOUNT=${GCP_SERVICE_ACCOUNT:-""}
GROQ_API_KEY=${GROQ_API_KEY:-""}
EMAILS_BUCKET=${EMAILS_BUCKET:-""}

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

check_prerequisites() {
    log_info "Verificando pré-requisitos..."
    
    # Verifica gcloud
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI não encontrado. Instale: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Verifica PROJECT_ID
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
        if [ -z "$PROJECT_ID" ]; then
            log_error "GCP_PROJECT_ID não configurado"
            echo "Configure com: export GCP_PROJECT_ID=seu-projeto"
            exit 1
        fi
    fi
    
    log_info "Projeto GCP: $PROJECT_ID"
    
    # Verifica autenticação
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        log_error "Não autenticado no gcloud"
        echo "Execute: gcloud auth login"
        exit 1
    fi
    
    log_info "✅ Pré-requisitos OK"
}

copy_utils_into_func_dir() {
    # Copia a pasta utils (na raiz) para o diretório atual da função, se não existir
    if [ -d "../../utils" ] && [ ! -d "./utils" ]; then
        cp -R ../../utils ./utils
    fi
}

cleanup_utils_from_func_dir() {
    # Remove a cópia local da pasta utils para não sujar o working dir
    if [ -d "./utils" ]; then
        rm -rf ./utils
    fi
}

deploy_w9_notifications() {
    log_info "Deploying W9_notifications (register_fcm_token)..."
    cd funcoes/W9_notifications
    gcloud functions deploy register_fcm_token \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --entry-point register_fcm_token \
        --memory 256MB \
        --timeout 60s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID,ALLOWED_CORS_ORIGINS=https://oficio.ness.tec.br \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    cd ../..
    log_info "✅ W9_notifications deployed"
}

deploy_w1_ingest() {
    log_info "Deploying W1_ingestao_trigger..."
    
    if [ -z "$EMAILS_BUCKET" ]; then
        log_error "EMAILS_BUCKET não configurado"
        exit 1
    fi
    
    cd funcoes/W1_ingestao_trigger
    copy_utils_into_func_dir

    gcloud functions deploy ingest_oficio \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
        --trigger-event-filters="bucket=$EMAILS_BUCKET" \
        --entry-point ingest_oficio \
        --memory 256MB \
        --timeout 60s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    cleanup_utils_from_func_dir
    
    cd ../..
    
    log_info "✅ W1_ingestao_trigger deployed"
}

deploy_w1_process() {
    log_info "Deploying W1_processamento_async..."
    
    if [ -z "$GROQ_API_KEY" ]; then
        log_error "GROQ_API_KEY não configurado"
        exit 1
    fi
    
    cd funcoes/W1_processamento_async
    copy_utils_into_func_dir

    LLM_VERSION=${LLM_PROMPT_VERSION:-"v1.1_RAG_Initial"}
    
    gcloud functions deploy process_oficio_async \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-topic oficios_para_processamento \
        --entry-point process_oficio_async \
        --memory 1024MB \
        --timeout 540s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID,GROQ_API_KEY=$GROQ_API_KEY,MAX_RETRIES=3,LLM_PROMPT_VERSION=$LLM_VERSION \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    cleanup_utils_from_func_dir
    
    cd ../..
    
    log_info "✅ W1_processamento_async deployed"
}

deploy_w2_monitor() {
    log_info "Deploying W2_monitoramento_sla..."
    
    cd funcoes/W2_monitoramento_sla
    
    ALERT_WEBHOOK=${ALERT_WEBHOOK_URL:-""}
    
    gcloud functions deploy monitor_sla \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-topic sla_monitor_trigger \
        --entry-point monitor_sla \
        --memory 512MB \
        --timeout 300s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID,ALERT_WEBHOOK_URL=$ALERT_WEBHOOK \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    cd ../..
    
    log_info "✅ W2_monitoramento_sla deployed"
    
    # Cria Cloud Scheduler job se não existir
    log_info "Configurando Cloud Scheduler para W2..."
    
    gcloud scheduler jobs create pubsub sla-monitor-hourly \
        --location=$REGION \
        --schedule="0 */1 * * *" \
        --topic=sla_monitor_trigger \
        --message-body='{"trigger":"hourly"}' \
        --quiet 2>/dev/null || log_warn "Cloud Scheduler job já existe"
    
    log_info "✅ Cloud Scheduler configurado (execução a cada hora)"
}

deploy_w3_webhook() {
    log_info "Deploying W3_webhook_update..."
    
    cd funcoes/W3_webhook_update
    
    gcloud functions deploy webhook_update \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --allow-unauthenticated=false \
        --entry-point webhook_update \
        --memory 512MB \
        --timeout 60s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID,PUBSUB_TOPIC_RESPOSTA=resposta_pronta \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    cd ../..
    
    log_info "✅ W3_webhook_update deployed"
}

deploy_w4_compose() {
    log_info "Deploying W4_composicao_resposta..."
    
    if [ -z "$GROQ_API_KEY" ]; then
        log_error "GROQ_API_KEY não configurado"
        exit 1
    fi
    
    cd funcoes/W4_composicao_resposta
    
    USE_GPT4=${USE_GPT4_FOR_RESPONSE:-false}
    USE_VERTEX=${USE_VERTEX_AI_EMBEDDINGS:-true}
    
    gcloud functions deploy compose_response \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-topic resposta_pronta \
        --entry-point compose_response \
        --memory 2048MB \
        --timeout 540s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID,GROQ_API_KEY=$GROQ_API_KEY,USE_GPT4_FOR_RESPONSE=$USE_GPT4,USE_VERTEX_AI_EMBEDDINGS=$USE_VERTEX \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    cd ../..
    
    log_info "✅ W4_composicao_resposta deployed"
}

deploy_w6_simulator() {
    log_info "Deploying W6_simulador_reextracao..."
    
    cd funcoes/W6_simulador_reextracao
    
    gcloud functions deploy simulate_ingestion \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --allow-unauthenticated=false \
        --entry-point simulate_ingestion \
        --memory 512MB \
        --timeout 120s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID,PUBSUB_TOPIC_PROCESSAMENTO=oficios_para_processamento \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    cd ../..
    
    log_info "✅ W6_simulador (simulate) deployed"
    
    # Deploy função de listagem
    cd funcoes/W6_simulador_reextracao
    
    gcloud functions deploy list_simulations \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --allow-unauthenticated=false \
        --entry-point list_simulations \
        --memory 256MB \
        --timeout 60s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    cd ../..
    
    log_info "✅ W6_simulador (list) deployed"
}

deploy_w7_knowledge() {
    log_info "Deploying W7_knowledge_upload..."
    
    cd funcoes/W7_knowledge_upload
    
    USE_VERTEX=${USE_VERTEX_AI_EMBEDDINGS:-true}
    KNOWLEDGE_BUCKET=${KNOWLEDGE_BUCKET:-"${PROJECT_ID}-knowledge-docs"}
    
    gcloud functions deploy upload_knowledge_document \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --allow-unauthenticated=false \
        --entry-point upload_knowledge_document \
        --memory 1024MB \
        --timeout 300s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID,USE_VERTEX_AI_EMBEDDINGS=$USE_VERTEX,KNOWLEDGE_BUCKET=$KNOWLEDGE_BUCKET \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    cd ../..
    
    log_info "✅ W7_knowledge_upload (upload) deployed"
    
    # Deploy função de listagem
    cd funcoes/W7_knowledge_upload
    
    gcloud functions deploy list_knowledge_documents \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --allow-unauthenticated=false \
        --entry-point list_knowledge_documents \
        --memory 512MB \
        --timeout 60s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    cd ../..
    
    log_info "✅ W7_knowledge_upload (list) deployed"
}

deploy_w7_admin() {
    log_info "Deploying W7_admin_governance..."
    
    cd funcoes/W7_admin_governance
    
    # Deploy create organization
    gcloud functions deploy create_organization \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --allow-unauthenticated=false \
        --entry-point create_organization \
        --memory 512MB \
        --timeout 60s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    log_info "✅ W7_admin (create_organization) deployed"
    
    # Deploy update organization
    gcloud functions deploy update_organization \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --allow-unauthenticated=false \
        --entry-point update_organization \
        --memory 512MB \
        --timeout 60s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    log_info "✅ W7_admin (update_organization) deployed"
    
    # Deploy list organizations
    gcloud functions deploy list_organizations \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --allow-unauthenticated=false \
        --entry-point list_organizations \
        --memory 256MB \
        --timeout 60s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    log_info "✅ W7_admin (list_organizations) deployed"
    
    # Deploy get metrics
    gcloud functions deploy get_metrics \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --allow-unauthenticated=false \
        --entry-point get_metrics \
        --memory 512MB \
        --timeout 120s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    log_info "✅ W7_admin (get_metrics) deployed"
    
    # Deploy get audit trail
    gcloud functions deploy get_audit_trail \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --allow-unauthenticated=false \
        --entry-point get_audit_trail \
        --memory 512MB \
        --timeout 120s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet
    
    cd ../..
    
    log_info "✅ W7_admin (get_audit_trail) deployed"
}

# W8 - Get Raw Text (LGPD)
deploy_w8_get_raw_text() {
    log_info "Deploying W8_get_raw_text (get_raw_text_access)..."
    cd funcoes/W8_get_raw_text
    copy_utils_into_func_dir

    gcloud functions deploy get_raw_text_access \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --entry-point get_raw_text_access \
        --memory 256MB \
        --timeout 120s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID,GCP_PROJECT=$PROJECT_ID \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet

    cleanup_utils_from_func_dir
    cd ../..
    log_info "✅ W8_get_raw_text deployed"
}

deploy_w0_gmail_ingest() {
    log_info "Deploying W0_gmail_ingest (poll_gmail_ingest)..."
    cd funcoes/W0_gmail_ingest

    gcloud functions deploy poll_gmail_ingest \
        --gen2 \
        --runtime python311 \
        --region $REGION \
        --trigger-http \
        --entry-point poll_gmail_ingest \
        --memory 512MB \
        --timeout 300s \
        --set-env-vars GCP_PROJECT_ID=$PROJECT_ID,EMAILS_BUCKET=$EMAILS_BUCKET,GMAIL_DELEGATED_USER=${GMAIL_DELEGATED_USER:-operation@bekaa.eu},GMAIL_QUERY="${GMAIL_QUERY:-label:INGEST has:attachment newer_than:7d}" \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --quiet

    cd ../..
    log_info "✅ W0_gmail_ingest deployed"
}

# Main
main() {
    echo ""
    echo "================================================"
    echo "  Deploy - Automação de Ofícios"
    echo "================================================"
    echo ""
    
    check_prerequisites
    
    TARGET=${1:-"all"}
    
    case $TARGET in
        all)
            log_info "Deploying todas as funções..."
            deploy_w1_ingest
            deploy_w1_process
            deploy_w2_monitor
            deploy_w3_webhook
            deploy_w4_compose
            deploy_w6_simulator
            deploy_w7_knowledge
            deploy_w7_admin
            deploy_w8_get_raw_text
            # W9 Notifications (register FCM token)
            deploy_w9_notifications
            ;;
        w1_ingest)
            deploy_w1_ingest
            ;;
        w1_process)
            deploy_w1_process
            ;;
        w2_monitor)
            deploy_w2_monitor
            ;;
        w3_webhook)
            deploy_w3_webhook
            ;;
        w4_compose)
            deploy_w4_compose
            ;;
        w6_simulator)
            deploy_w6_simulator
            ;;
        w7_knowledge)
            deploy_w7_knowledge
            ;;
        w7_admin)
            deploy_w7_admin
            ;;
        w8_raw_text)
            deploy_w8_get_raw_text
            ;;
        w0_gmail)
            deploy_w0_gmail_ingest
            ;;
        rag)
            log_info "Deploying funções RAG (W3 + W4 + W7)..."
            deploy_w3_webhook
            deploy_w4_compose
            deploy_w7_knowledge
            ;;
        w9_notifications)
            deploy_w9_notifications
            ;;
        admin)
            log_info "Deploying funções Admin (W7 Admin + W6 QA)..."
            deploy_w7_admin
            deploy_w6_simulator
            ;;
        qa)
            log_info "Deploying funções QA (W6 Simulator)..."
            deploy_w6_simulator
            ;;
        *)
            log_error "Opção inválida: $TARGET"
            echo "Uso: $0 [all|w1_ingest|w1_process|w2_monitor|w3_webhook|w4_compose|w6_simulator|w7_knowledge|w7_admin|w9_notifications|rag|admin|qa]"
            exit 1
            ;;
    esac
    
    echo ""
    echo "================================================"
    log_info "🎉 Deploy concluído com sucesso!"
    echo "================================================"
    echo ""
    echo "Próximos passos:"
    echo "  1. Popular base de conhecimento: python scripts/populate_knowledge_base.py"
    echo "  2. Verificar logs: gcloud functions logs read NOME-FUNCAO"
    echo "  3. Testar upload: gsutil cp teste.txt gs://$EMAILS_BUCKET/emails/dominio/thread/teste.txt"
    echo "  4. Testar webhook: curl -X POST https://REGION-PROJECT.cloudfunctions.net/webhook_update"
    echo "  5. Monitorar: gcloud functions describe NOME-FUNCAO"
    echo ""
}

main "$@"

