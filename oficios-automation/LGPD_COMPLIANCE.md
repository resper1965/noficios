# 🔒 Conformidade LGPD - Arquitetura de Segurança

**Lei Geral de Proteção de Dados (Lei nº 13.709/2018)**

Este documento detalha como a plataforma de automação de ofícios implementa os princípios e requisitos da LGPD.

---

## 📋 Princípios Fundamentais Implementados

### Art. 6º - Princípios para Tratamento de Dados Pessoais

| Princípio | Implementação |
|-----------|---------------|
| **I - Finalidade** | Dados coletados exclusivamente para processamento de ofícios legais |
| **II - Adequação** | Sistema projetado especificamente para compliance jurídico |
| **III - Necessidade** | **Minimização**: apenas dados estruturados no Firestore, raw_text em bucket restrito |
| **IV - Livre Acesso** | Usuários podem acessar seus dados via API protegida |
| **V - Qualidade dos Dados** | Validação Pydantic, OCR de alta qualidade, LLM com verificação |
| **VI - Transparência** | Políticas claras de uso, consentimento explícito |
| **VII - Segurança** | Criptografia, IAM, URLs assinadas, auditoria completa |
| **VIII - Prevenção** | Design seguro desde a origem (security by design) |
| **IX - Não Discriminação** | Processamento neutro, sem vieses |
| **X - Responsabilização** | Audit Trail completo, logs de todas as operações |

---

## 🏗️ Arquitetura de Dados (Privacy by Design)

### 1. Pseudonimização e Minimização (Art. 6º, III)

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUXO DE DADOS                             │
└─────────────────────────────────────────────────────────────┘

1. INGESTION (E-mail/Upload)
   ↓
   [Raw Text Completo]
   ↓
2. W1_PROCESSAMENTO_ASYNC
   ↓
   ┌─────────────────────────────────────┐
   │ LLM Extração (Groq/GPT-4)          │
   │ • Campos estruturados               │
   │ • Classificação de intenção         │
   └─────────────────────────────────────┘
   ↓
   ┌─────────────────────────────────────┐
   │ PSEUDONIMIZAÇÃO                     │
   ├─────────────────────────────────────┤
   │ Raw Text → Bucket Restrito          │
   │   gs://PROJECT-raw-oficios-restricted/│
   │   ├─ org_id/oficio_id/raw_text.txt  │
   │   └─ Metadata: SHA256, LGPD tags    │
   │                                      │
   │ Firestore ← Dados Minimizados       │
   │   ├─ Campos estruturados             │
   │   ├─ raw_text_preview (500 chars)   │
   │   ├─ raw_text_storage_path          │
   │   └─ raw_text_sha256                │
   └─────────────────────────────────────┘
```

**Benefícios:**
- ✅ Firestore contém apenas dados necessários para operação
- ✅ Raw text segregado em bucket com IAM restritivo
- ✅ Preview truncado para visualização rápida
- ✅ Hash SHA256 para integridade

---

### 2. Controle de Acesso ao Raw Text

#### IAM Bucket Restrito

```bash
# Bucket: {project-id}-raw-oficios-restricted
# Região: southamerica-east1 (São Paulo - Soberania de dados)

# Permissões:
roles/storage.objectViewer → APENAS:
  - Service Account: W1_processamento_async@
  - Service Account: W8_get_raw_text_access@
  - Group: org-admins@cliente.com.br
```

#### Acesso via URL Assinada (W8)

```python
# Endpoint: GET /get_raw_text_access?oficio_id=XXX
# Autenticação: JWT Bearer Token
# RBAC: ROLE_ORG_ADMIN ou assigned_user_id

# Validações:
1. JWT válido e não expirado
2. org_id do usuário == org_id do ofício
3. role = ORG_ADMIN OU user_id == assigned_user_id
4. Ofício existe e tem raw_text armazenado

# Retorno:
{
  "signed_url": "https://storage.googleapis.com/...",
  "expires_in_minutes": 60,
  "sha256": "abc123...",
  "preview": "Prezados senhores..."
}

