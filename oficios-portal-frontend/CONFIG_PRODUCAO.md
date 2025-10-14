# ⚙️ Configuração de Produção

**Projeto:** oficio-automation-production-2024  
**Região:** southamerica-east1  
**Serviço Frontend:** oficios-portal-frontend

---

## 🔧 Identificadores do Projeto

```bash
# Google Cloud Project
export GCP_PROJECT_ID="oficio-automation-production-2024"
export GCP_REGION="southamerica-east1"

# Cloud Run Service
export SERVICE_NAME="oficios-portal-frontend"

# Container Registry
export IMAGE_REPO="gcr.io/oficio-automation-production-2024/oficios-portal-frontend"

# Cloud Functions Base URL
export API_BASE_URL="https://southamerica-east1-oficio-automation-production-2024.cloudfunctions.net"
```

---

## 📝 Configuração do gcloud

```bash
# Configurar projeto padrão
gcloud config set project oficio-automation-production-2024

# Configurar região padrão
gcloud config set run/region southamerica-east1
gcloud config set compute/region southamerica-east1

# Verificar configuração
gcloud config list
```

---

## 🚀 Deploy do Frontend

### Método 1: Script Automatizado

```bash
cd oficios-portal-frontend

# Deploy para produção
./deploy-local.sh

# O script usará automaticamente:
# - PROJECT_ID: oficio-automation-production-2024
# - REGION: southamerica-east1
# - SERVICE: oficios-portal-frontend
```

### Método 2: Manual

```bash
# Build via Cloud Build
gcloud builds submit \
    --tag gcr.io/oficio-automation-production-2024/oficios-portal-frontend \
    --project oficio-automation-production-2024

# Deploy no Cloud Run
gcloud run deploy oficios-portal-frontend \
    --image gcr.io/oficio-automation-production-2024/oficios-portal-frontend:latest \
    --region southamerica-east1 \
    --project oficio-automation-production-2024 \
    --platform managed \
    --allow-unauthenticated
```

---

## 🔗 URLs de Produção

### Frontend (Cloud Run)
```
https://oficios-portal-frontend-HASH-rj.a.run.app
```

Após deploy, obter URL:
```bash
gcloud run services describe oficios-portal-frontend \
    --region southamerica-east1 \
    --project oficio-automation-production-2024 \
    --format 'value(status.url)'
```

### Backend (Cloud Functions)
```
https://southamerica-east1-oficio-automation-production-2024.cloudfunctions.net/{FUNCTION_NAME}
```

Endpoints principais:
- `/create_organization` - Criar organização
- `/webhook_update` - Atualizar ofício
- `/get_metrics` - Métricas
- `/upload_knowledge_document` - Upload RAG
- `/simulate_ingestion` - Simulador

---

## 🔐 Variáveis de Ambiente (Produção)

### Arquivo .env.local (Frontend)

```env
# Firebase (Obter do Console Firebase)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=oficio-automation-production-2024.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=oficio-automation-production-2024
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=oficio-automation-production-2024.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef...

# API Backend
NEXT_PUBLIC_API_BASE_URL=https://southamerica-east1-oficio-automation-production-2024.cloudfunctions.net
```

### Backend (Cloud Functions)

Ver arquivo `oficios-automation/deploy.sh` - já configurado com:
- `GCP_PROJECT_ID=oficio-automation-production-2024`
- `GCP_REGION=southamerica-east1`

---

## 📦 Recursos GCP (Produção)

### Cloud Run

```bash
# Serviço: oficios-portal-frontend
# Região: southamerica-east1
# Imagem: gcr.io/oficio-automation-production-2024/oficios-portal-frontend
# Configuração: 512Mi RAM, 1 vCPU, min=0, max=10
```

### Cloud Functions

```bash
# Projeto: oficio-automation-production-2024
# Região: southamerica-east1
# Total: 15 endpoints (W1-W7)
```

### Firestore

