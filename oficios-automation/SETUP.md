# Guia de Setup - Automação de Ofícios

## 🚀 Setup Inicial

### 1. Pré-requisitos

- Python 3.11+
- Google Cloud SDK (`gcloud`)
- Conta GCP com projeto configurado
- Conta Groq com API Key

### 2. Configuração do Projeto GCP

```bash
# Definir projeto
gcloud config set project SEU-PROJETO-ID

# Habilitar APIs necessárias
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable vision.googleapis.com
gcloud services enable cloudscheduler.googleapis.com

# Criar buckets
gsutil mb gs://SEU-PROJETO-emails
gsutil mb gs://SEU-PROJETO-anexos

# Criar tópicos Pub/Sub
gcloud pubsub topics create oficios_para_processamento
gcloud pubsub topics create oficios_dlq

# Criar banco Firestore (modo Native)
gcloud firestore databases create --region=southamerica-east1
```

### 3. Configuração do Firestore

Criar índices compostos necessários:

```bash
# Criar arquivo firestore.indexes.json
cat > firestore.indexes.json <<EOF
{
  "indexes": [
    {
      "collectionGroup": "oficios",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "org_id", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "created_at", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "oficios",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "org_id", "order": "ASCENDING"},
        {"fieldPath": "prioridade", "order": "ASCENDING"},
        {"fieldPath": "data_limite", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "oficios",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "org_id", "order": "ASCENDING"},
        {"fieldPath": "created_at", "order": "DESCENDING"}
      ]
    }
  ]
}
EOF

# Aplicar índices
gcloud firestore indexes create --database=oficios-automation --file=firestore.indexes.json
```

### 4. Configuração de Dados Iniciais

Criar organização de teste no Firestore:

```python
from google.cloud import firestore

db = firestore.Client()

# Criar organização exemplo
org_ref = db.collection('organizations').document()
org_ref.set({
    'name': 'Empresa Exemplo',
    'email_domains': ['exemplo.com.br', 'exemplo.com'],
    'settings': {
        'auto_process': True,
        'require_compliance_approval': True
    },
    'created_at': firestore.SERVER_TIMESTAMP
})

print(f"Organização criada com ID: {org_ref.id}")
```

### 5. Configuração do Firebase Authentication

```bash
# Criar projeto Firebase (se ainda não existir)
firebase projects:create SEU-PROJETO-ID

# Adicionar Firebase Authentication ao projeto
firebase use SEU-PROJETO-ID
firebase setup:emulators:auth

# Criar usuário admin de teste via Console do Firebase
# ou via script Python:
```

```python
from firebase_admin import auth, initialize_app

initialize_app()

# Criar usuário admin
user = auth.create_user(
    email='admin@exemplo.com.br',
    password='senha-segura-temporaria',
    display_name='Admin Exemplo'
)

# Adicionar custom claims (org_id e role)
auth.set_custom_user_claims(user.uid, {
    'org_id': 'ID-DA-ORG-CRIADA-ACIMA',
    'role': 'org_admin'
})

print(f"Usuário criado: {user.uid}")
```

### 6. Variáveis de Ambiente

Criar arquivo `.env` (copie do exemplo):

```bash
# Editar e preencher com seus valores
cat > .env <<EOF
GCP_PROJECT_ID=seu-projeto-gcp
GROQ_API_KEY=sua-chave-groq
PUBSUB_TOPIC_PROCESSAMENTO=oficios_para_processamento
PUBSUB_TOPIC_DLQ=oficios_dlq
MAX_RETRIES=3
EMAILS_BUCKET=seu-projeto-emails
ANEXOS_BUCKET=seu-projeto-anexos
EOF
```

### 7. Instalação de Dependências

```bash
# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
.\venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt
```

### 8. Deploy das Funções

#### W1_ingestao_trigger

```bash
cd funcoes/W1_ingestao_trigger

gcloud functions deploy ingest_oficio \
  --gen2 \
  --runtime python311 \
  --region southamerica-east1 \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket=SEU-PROJETO-emails" \
  --entry-point ingest_oficio \
  --memory 256MB \
  --timeout 60s \
  --set-env-vars GCP_PROJECT_ID=SEU-PROJETO-ID \
  --service-account SEU-SERVICE-ACCOUNT@SEU-PROJETO.iam.gserviceaccount.com
```

#### W1_processamento_async

```bash
cd ../W1_processamento_async

gcloud functions deploy process_oficio_async \
  --gen2 \
  --runtime python311 \
  --region southamerica-east1 \
  --trigger-topic oficios_para_processamento \
  --entry-point process_oficio_async \
  --memory 1024MB \
  --timeout 540s \
  --set-env-vars GCP_PROJECT_ID=SEU-PROJETO-ID,GROQ_API_KEY=SUA-CHAVE-GROQ,MAX_RETRIES=3 \
  --service-account SEU-SERVICE-ACCOUNT@SEU-PROJETO.iam.gserviceaccount.com
```