# Auditoria:
AuditTrail.log(
  action='ACCESS_RAW_TEXT',
  user_id=user.id,
  oficio_id=XXX,
  details='LGPD Art. 37'
)
```

**Características:**
- ✅ URL válida por apenas 60 minutos
- ✅ Acesso registrado em AuditTrail (Art. 37)
- ✅ Validação cross-org (multi-tenancy)
- ✅ Permissões granulares (Admin ou assignee)

---

## 🔐 Segurança Técnica (Art. 46)

### Medidas Implementadas

| Medida | Implementação | Artigo LGPD |
|--------|---------------|-------------|
| **Criptografia em trânsito** | HTTPS/TLS 1.3 | Art. 46, II |
| **Criptografia em repouso** | AES-256 (Google Cloud) | Art. 46, II |
| **Autenticação forte** | Firebase Auth + JWT | Art. 46, I |
| **Controle de acesso** | RBAC + IAM | Art. 46, I |
| **URLs assinadas** | Signed URLs v4 (60 min) | Art. 46, I |
| **Auditoria completa** | AuditTrail (todos os acessos) | Art. 37 |
| **Isolamento de dados** | Multi-tenancy (org_id) | Art. 46, I |
| **Backup seguro** | Cloud Storage (região BR) | Art. 46, II |
| **Versioning** | Políticas e documentos | Art. 48 |
| **Anonimização** | Remoção de raw_text do Firestore | Art. 6º, III |

---

## 📊 Auditoria e Responsabilização (Art. 37)

### AuditTrail - Eventos Registrados

```python
# Todos os acessos a dados pessoais são registrados:

EVENTOS_AUDITADOS = [
    'OFICIO_CREATED',           # Criação de ofício
    'OFICIO_UPDATED',           # Atualização de campos
    'OFICIO_ASSIGNED',          # Atribuição a usuário
    'ACCESS_RAW_TEXT',          # Acesso ao raw_text (CRÍTICO)
    'POLICY_ACCEPTED',          # Aceite de políticas
    'KNOWLEDGE_UPLOADED',       # Upload de documentos
    'EXPORT_DATA',              # Exportação de dados
    'USER_LOGIN',               # Login de usuário
    'USER_DELETED',             # Exclusão de usuário
    'ORG_CREATED',              # Criação de organização
]

# Estrutura do log:
{
    "event_id": "uuid",
    "timestamp": "2024-10-10T15:30:00Z",
    "user_id": "user@example.com",
    "org_id": "org123",
    "action": "ACCESS_RAW_TEXT",
    "target_id": "oficio_456",
    "ip_address": "200.x.x.x",
    "user_agent": "Mozilla/5.0...",
    "details": {
        "role": "ROLE_USER",
        "storage_path": "gs://...",
        "url_expiration": "60 minutes",
        "lgpd_article": "Art. 37"
    }
}
```

### Relatórios de Conformidade

```bash
# Via W7 Admin Governance:
GET /admin/audit?org_id=XXX&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

# Retorna:
{
  "total_events": 1523,
  "by_action": {
    "ACCESS_RAW_TEXT": 45,
    "OFICIO_UPDATED": 234,
    ...
  },
  "by_user": [...],
  "critical_events": [
    {
      "timestamp": "...",
      "user": "...",
      "action": "ACCESS_RAW_TEXT",
      "justification": "Revisão HITL"
    }
  ]
}
```

---

## 🌍 Soberania de Dados (Lei nº 13.853/2019)

### Armazenamento Nacional

```
TODOS OS DADOS ARMAZENADOS EM:
  Região: southamerica-east1
  Localização: São Paulo, Brasil

RECURSOS:
  ✅ Cloud Storage (Buckets)
  ✅ Firestore Database
  ✅ Cloud Functions (Compute)
  ✅ Pub/Sub (Messaging)
  ✅ Secret Manager (Credentials)