```bash
# Database: (default)
# Região: southamerica-east1
# Coleções:
#   - organizations
#   - oficios
#   - knowledge_base
#   - legal_documents
#   - policy_acceptances
#   - audit_trail
```

### Cloud Storage

```bash
# Buckets:
#   - oficio-automation-production-2024-emails
#   - oficio-automation-production-2024-knowledge-docs
#   - oficio-automation-production-2024-oficios-archive
```

### Pub/Sub

```bash
# Tópicos:
#   - oficios_para_processamento
#   - oficios_dlq
#   - resposta_pronta
#   - sla_monitor_trigger
```

---

## 🧪 Testes de Integração

### 1. Testar Frontend Local

```bash
cd oficios-portal-frontend
npm run dev

# Acessar http://localhost:3000
# Testar login, dashboard, admin
```

### 2. Testar Deploy Frontend

```bash
./deploy-local.sh

# Aguardar deploy
# Acessar URL retornada
```

### 3. Testar Integração Backend

```bash
# Obter JWT do Firebase
JWT=$(gcloud auth print-identity-token)

# Testar endpoint de métricas
curl -H "Authorization: Bearer $JWT" \
  "https://southamerica-east1-oficio-automation-production-2024.cloudfunctions.net/get_metrics?org_id=org123&period=30d"
```

---

## 📊 Monitoramento

### Cloud Run

```bash
# Logs
gcloud run logs tail oficios-portal-frontend \
    --region southamerica-east1 \
    --project oficio-automation-production-2024

# Métricas
gcloud run services describe oficios-portal-frontend \
    --region southamerica-east1 \
    --project oficio-automation-production-2024
```

### Cloud Functions

```bash
# Logs de função específica
gcloud functions logs read process_oficio_async \
    --region southamerica-east1 \
    --project oficio-automation-production-2024 \
    --limit 100
```

---

## 🔄 CI/CD (GitHub/GitLab)

### Configurar Trigger

```bash
# Criar Cloud Build trigger
gcloud builds triggers create github \
    --name="frontend-prod-deploy" \
    --repo-name="oficios-automation" \
    --repo-owner="seu-usuario" \
    --branch-pattern="^main$" \
    --build-config="oficios-portal-frontend/cloudbuild-frontend.yaml" \
    --project=oficio-automation-production-2024
```

### Workflow Git

```bash
# Desenvolvimento
git checkout -b feature/nova-funcionalidade
git commit -m "feat: nova funcionalidade"
git push origin feature/nova-funcionalidade

# Produção (via PR)
git checkout main
git merge feature/nova-funcionalidade
git push origin main

# → Trigger automático do Cloud Build
# → Build da imagem
# → Deploy no Cloud Run
# → URL atualizada automaticamente
```

---

## ✅ Checklist de Produção

### Pré-Deploy

- [ ] Projeto GCP `oficio-automation-production-2024` criado
- [ ] APIs habilitadas (Cloud Run, Build, Functions, etc)
- [ ] Firebase projeto configurado
- [ ] Credenciais Firebase obtidas
- [ ] `.env.local` configurado
- [ ] Código testado localmente

### Deploy Backend

- [ ] `cd oficios-automation`
- [ ] Configurar variáveis (`export GCP_PROJECT_ID=...`)
- [ ] `./deploy.sh all`
- [ ] Verificar 15 endpoints deployados
- [ ] Popular base de conhecimento
- [ ] Criar organização de teste

### Deploy Frontend

- [ ] `cd oficios-portal-frontend`
- [ ] Verificar `.env.local`
- [ ] `./deploy-local.sh`
- [ ] Verificar URL retornada
- [ ] Testar login
- [ ] Testar dashboard
- [ ] Testar admin portal

### Pós-Deploy

- [ ] Configurar domínio customizado (opcional)
- [ ] Configurar monitoramento e alertas
- [ ] Configurar Cloud Scheduler (W2)
- [ ] Testes E2E
- [ ] Documentação de operação

---

**Ambiente de produção configurado e pronto para deploy! 🚀**





