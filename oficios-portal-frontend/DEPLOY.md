# 🚀 Deploy do Frontend - Cloud Run

Guia completo para deploy da aplicação Next.js no Google Cloud Run.

---

## 📋 Pré-requisitos

- Google Cloud SDK instalado (`gcloud`)
- Docker instalado (para testes locais)
- Projeto GCP configurado
- Cloud Build API habilitada
- Cloud Run API habilitada
- Artifact Registry API habilitada

---

## 🛠️ Setup Inicial

### 1. Habilitar APIs necessárias

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### 2. Configurar variáveis de ambiente

```bash
# Copiar template
cp .env.example .env.local

# Editar com suas credenciais Firebase
nano .env.local
```

**Variáveis obrigatórias:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_API_BASE_URL=https://southamerica-east1-your-project.cloudfunctions.net
```

---

## 🐳 Deploy Local (Desenvolvimento/Staging)

### Método 1: Script Automatizado

```bash
# Tornar executável (primeira vez)
chmod +x deploy-local.sh

# Executar deploy
./deploy-local.sh

# Ou com nome de serviço customizado
./deploy-local.sh dev-oficios-frontend
```

O script irá:
1. ✅ Testar build Docker localmente
2. ✅ Submeter build para Cloud Build
3. ✅ Fazer deploy no Cloud Run
4. ✅ Configurar variáveis de ambiente do .env.local
5. ✅ Retornar URL do serviço

### Método 2: Manual

```bash
# Build da imagem
gcloud builds submit \
    --tag gcr.io/$(gcloud config get-value project)/oficios-portal-frontend

# Deploy no Cloud Run
gcloud run deploy oficios-portal-frontend \
    --image gcr.io/$(gcloud config get-value project)/oficios-portal-frontend \
    --region southamerica-east1 \
    --platform managed \
    --allow-unauthenticated \
    --memory 512Mi \
    --min-instances 0 \
    --max-instances 10
```

---

## 🔄 CI/CD Automático (Produção)

### Setup do Cloud Build Trigger

```bash
# Criar trigger para branch main
gcloud builds triggers create github \
    --name="frontend-deploy-prod" \
    --repo-name="seu-repo" \
    --repo-owner="seu-usuario" \
    --branch-pattern="^main$" \
    --build-config="cloudbuild-frontend.yaml" \
    --substitutions=_API_BASE_URL="https://southamerica-east1-PROJECT.cloudfunctions.net"
```

### Fluxo Automático

```
git push origin main
    ↓
GitHub webhook
    ↓
Cloud Build Trigger
    ↓
Build Docker Image
    ↓
Push to GCR
    ↓
Deploy Cloud Run
    ↓
✅ Aplicação atualizada
```

---

## 🧪 Testes Locais (Docker)

### Build e teste local

```bash
# Build da imagem
docker build -t oficios-frontend:local .

# Executar localmente
docker run -p 3000:3000 \
    --env-file .env.local \
    oficios-frontend:local

# Acessar
open http://localhost:3000
```

---

## ⚙️ Configurações do Cloud Run

### Recursos Recomendados

| Ambiente | Memory | CPU | Min Instances | Max Instances |
|----------|--------|-----|---------------|---------------|
| Dev | 512Mi | 1 | 0 | 5 |
| Staging | 512Mi | 1 | 0 | 10 |
| Prod | 1Gi | 1 | 1 | 50 |

### Variáveis de Ambiente

Configuradas via `cloudbuild-frontend.yaml` (substitutions) ou `gcloud run deploy`:

```bash
--set-env-vars=NEXT_PUBLIC_API_BASE_URL=https://...
--set-env-vars=NEXT_PUBLIC_FIREBASE_API_KEY=...
```

### CPU Throttling

```bash
--cpu-throttling  # Economiza custo (CPU apenas durante requests)
```

### Auto-scaling

```bash
--min-instances=1      # Prod: Sempre 1 instância ativa
--max-instances=50     # Escala até 50 instâncias
--concurrency=80       # Requests simultâneas por instância
```

---

## 🔒 Segurança

### HTTPS Automático

Cloud Run fornece HTTPS automaticamente com certificado gerenciado.

### Domínio Customizado

```bash
# Mapear domínio customizado
gcloud run domain-mappings create \
    --service oficios-portal-frontend \
    --domain app.seudominio.com.br \
    --region southamerica-east1

