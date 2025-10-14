# 📡 API Reference - Sistema de Automação de Ofícios

**Versão:** 2.0.0  
**Base URL:** `https://southamerica-east1-{PROJECT_ID}.cloudfunctions.net/`  
**Autenticação:** Bearer Token (Firebase JWT)

---

## 🔐 Autenticação

Todas as requisições HTTP devem incluir o header:

```http
Authorization: Bearer {FIREBASE_JWT_TOKEN}
```

O token deve conter custom claims:
- `org_id`: ID da organização do usuário
- `role`: `platform_admin` | `org_admin` | `user`

---

## 📋 Endpoints

### **GOVERNANÇA (Platform Admin)**

#### POST /admin/organizations
Cria nova organização (tenant).

**RBAC:** `PLATFORM_ADMIN` only

**Request:**
```json
{
  "name": "Empresa XYZ Ltda",
  "email_domains": ["xyz.com.br", "xyz.com"],
  "admin_email": "admin@xyz.com.br",
  "notification_email": "compliance@xyz.com.br",
  "config_llm_model": "llama-3.1-8b-instant"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "org_id": "org_abc123",
  "name": "Empresa XYZ Ltda",
  "email_domains": ["xyz.com.br", "xyz.com"],
  "admin_email": "admin@xyz.com.br",
  "message": "Organização criada com sucesso",
  "next_steps": [
    "Criar usuário admin com custom claim: org_id=org_abc123",
    "Popular base de conhecimento via W7",
    "Configurar integração de email"
  ]
}
```

---

#### GET /admin/organizations
Lista todas as organizações.

**RBAC:** `PLATFORM_ADMIN` only

**Query Params:**
- `active`: `true` | `false` (filtrar por ativas)
- `limit`: Número de resultados (padrão: 100)

**Response:** `200 OK`
```json
{
  "status": "success",
  "count": 5,
  "organizations": [
    {
      "org_id": "org_abc123",
      "name": "Empresa XYZ",
      "email_domains": ["xyz.com.br"],
      "admin_email": "admin@xyz.com.br",
      "settings": { ... },
      "billing": { ... },
      "created_at": "2024-10-10T10:00:00Z",
      "active": true
    }
  ]
}
```

---

#### GET /admin/metrics
Retorna métricas e KPIs.

**RBAC:** `ORG_ADMIN` + `PLATFORM_ADMIN`

**Query Params:**
- `org_id`: ID da organização (obrigatório se Platform Admin)
- `period`: `7d` | `30d` | `90d` (padrão: 30d)

**Response:** `200 OK`
```json
{
  "status": "success",
  "metrics": {
    "org_id": "org123",
    "period": "30d",
    "period_days": 30,
    "start_date": "2024-09-10T00:00:00Z",
    
    "kpis": {
      "total_oficios": 127,
      "taxa_resposta": 94.5,
      "sla_atingido_percent": 96.2,
      "confianca_media_llm": 0.889,
      "tempo_medio_processamento_seg": 42.5,
      "taxa_atribuicao_percent": 87.3
    },
    
    "por_status": {
      "RESPONDIDO": 120,
      "AGUARDANDO_RESPOSTA": 5,
      "EM_REVISAO": 2
    },
    
    "por_prioridade": {
      "ALTA": 45,
      "MEDIA": 62,
      "BAIXA": 20
    },
    
    "por_prompt_version": {
      "v1.1_RAG_Initial": 100,
      "v1.2.0_CoT_Enhanced": 27
    },
    
    "billing": {
      "llm_tokens_consumed": 2450000,
      "oficios_processed": 127,
      "storage_bytes": 524288000,
      "estimated_cost_usd": 12.50
    }
  }
}
```

---

#### GET /admin/audit
Retorna trilha de auditoria.

**RBAC:** `ORG_ADMIN` + `PLATFORM_ADMIN`

**Query Params:**
- `org_id`: ID da organização
- `target_id`: Filtrar por ofício específico (opcional)
- `limit`: Número de resultados (padrão: 100)

