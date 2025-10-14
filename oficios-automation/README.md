# Automação de Ofícios - Sistema Multi-Tenant

Sistema serverless para processamento automatizado de ofícios judiciais com suporte a múltiplas organizações, construído com Google Cloud Platform.

## 🏗️ Arquitetura

### Componentes Principais

1. **W1_ingestao_trigger**: Gateway de entrada
   - Trigger: Cloud Storage (novos arquivos)
   - Responsabilidade: Identificar tenant, registrar ofício e disparar processamento

2. **W1_processamento_async**: Motor de processamento
   - Trigger: Pub/Sub
   - Responsabilidade: OCR, extração via LLM, validações e cálculos

3. **W2_monitoramento_sla**: Monitor de prazos (a implementar)
4. **W3_webhook_update**: Webhooks externos (a implementar)
5. **W4_composicao_resposta**: Geração de respostas (a implementar)

### Infraestrutura

- **Database**: Firestore (Multi-Tenant)
- **Storage**: Cloud Storage (arquivos/anexos)
- **Messaging**: Pub/Sub (processamento assíncrono)
- **OCR**: Cloud Vision API
- **LLM**: Groq (Llama 3.1 8B)
- **Auth**: Firebase Authentication + RBAC

## 📁 Estrutura de Diretórios

```
oficios-automation/
├── requirements.txt              # Dependências globais
├── README.md                     # Esta documentação
├── funcoes/                      # Cloud Functions
│   ├── W1_ingestao_trigger/
│   │   ├── main.py
│   │   └── requirements.txt
│   ├── W1_processamento_async/
│   │   ├── main.py
│   │   └── requirements.txt
│   ├── W2_monitoramento_sla/
│   ├── W3_webhook_update/
│   └── W4_composicao_resposta/
└── utils/                        # Módulos compartilhados
    ├── __init__.py
    ├── schema.py                 # Modelos Pydantic
    ├── api_clients.py            # Clientes Firestore/Groq
    └── auth_rbac.py              # Autenticação e RBAC
```

## 🔐 Segurança e Multi-Tenancy

### Isolamento de Dados

Todos os dados são obrigatoriamente filtrados por `org_id`:

```python
# ✅ Correto
oficio = firestore_client.get_oficio(org_id, oficio_id)

# ❌ Errado - bypass de segurança
doc = db.collection('oficios').document(oficio_id).get()
```

### RBAC (Role-Based Access Control)

Três níveis de acesso:

1. **ROLE_PLATFORM_ADMIN**: Acesso cross-org (administração)
2. **ROLE_ORG_ADMIN**: Administração da própria organização
3. **ROLE_USER**: Acesso básico aos recursos da organização

```python
from utils.auth_rbac import rbac_required, ROLE_ORG_ADMIN

@rbac_required(allowed_roles=[ROLE_ORG_ADMIN], allow_cross_org=False)
def minha_funcao(request, auth_context):
    # auth_context contém user_id, org_id, role
    pass
```

## 📊 Modelos de Dados

### OficioData (Pydantic)

```python
{
    "org_id": "org123",
    "thread_id": "thread456",
    "autoridade_nome": "Vara Criminal de São Paulo",
    "processo_numero": "1234567-89.2024.8.26.0100",
    "solicitacoes": [
        "Informações sobre cliente X",
        "Extratos bancários período Y"
    ],
    "prazo_dias": 10,
    "tipo_resposta_provavel": "dados",
    "confianca": 0.92
}
```

### Status do Ofício

```
AGUARDANDO_PROCESSAMENTO → EM_PROCESSAMENTO → AGUARDANDO_COMPLIANCE 
→ EM_ANALISE_COMPLIANCE → APROVADO_COMPLIANCE → AGUARDANDO_RESPOSTA 
→ RESPONDIDO

                        ↓
                  ERRO_PROCESSAMENTO → NA_DLQ
```

## 🚀 Deploy

### Pré-requisitos

1. Projeto GCP configurado
2. APIs habilitadas:
   - Cloud Functions
   - Cloud Storage
   - Pub/Sub
   - Firestore
   - Cloud Vision
   - Firebase Authentication

### Variáveis de Ambiente

```bash
export GCP_PROJECT_ID="seu-projeto"
export GROQ_API_KEY="sua-chave-groq"
export PUBSUB_TOPIC_PROCESSAMENTO="oficios_para_processamento"
export PUBSUB_TOPIC_DLQ="oficios_dlq"
export MAX_RETRIES="3"
```

### Deploy W1_ingestao_trigger

```bash
cd funcoes/W1_ingestao_trigger

gcloud functions deploy ingest_oficio \
  --runtime python311 \
  --trigger-event google.storage.object.finalize \
  --trigger-resource seu-bucket-emails \
  --entry-point ingest_oficio \
  --set-env-vars GCP_PROJECT_ID=$GCP_PROJECT_ID
```