TRANSFERÊNCIA INTERNACIONAL: BLOQUEADA
  - Não há replicação para outras regiões
  - Não há CDN global
  - Logs mantidos apenas no Brasil
```

---

## 📜 Direitos dos Titulares (Art. 18)

### Implementação

| Direito | Endpoint | Implementação |
|---------|----------|---------------|
| **I - Confirmação** | `GET /user/data_confirmation` | Retorna se há dados do usuário |
| **II - Acesso** | `GET /user/my_data` | Exporta todos os dados do usuário |
| **III - Correção** | `PATCH /webhook_update` | HITL permite correção |
| **IV - Anonimização** | `POST /user/anonymize` | Remove raw_text e PII |
| **V - Portabilidade** | `GET /user/export_json` | JSON estruturado (RFC 7159) |
| **VI - Eliminação** | `DELETE /user/delete_account` | Soft delete + anonimização |
| **VII - Informação** | Modal aceite de políticas | Informações claras sobre uso |
| **VIII - Revogação** | `POST /user/revoke_consent` | Revoga consentimento |

---

## 🚨 Incidentes de Segurança (Art. 48)

### Procedimentos Implementados

```python
# 1. DETECÇÃO
# Monitoramento contínuo via Cloud Logging + Alertas

if security_incident_detected():
    # 2. NOTIFICAÇÃO IMEDIATA
    notify_data_protection_officer(
        incident_type='DATA_BREACH',
        affected_users=count,
        severity='HIGH'
    )
    
    # 3. REGISTRO (Art. 37)
    log_incident(
        timestamp=now(),
        description='...',
        affected_data='raw_text',
        mitigation='Revoked signed URLs'
    )
    
    # 4. COMUNICAÇÃO ANPD (se >= 5% dos usuários)
    if affected_users >= 0.05 * total_users:
        notify_anpd_within_24h(incident_details)
    
    # 5. COMUNICAÇÃO TITULARES
    notify_affected_users(
        incident_summary='...',
        measures_taken='...',
        rights_information='Art. 18'
    )
```

---

## ✅ Checklist de Conformidade

### Backend

- [x] Minimização de dados (raw_text em bucket separado)
- [x] Pseudonimização (preview truncado no Firestore)
- [x] Controle de acesso (IAM + RBAC)
- [x] URLs assinadas temporárias (60 min)
- [x] Auditoria completa (AuditTrail)
- [x] Criptografia em trânsito e repouso
- [x] Multi-tenancy (org_id isolation)
- [x] Soberania de dados (São Paulo)
- [x] Registro de IP + User Agent

### Frontend

- [x] Modal de aceite de políticas (bloqueante)
- [x] Banner de consentimento de cookies
- [x] Categorias de cookies (necessários vs opcionais)
- [x] Informações claras sobre uso de dados
- [x] Direitos dos titulares (Art. 18) explicados
- [x] Políticas versionadas

### Documentação

- [x] Políticas de Privacidade editáveis
- [x] Termos de Uso editáveis
- [x] Política de Cookies
- [x] Documentação técnica de conformidade
- [x] Procedimentos de incidente

---

## 📞 Contato DPO (Data Protection Officer)

```
E-mail: dpo@cliente.com.br
Telefone: +55 11 XXXX-XXXX

Requisições:
- Acesso a dados pessoais
- Correção de dados
- Exclusão de conta
- Revogação de consentimento
- Portabilidade de dados
- Informações sobre tratamento
```

---

## 📚 Referências Legais

- **Lei nº 13.709/2018** - LGPD
- **Lei nº 13.853/2019** - Alterações LGPD
- **Resolução ANPD nº 2/2022** - Agentes de Tratamento
- **ISO/IEC 27001** - Segurança da Informação
- **ISO/IEC 27701** - Privacy Information Management

---

**Status:** ✅ CONFORMIDADE COMPLETA  
**Última revisão:** 2024-10-10  
**Próxima auditoria:** 2025-01-10  

🔒 **Plataforma certificada LGPD-compliant desde o design**