### 9. Configuração de Permissões IAM

```bash
# Service Account para as Cloud Functions
gcloud iam service-accounts create oficios-automation \
  --display-name "Automação de Ofícios"

# Permissões necessárias
PROJECT_ID=$(gcloud config get-value project)
SA_EMAIL="oficios-automation@${PROJECT_ID}.iam.gserviceaccount.com"

# Firestore
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user"

# Cloud Storage
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectViewer"

# Pub/Sub
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/pubsub.publisher"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/pubsub.subscriber"

# Cloud Vision
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudvision.user"
```

### 10. Teste do Sistema

#### Testar ingestão manualmente

```bash
# Upload de arquivo de teste
echo "OFÍCIO N° 123/2024

Vara Criminal de São Paulo
Processo n° 1234567-89.2024.8.26.0100

Solicitamos informações sobre o cliente João Silva (CPF 123.456.789-00).
Prazo: 10 dias úteis" > oficio_teste.txt

# Upload para bucket (estrutura correta)
gsutil cp oficio_teste.txt gs://SEU-PROJETO-emails/emails/exemplo.com.br/thread001/oficio_teste.txt

# Verificar logs da função
gcloud functions logs read ingest_oficio --limit 50
```

#### Verificar Firestore

```python
from google.cloud import firestore

db = firestore.Client()

# Listar ofícios
oficios = db.collection('oficios').limit(10).stream()

for oficio in oficios:
    print(f"Ofício {oficio.id}: {oficio.to_dict()}")
```

#### Verificar Pub/Sub

```bash
# Ver mensagens no tópico
gcloud pubsub subscriptions pull oficios_para_processamento-sub --limit=5 --auto-ack
```

### 11. Monitoramento

#### Configurar alertas

```bash
# Criar canal de notificação (email)
gcloud alpha monitoring channels create \
  --display-name="Alertas Ofícios" \
  --type=email \
  --channel-labels=email_address=seu-email@exemplo.com

# Criar política de alerta para erros
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL-ID \
  --display-name="Erros em Cloud Functions" \
  --condition-display-name="Taxa de erro > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s
```

#### Dashboard de logs

```bash
# Abrir Logs Explorer
gcloud logging read "resource.type=cloud_function" --limit 100 --format json
```

### 12. CI/CD (Opcional)

Criar arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy Cloud Functions

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      
      - name: Deploy W1_ingestao_trigger
        run: |
          cd funcoes/W1_ingestao_trigger
          gcloud functions deploy ingest_oficio --gen2 ...
      
      - name: Deploy W1_processamento_async
        run: |
          cd funcoes/W1_processamento_async
          gcloud functions deploy process_oficio_async --gen2 ...
```

## 🧪 Testes de Desenvolvimento Local

### Emuladores GCP

```bash
# Instalar emuladores
gcloud components install cloud-firestore-emulator pubsub-emulator

# Iniciar Firestore emulator
gcloud beta emulators firestore start --host-port=localhost:8080

# Iniciar Pub/Sub emulator
gcloud beta emulators pubsub start --host-port=localhost:8085

# Configurar variáveis para usar emuladores
export FIRESTORE_EMULATOR_HOST=localhost:8080
export PUBSUB_EMULATOR_HOST=localhost:8085
```

### Testes Unitários

```bash
# Instalar pytest
pip install pytest pytest-cov

# Executar testes (quando implementados)
pytest tests/ -v --cov=utils --cov=funcoes
```

## 📊 Validação do Setup

Checklist final:

- [ ] APIs GCP habilitadas
- [ ] Buckets criados
- [ ] Tópicos Pub/Sub criados
- [ ] Firestore configurado com índices
- [ ] Organização de teste criada
- [ ] Usuário de teste com custom claims
- [ ] Service Account com permissões
- [ ] Cloud Functions deployadas
- [ ] Teste de upload realizado com sucesso
- [ ] Logs confirmam processamento

## 🆘 Troubleshooting

### Erro: "Permission denied"

```bash
# Verificar permissões do Service Account
gcloud projects get-iam-policy SEU-PROJETO-ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:oficios-automation@*"
```

### Erro: "Function timeout"

- Aumentar timeout: `--timeout 540s`
- Verificar logs: `gcloud functions logs read NOME-FUNCAO`

### Erro: "Groq API rate limit"

- Verificar quota da API Groq
- Implementar retry com backoff
- Considerar usar caching de resultados

### Firestore: "Index not found"

```bash
# Listar índices
gcloud firestore indexes list

# Aguardar conclusão da criação (pode levar minutos)
# Status deve ser "READY"
```

## 📞 Suporte

Para questões técnicas:
- Logs: Cloud Console → Logging
- Monitoring: Cloud Console → Monitoring
- Docs GCP: https://cloud.google.com/docs
- Groq API: https://console.groq.com/docs