**Response:** `200 OK`
```json
{
  "status": "success",
  "org_id": "org123",
  "count": 45,
  "audit_trail": [
    {
      "oficio_id": "oficio789",
      "user_id": "user456",
      "timestamp": "2024-10-10T14:30:00Z",
      "action": "assign_user",
      "target_id": "oficio789",
      "details": {
        "previous_user": "Nenhum",
        "new_user": "user789",
        "assigned_by": "admin123"
      }
    }
  ]
}
```

---

### **CONFIGURAÇÃO (Org Admin)**

#### PATCH /admin/organizations/:id
Atualiza configurações da organização.

**RBAC:** `ORG_ADMIN` + `PLATFORM_ADMIN`

**Request:**
```json
{
  "org_id": "org123",
  "notification_email": "novo@empresa.com",
  "config_llm_model": "gpt-4o-mini",
  "settings": {
    "auto_process": true,
    "require_compliance_approval": true
  }
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "org_id": "org123",
  "updated_fields": ["notification_email", "settings.config_llm_model"],
  "message": "Organização atualizada com sucesso"
}
```

---

### **CONHECIMENTO (RAG)**

#### POST /upload_knowledge_document
Upload de documento para base de conhecimento.

**RBAC:** `ORG_ADMIN` + `PLATFORM_ADMIN`

**Request (Multipart):**
```bash
curl -X POST {BASE_URL}/upload_knowledge_document \
  -H "Authorization: Bearer $JWT" \
  -F "file=@lei_105_2001.pdf" \
  -F "org_id=org123" \
  -F "titulo=Lei 105/2001 - Sigilo Bancário" \
  -F "tipo=legislacao" \
  -F 'metadata={"lei":"105/2001","artigo":"5"}'
```

**Request (JSON):**
```json
{
  "org_id": "org123",
  "titulo": "Política Interna v2.0",
  "content_text": "1. RECEBIMENTO...",
  "tipo": "politica_interna",
  "metadata": {"versao": "2.0"}
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "document_id": "doc_xyz789",
  "org_id": "org123",
  "titulo": "Lei 105/2001",
  "tipo": "legislacao",
  "content_length": 2450,
  "uploaded_by": "admin123",
  "file_url": "gs://bucket/org123/20241010_lei.pdf",
  "message": "Documento vetorizado e indexado com sucesso"
}
```

---

#### GET /list_knowledge_documents
Lista documentos de conhecimento.

**RBAC:** `ORG_ADMIN` + `PLATFORM_ADMIN`

**Query Params:**
- `org_id`: ID da organização
- `tipo`: Filtrar por tipo (opcional)
- `limit`: Número de resultados (padrão: 50)

**Response:** `200 OK`
```json
{
  "status": "success",
  "org_id": "org123",
  "count": 12,
  "documents": [
    {
      "document_id": "doc_xyz789",
      "org_id": "org123",
      "title": "Lei 105/2001",
      "tipo": "legislacao",
      "metadata": {"lei": "105/2001"},
      "created_at": "2024-10-10T10:00:00Z"
    }
  ]
}
```

---

### **OPERAÇÃO (Webhooks)**

#### POST /webhook_update
Atualiza ofício (aprovação, rejeição, contexto, atribuição).

**RBAC:** `ORG_ADMIN` + `USER`

**Actions:**
- `approve_compliance`: Aprova e dispara W4
- `reject_compliance`: Rejeita ofício
- `add_context`: Adiciona contexto
- `assign_user`: Atribui responsável

**Request (Atribuição):**
```json
{
  "org_id": "org123",
  "oficio_id": "oficio789",
  "action": "assign_user",
  "assigned_user_id": "user456"
}
```

**Request (Aprovação):**
```json
{
  "org_id": "org123",
  "oficio_id": "oficio789",
  "action": "approve_compliance",
  "dados_de_apoio_compliance": "Verificar Art. 5º Lei 105/2001",
  "referencias_legais": ["Lei 105/2001", "CPC Art. 219"],
  "notas_internas": "Cliente possui histórico",
  "assigned_user_id": "user456"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "oficio_id": "oficio789",
  "org_id": "org123",
  "action": "approve_compliance",
  "updated_by": "admin123",
  "new_status": "APROVADO_COMPLIANCE",
  "pubsub_message_id": "msg_abc123",
  "message": "Ação approve_compliance executada com sucesso"
}
```

---

### **QA E TESTES**

#### POST /simulate_ingestion
Simula ingestão de ofício para testes.

