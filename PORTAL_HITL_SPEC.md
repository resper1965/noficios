# 🎯 PORTAL HITL - Especificação Completa

## 📊 HUMAN-IN-THE-LOOP (Análise Humana)

---

## 🔄 FLUXO COMPLETO DO PROCESSO

```
1. Email chega → Storage Trigger
   ↓
2. W1 Ingestão: Cria ofício
   Status: AGUARDANDO_PROCESSAMENTO
   ↓
3. W1 Processamento: OCR + LLM Extraction
   ↓
   ├─→ Confiança ALTA (>88%) → AGUARDANDO_RESPOSTA (skip HITL)
   │
   └─→ Confiança BAIXA (<88%) → AGUARDANDO_COMPLIANCE ⭐
       ↓
4. 👤 ANALISTA REVISA NO PORTAL HITL
   URL: /revisao/[oficio_id]
   ↓
   Ações disponíveis:
   ├─→ ✅ APROVAR → W4 Composição Resposta
   ├─→ ❌ REJEITAR → REPROVADO_COMPLIANCE
   ├─→ 📝 ADICIONAR CONTEXTO → Enriquece dados
   └─→ 👤 ATRIBUIR RESPONSÁVEL → assigned_user_id
   ↓
5. Se aprovado → W4 RAG Cognitive Response
   ↓
6. Status final: RESPONDIDO
```

---

## 🎨 INTERFACE DO PORTAL HITL

### **URL:** `/revisao/[oficio_id]`

### **Layout: Split Panel 3 Colunas**

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: n.Oficios | Revisão de Ofício #12345                    │
├──────────────┬────────────────────┬─────────────────────────────┤
│              │                    │                             │
│  COLUNA 1    │    COLUNA 2        │      COLUNA 3              │
│  (30%)       │    (35%)           │      (35%)                 │
│              │                    │                             │
│ 📄 Original  │ 🤖 IA Extraiu      │ ✏️ Editar/Aprovar          │
│              │                    │                             │
│ • PDF/OCR    │ • Número: 12345    │ [Input] Número: 12345      │
│ • Texto      │ • Processo: 123... │ [Input] Processo: 123...   │
│   completo   │ • Autoridade: TRF  │ [Input] Autoridade: TRF    │
│              │ • Prazo: 30/10     │ [Date] Prazo: 30/10        │
│ [Ver PDF]    │ • Confiança: 72%   │ [Text] Descrição: ...      │
│              │   ⚠️ BAIXA!        │ [Text] Contexto extra...   │
│              │                    │                             │
│              │                    │ [Select] Atribuir a:       │
│              │                    │   • João Silva             │
│              │                    │   • Maria Santos           │
│              │                    │                             │
│              │                    │ 🔴 Notas Internas:         │
│              │                    │ [Textarea]                 │
│              │                    │                             │
│              │                    │ 📚 Referências Legais:     │
│              │                    │ [+ Adicionar]              │
│              │                    │ • Art. 5º Lei 105/2001     │
│              │                    │                             │
│              │                    │ ┌────────┬────────┐        │
│              │                    │ │✅APROVAR│❌REJEITAR│       │
│              │                    │ └────────┴────────┘        │
│              │                    │ [💾 SALVAR RASCUNHO]       │
└──────────────┴────────────────────┴─────────────────────────────┘
```

---

## 📋 COMPONENTES DO PORTAL

### **1. Painel Esquerdo - Documento Original**
```typescript
<DocumentViewer>
  - PDF Viewer inline (react-pdf)
  - Texto OCR extraído
  - Download do original
  - Zoom in/out
  - Busca no texto
</DocumentViewer>
```

### **2. Painel Central - Dados Extraídos pela IA**
```typescript
<ExtractionResults>
  - Campos extraídos (read-only)
  - Badge de confiança (%)
  - Highlight de campos com baixa confiança
  - Ícones de validação:
    ✅ Confiança alta (>88%)
    ⚠️  Confiança média (70-88%)
    ❌ Confiança baixa (<70%)