### Deploy W1_processamento_async

```bash
cd funcoes/W1_processamento_async

gcloud functions deploy process_oficio_async \
  --runtime python311 \
  --trigger-topic oficios_para_processamento \
  --entry-point process_oficio_async \
  --timeout 540s \
  --memory 1024MB \
  --set-env-vars GCP_PROJECT_ID=$GCP_PROJECT_ID,GROQ_API_KEY=$GROQ_API_KEY,MAX_RETRIES=$MAX_RETRIES
```

## 📝 Fluxo de Dados

### 1. Ingestão

```
Email Recebido → Cloud Storage → W1_ingestao_trigger
                                        ↓
                                 Resolve org_id por domínio
                                        ↓
                                 Registra no Firestore
                                        ↓
                                 Publica no Pub/Sub
```

### 2. Processamento

```
Pub/Sub → W1_processamento_async
              ↓
         OCR (Cloud Vision)
              ↓
         Extração LLM (Groq)
              ↓
         Validações (CPF/CNPJ)
              ↓
         Cálculo de prazos
              ↓
         Atualiza Firestore
```

### 3. Resiliência

- **Retries automáticos**: Pub/Sub com exponential backoff
- **Dead Letter Queue**: Após 3 tentativas → DLQ
- **Auditoria completa**: Cada operação registrada

## 🧪 Validações Implementadas

### CPF/CNPJ

```python
from utils.api_clients import validar_cpf, validar_cnpj

if validar_cpf("123.456.789-00"):
    print("CPF válido")
```

### Prazo e Prioridade

```python
# Cálculo automático baseado em:
# - Prazo em dias
# - Tipo de resposta (negativa/positiva/dados)

prioridade = calcular_prioridade(prazo_dias=5, tipo_resposta="dados")
# Resultado: "alta"
```

## 📦 Estrutura do Firestore

### Coleção: `organizations`

```json
{
  "org_id": "org123",
  "name": "Empresa XYZ",
  "email_domains": ["xyz.com.br", "xyz.com"],
  "settings": {},
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Coleção: `oficios`

```json
{
  "oficio_id": "oficio789",
  "org_id": "org123",
  "thread_id": "thread456",
  "status": "AGUARDANDO_COMPLIANCE",
  "arquivo_original": {
    "bucket": "emails-bucket",
    "path": "emails/xyz.com.br/thread456/oficio.pdf",
    "size": 102400,
    "content_type": "application/pdf"
  },
  "conteudo_bruto": "Texto extraído via OCR...",
  "dados_extraidos": {
    "autoridade_nome": "...",
    "processo_numero": "...",
    ...
  },
  "documentos_validados": {
    "cpfs_validos": ["123.456.789-00"],
    "cpfs_invalidos": [],
    "cnpjs_validos": ["12.345.678/0001-00"],
    "cnpjs_invalidos": []
  },
  "data_recebimento": "2024-10-10T10:00:00Z",
  "data_limite": "2024-10-20T10:00:00Z",
  "prioridade": "alta",
  "audit_trail": [
    {
      "user_id": "system",
      "timestamp": "2024-10-10T10:00:00Z",
      "action": "ingestion",
      "org_id": "org123",
      "changes": ["created"]
    }
  ],
  "created_at": "2024-10-10T10:00:00Z",
  "updated_at": "2024-10-10T10:05:00Z"
}
```

## 🔍 Monitoramento

### Métricas Importantes

- Taxa de sucesso/falha por função
- Tempo médio de processamento
- Taxa de documentos na DLQ
- Confiança média das extrações LLM

### Logs

Todos os componentes usam structured logging:

```python
logger.info(f"Processando ofício {oficio_id} (org: {org_id})")
```

## 🛠️ Desenvolvimento Local

### Setup

```bash
# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar credenciais GCP
export GOOGLE_APPLICATION_CREDENTIALS="path/to/credentials.json"
```

### Testes

```bash
# Testar extração estruturada
python -c "
from utils.api_clients import GroqClient
from utils.schema import OficioData

client = GroqClient()
resultado = client.extract_structured_data('texto...', OficioData)
print(resultado)
"
```

## 📚 Próximos Passos

- [ ] Implementar W2_monitoramento_sla
- [ ] Implementar W3_webhook_update
- [ ] Implementar W4_composicao_resposta
- [ ] Adicionar testes unitários
- [ ] Configurar CI/CD
- [ ] Dashboard de monitoramento
- [ ] Integração com sistema de notificações

## 📄 Licença

Projeto proprietário - Todos os direitos reservados