**RBAC:** `ORG_ADMIN` + `PLATFORM_ADMIN`

**Request:**
```json
{
  "org_id": "org123",
  "target_domain": "empresa.com.br",
  "raw_text": "OFÍCIO N° 456/2024\n\nVara Cível...",
  "simulation_name": "Teste Bloqueio Judicial",
  "llm_prompt_version": "v1.2.0_Test"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "simulation_id": "SIM_20241010_143000_user1234",
  "oficio_id": "oficio_sim_xyz",
  "org_id": "org123",
  "org_name": "Empresa XYZ",
  "target_domain": "empresa.com.br",
  "simulation_name": "Teste Bloqueio Judicial",
  "pubsub_message_id": "msg_sim_abc",
  "simulated_by": "admin123",
  "message": "Simulação criada e enviada para processamento",
  "next_steps": [
    "Aguarde ~30-60 segundos para processamento",
    "Consulte o status em GET /oficios/oficio_sim_xyz",
    "Logs com tag [SIMULATION] disponíveis no Cloud Logging"
  ]
}
```

---

#### GET /list_simulations
Lista simulações realizadas.

**RBAC:** `ORG_ADMIN` + `PLATFORM_ADMIN`

**Query Params:**
- `org_id`: ID da organização
- `limit`: Número de resultados (padrão: 20)

**Response:** `200 OK`
```json
{
  "status": "success",
  "org_id": "org123",
  "count": 5,
  "simulations": [
    {
      "oficio_id": "oficio_sim_xyz",
      "simulation_id": "SIM_20241010_143000",
      "simulation_name": "Teste Bloqueio Judicial",
      "status": "AGUARDANDO_COMPLIANCE",
      "simulated_by": "admin123",
      "simulated_at": "2024-10-10T14:30:00Z",
      "llm_prompt_version": "v1.2.0_Test"
    }
  ]
}
```

---

## 🔒 Códigos de Erro

### Autenticação
- `401 Unauthorized`: Token inválido ou ausente
- `403 Forbidden`: Sem permissão (role inadequado ou cross-org)

### Validação
- `400 Bad Request`: Payload inválido ou campos faltando
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito (ex: domínio já cadastrado)

### Servidor
- `500 Internal Server Error`: Erro interno do servidor

### Exemplo de Erro:
```json
{
  "error": "Acesso negado",
  "message": "Você só pode acessar recursos da sua própria organização",
  "required_roles": ["org_admin", "platform_admin"]
}
```

---

## 📊 Rate Limits