</ExtractionResults>
```

### **3. Painel Direito - Edição e Aprovação**
```typescript
<ComplianceReviewForm>
  - Campos editáveis (pré-populados com IA)
  - Validação em tempo real
  - Campo "Contexto Extra" (enriquecimento)
  - Select de atribuição de responsável
  - Textarea de notas internas
  - Lista de referências legais
  - Botões de ação:
    • Aprovar → W3 approve_compliance
    • Rejeitar → W3 reject_compliance  
    • Salvar Rascunho → Mantém EM_REVISAO
</ComplianceReviewForm>
```

---

## 🔧 AÇÕES DISPONÍVEIS (W3 Webhook Update)

### **1. approve_compliance**
```json
POST /webhook-update
{
  "org_id": "org123",
  "oficio_id": "oficio789",
  "action": "approve_compliance",
  "dados_de_apoio_compliance": "Contexto adicional do analista...",
  "notas_internas": "Revisado e aprovado. Seguir modelo padrão.",
  "referencias_legais": [
    "Art. 5º da Lei 105/2001",
    "Resolução CNJ 123/2020"
  ],
  "assigned_user_id": "user456"
}
```

**Resultado:**
- Status → `APROVADO_COMPLIANCE`
- Dispara W4 (Composição de Resposta com RAG)
- Campos enriquecidos com contexto humano

---

### **2. reject_compliance**
```json
POST /webhook-update
{
  "org_id": "org123",
  "oficio_id": "oficio789",
  "action": "reject_compliance",
  "motivo": "Dados insuficientes. PDF ilegível, requerer ofício original físico."
}
```

**Resultado:**
- Status → `REPROVADO_COMPLIANCE`
- Ofício marcado para tratamento especial
- Não gera resposta automática

---

### **3. add_context**
```json
POST /webhook-update
{
  "org_id": "org123",
  "oficio_id": "oficio789",
  "action": "add_context",
  "dados_de_apoio_compliance": "Processo já teve decisão anterior favorável...",
  "referencias_legais": ["Precedente STJ REsp 1.234.567"]
}
```

**Resultado:**
- Mantém status atual
- Enriquece dados sem aprovar ainda
- Permite múltiplas adições de contexto

---

### **4. assign_user**
```json
POST /webhook-update
{
  "org_id": "org123",
  "oficio_id": "oficio789",
  "action": "assign_user",
  "assigned_user_id": "user456"
}
```

**Resultado:**
- Atribui responsável
- Útil para SLA Monitoring (W2)
- Alertas vão para responsável

---

## 📊 STATUS DO CICLO DE VIDA

### **Fluxo Completo com HITL:**

```
AGUARDANDO_PROCESSAMENTO
  ↓ W1 Ingestão
EM_PROCESSAMENTO
  ↓ W1 OCR + LLM
  ├─→ Confiança ALTA → AGUARDANDO_RESPOSTA (skip HITL)
  └─→ Confiança BAIXA → AGUARDANDO_COMPLIANCE ⭐ HITL
       ↓ Analista abre Portal
     EM_ANALISE_COMPLIANCE
       ↓ Analista edita
     EM_REVISAO
       ↓ Analista decide:
       ├─→ ✅ Aprovar → APROVADO_COMPLIANCE
       │                  ↓ W4 Composição
       │                AGUARDANDO_ENVIO
       │                  ↓
       │                RESPONDIDO ✅
       │
       └─→ ❌ Rejeitar → REPROVADO_COMPLIANCE ❌
```

---

## 🛠️ STACK TÉCNICO DO PORTAL

### **Frontend:**
```typescript
// Página
app/revisao/[id]/page.tsx

// Componentes
components/hitl/DocumentViewer.tsx      // PDF + OCR
components/hitl/ExtractionResults.tsx   // IA output
components/hitl/ComplianceForm.tsx      // Edição
components/hitl/ActionButtons.tsx       // Aprovar/Rejeitar

// Hooks
hooks/useOficioHITL.tsx                 // Fetch ofício
hooks/useWebhookActions.tsx             // POST W3