# Configurar DNS (CNAME)
# app.seudominio.com.br → ghs.googlehosted.com
```

### Autenticação

Para restringir acesso (opcional):

```bash
--no-allow-unauthenticated  # Requer autenticação GCP
```

---

## 📊 Monitoramento

### Logs

```bash
# Ver logs em tempo real
gcloud run logs tail oficios-portal-frontend \
    --region southamerica-east1

# Ver últimos logs
gcloud run logs read oficios-portal-frontend \
    --region southamerica-east1 \
    --limit 100
```

### Métricas

```bash
# Descrever serviço
gcloud run services describe oficios-portal-frontend \
    --region southamerica-east1

# Cloud Console
# https://console.cloud.google.com/run
```

### Alertas

Configurar no Cloud Monitoring:
- Latência > 1s
- Taxa de erro > 1%
- CPU usage > 80%

---

## 💰 Custos Estimados

### Cloud Run Pricing (southamerica-east1)

| Recurso | Preço | Uso Estimado | Custo/Mês |
|---------|-------|--------------|-----------|
| CPU | $0.00002400/vCPU-sec | 100h/mês | $8.64 |
| Memory | $0.00000250/GiB-sec | 100h/512MB | $0.45 |
| Requests | $0.40/million | 100K | $0.04 |
| **Total** | | | **~$9.13** |

### Otimizações de Custo

- ✅ `--min-instances=0`: Escala para zero quando sem uso
- ✅ `--cpu-throttling`: CPU apenas durante requests
- ✅ `--memory=512Mi`: Memória mínima suficiente
- ✅ Next.js standalone: Build otimizado

**Custo com min-instances=1 (Prod):** ~$15-20/mês

---

## 🔧 Troubleshooting

### Build falhou

```bash
# Ver logs do Cloud Build
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

### Serviço não inicia

```bash
# Verificar logs do Cloud Run
gcloud run logs read oficios-portal-frontend --region southamerica-east1

# Verificar configuração
gcloud run services describe oficios-portal-frontend --region southamerica-east1
```

### Variáveis de ambiente não carregadas

```bash
# Listar variáveis atuais
gcloud run services describe oficios-portal-frontend \
    --region southamerica-east1 \
    --format='value(spec.template.spec.containers[0].env)'

# Atualizar variáveis
gcloud run services update oficios-portal-frontend \
    --region southamerica-east1 \
    --set-env-vars=CHAVE=VALOR
```

### Timeout durante build

```bash
# Aumentar timeout no cloudbuild-frontend.yaml
timeout: '1800s'  # 30 minutos
```

---

## 🚀 Rollback

```bash
# Listar revisões
gcloud run revisions list \
    --service oficios-portal-frontend \
    --region southamerica-east1

# Rollback para revisão anterior
gcloud run services update-traffic oficios-portal-frontend \
    --region southamerica-east1 \
    --to-revisions REVISION_NAME=100
```

---

## 📈 Escala e Performance

### Configuração de Produção

```bash
gcloud run deploy oficios-portal-frontend \
    --image gcr.io/$PROJECT_ID/oficios-portal-frontend:latest \
    --region southamerica-east1 \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 2 \
    --min-instances 1 \
    --max-instances 50 \
    --concurrency 80 \
    --timeout 60s \
    --no-cpu-throttling
```

### CDN (Cloud Load Balancer)

Para melhor performance global:

1. Criar Load Balancer
2. Configurar Cloud CDN
3. Apontar para Cloud Run backend
4. Cache de assets estáticos

---

## ✅ Checklist de Deploy

**Pré-Deploy:**
- [ ] .env.local configurado
- [ ] Firebase projeto criado
- [ ] APIs GCP habilitadas
- [ ] Testes locais (`npm run dev`)
- [ ] Build local bem-sucedido

**Deploy:**
- [ ] `./deploy-local.sh` executado
- [ ] Imagem no GCR
- [ ] Serviço Cloud Run ativo
- [ ] URL acessível
- [ ] Variáveis de ambiente configuradas

**Pós-Deploy:**
- [ ] Login funcionando (Firebase)
- [ ] Dashboard carregando
- [ ] Admin portal acessível
- [ ] Integração com backend testada
- [ ] Logs sem erros

---

**Deploy automatizado e pronto para produção! 🚀**