| Endpoint | Limite | Window |
|----------|--------|--------|
| /admin/* | 100 req | 1 min |
| /webhook_update | 1000 req | 1 min |
| /simulate_ingestion | 50 req | 1 min |
| /upload_knowledge | 20 req | 1 min |

---

## 🧪 Exemplos Completos

### 1. Criar Organização

```bash
curl -X POST https://southamerica-east1-PROJECT.cloudfunctions.net/create_organization \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Banco ABC",
    "email_domains": ["bancoabc.com.br", "abc.com.br"],
    "admin_email": "admin@bancoabc.com.br",
    "notification_email": "compliance@bancoabc.com.br",
    "config_llm_model": "llama-3.1-8b-instant"
  }'
```

### 2. Upload de Conhecimento (PDF)

```bash
curl -X POST https://southamerica-east1-PROJECT.cloudfunctions.net/upload_knowledge_document \
  -H "Authorization: Bearer $JWT" \
  -F "file=@lei_105_2001.pdf" \
  -F "org_id=org_abc123" \
  -F "titulo=Lei 105/2001 - Sigilo Bancário" \
  -F "tipo=legislacao" \
  -F 'metadata={"lei":"105/2001","artigo":"5","tags":["sigilo","bancario"]}'
```

### 3. Atribuir Ofício

```bash
curl -X POST https://southamerica-east1-PROJECT.cloudfunctions.net/webhook_update \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "org_abc123",
    "oficio_id": "oficio_xyz789",
    "action": "assign_user",
    "assigned_user_id": "user_joao123"
  }'
```

### 4. Aprovar e Adicionar Contexto

```bash
curl -X POST https://southamerica-east1-PROJECT.cloudfunctions.net/webhook_update \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "org_abc123",
    "oficio_id": "oficio_xyz789",
    "action": "approve_compliance",
    "dados_de_apoio_compliance": "Verificar saldo da conta antes de bloqueio. Cliente possui histórico de bloqueios anteriores. Consultar Art. 5º da Lei 105/2001.",
    "referencias_legais": [
      "Lei 105/2001 - Art. 5º",
      "CPC Art. 219 - Prazos"
    ],
    "notas_internas": "Solicitação urgente, prazo crítico (48h)",
    "assigned_user_id": "user_maria456"
  }'
```

### 5. Simular Ofício (QA)

```bash
curl -X POST https://southamerica-east1-PROJECT.cloudfunctions.net/simulate_ingestion \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "org_abc123",
    "target_domain": "bancoabc.com.br",
    "raw_text": "OFÍCIO N° 456/2024\n\nVara Cível da Comarca de São Paulo\nProcesso n° 1234567-89.2024.8.26.0100\n\nSolicitamos o bloqueio judicial da conta de João Silva (CPF 123.456.789-09).\n\nPrazo: 5 dias úteis",
    "simulation_name": "Teste Prompt v1.2 - Bloqueio",
    "llm_prompt_version": "v1.2.0_CoT_Enhanced"
  }'
```

### 6. Buscar Métricas

```bash
curl -X GET "https://southamerica-east1-PROJECT.cloudfunctions.net/get_metrics?org_id=org_abc123&period=30d" \
  -H "Authorization: Bearer $JWT"
```

---

## 🔄 Fluxo de Integração Frontend

### 1. Autenticação

```typescript
// Login com Firebase
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const login = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const jwt = await result.user.getIdToken();
  
  // Armazena JWT
  localStorage.setItem('jwt', jwt);
};
```

### 2. Requisições Protegidas

```typescript
// Helper function
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const jwt = localStorage.getItem('jwt');
  
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};

// Uso
const metrics = await apiFetch('get_metrics?org_id=org123&period=30d');
```

### 3. Upload de Arquivo

```typescript
const uploadKnowledge = async (file: File, metadata: any) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('org_id', metadata.org_id);
  formData.append('titulo', metadata.titulo);
  formData.append('tipo', metadata.tipo);
  formData.append('metadata', JSON.stringify(metadata.extra));
  
  const jwt = localStorage.getItem('jwt');
  
  const response = await fetch(`${BASE_URL}/upload_knowledge_document`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`
    },
    body: formData
  });
  
  return response.json();
};
```

---

## 📚 SDKs Recomendados

### TypeScript/JavaScript

```typescript
class OficiosAPI {
  constructor(private baseUrl: string, private getJWT: () => string) {}
  
  private async fetch(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      ...options,
      headers: {
        ...options?.headers,
        'Authorization': `Bearer ${this.getJWT()}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  }
  
  // Governança
  async createOrganization(data: CreateOrgRequest) {
    return this.fetch('create_organization', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  // Métricas
  async getMetrics(orgId: string, period: string = '30d') {
    return this.fetch(`get_metrics?org_id=${orgId}&period=${period}`);
  }
  
  // Webhook
  async updateOficio(orgId: string, oficioId: string, action: string, data: any) {
    return this.fetch('webhook_update', {
      method: 'POST',
      body: JSON.stringify({ org_id: orgId, oficio_id: oficioId, action, ...data })
    });
  }
  
  // Simulação
  async simulate(orgId: string, domain: string, rawText: string, name: string) {
    return this.fetch('simulate_ingestion', {
      method: 'POST',
      body: JSON.stringify({
        org_id: orgId,
        target_domain: domain,
        raw_text: rawText,
        simulation_name: name
      })
    });
  }
}
```

---

## 🎯 Webhooks de Notificação

### Slack/Teams (W2 Alerts)

**Configuração:**
```bash
export ALERT_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

**Payload enviado:**
```json
{
  "text": "🔴 ALERTA: Ofício SEM RESPONSÁVEL - CRITICO\n\n📋 Ofício ID: oficio789...",
  "urgencia": "CRITICO",
  "oficio_id": "oficio789",
  "sem_responsavel": true
}
```

---

**API completa e pronta para integração com frontend! 🚀**