// Lib
lib/pdf-viewer.ts                       // react-pdf
lib/webhook-client.ts                   // API W3
```

### **Backend (W3):**
```python
funcoes/W3_webhook_update/main.py
  - Endpoint HTTP
  - RBAC validation
  - 4 actions: approve, reject, add_context, assign
  - Pub/Sub trigger para W4
  - Auditoria completa
```

---

## 🎯 O QUE PRECISA SER IMPLEMENTADO

### **Para Conectar Frontend → Backend Python:**

#### **1. API Gateway (Next.js API Routes)**
```typescript
// app/api/webhook/oficios/route.ts
export async function POST(request: Request) {
  // Proxy para W3 backend Python
  const pythonBackendUrl = process.env.PYTHON_BACKEND_URL;
  const firebaseToken = await getFirebaseToken();
  
  const response = await fetch(
    `${pythonBackendUrl}/webhook-update`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(await request.json())
    }
  );
  
  return response;
}
```

#### **2. Portal HITL Frontend**
```bash
Criar:
- app/revisao/[id]/page.tsx
- components/hitl/* (4 componentes)
- hooks/useOficioHITL.tsx
- lib/webhook-client.ts
```

#### **3. Integração Firestore**
```typescript
// Migrar de Supabase para Firestore (ou manter ambos)
// Supabase: CRUD básico
// Firestore: Dados completos com IA
```

---

## 📊 DADOS NECESSÁRIOS NO PORTAL

### **Ofício com IA (Firestore schema):**
```typescript
interface OficioFirestore {
  oficio_id: string;
  org_id: string;
  status: OficioStatus;
  
  // Dados extraídos pela IA
  dados_extraidos: {
    numero_oficio: string;
    numero_processo: string;
    autoridade_emissora: string;
    prazo_resposta: string;
    entidades_citadas: string[];
    classificacao_intencao: string;
    confianca_geral: number; // 0-1
  };
  
  // Contexto humano (HITL)
  dados_de_apoio_compliance?: string;
  notas_internas?: string;
  referencias_legais?: string[];
  
  // Atribuição
  assigned_user_id?: string;
  assigned_at?: string;
  
  // Auditoria
  aprovado_por?: string;
  aprovado_em?: string;
  
  // URLs
  conteudo_bruto: string; // Texto OCR
  anexos_urls: string[]; // PDFs originais
}
```

---

## ⚡ RESUMO - O que falta para HITL funcionar:

### **OPÇÃO 1A: Conectar com Backend Python** (Recomendado)

**Implementar:**
1. ✅ Frontend já tem
2. ❌ API Gateway (proxy Next.js → Python)
3. ❌ Portal HITL (/revisao/[id])
4. ❌ Integração Firestore (leitura)
5. ❌ Webhook client (POST W3)

**Esforço:** 1 semana  
**Resultado:** Features de IA + Revisão humana completas

---

### **OPÇÃO 1B: Implementar HITL Simplificado (Supabase)**

**Implementar:**
1. ✅ Frontend já tem
2. ❌ Portal de revisão manual (sem IA)
3. ❌ Campos de aprovação/rejeição
4. ❌ Status: pendente_revisao, aprovado, rejeitado

**Esforço:** 2-3 dias  
**Resultado:** Revisão humana básica (sem IA)

---

## 💬 DECISÃO:

**Você quer:**

**A)** Conectar com backend Python (IA completa + HITL enterprise)?  
**B)** Implementar HITL simplificado no Supabase (sem IA)?  
**C)** Pular HITL por enquanto (entrada manual de ofícios)?

---

**O Portal HITL é onde o analista humano:**
- 👀 Revisa o que a IA extraiu
- ✏️ Corrige dados se necessário
- 📝 Adiciona contexto jurídico
- ✅ Aprova para gerar resposta automática
- ❌ Rejeita se dados insuficientes

**É o ponto crítico de qualidade do sistema!**

---

Winston, o Architect 🏗️ - Qual opção seguimos?

