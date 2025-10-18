# 🎯 Portal HITL - Implementação Completa

## ✅ O QUE FOI IMPLEMENTADO

### **1. Design UX Guiado** ✅
**Arquivo:** `oficios-portal-frontend/HITL_UX_DESIGN.md`

- Wizard em 4 passos (Ver → Revisar → Corrigir → Aprovar)
- Design responsivo e acessível
- Mensagens contextuais inteligentes
- Feedback visual imediato
- Princípios UX aplicados (Progressive Disclosure, Clear Hierarchy, etc.)

---

### **2. API Gateway** ✅
**Arquivos:**
- `src/lib/python-backend.ts` - Cliente TypeScript para backend Python
- `src/app/api/webhook/oficios/route.ts` - Proxy Next.js → Cloud Functions

**Funcionalidades:**
- ✅ Aprovar ofício
- ✅ Rejeitar ofício
- ✅ Adicionar contexto
- ✅ Atribuir responsável
- ✅ Buscar ofício do Firestore
- ✅ Listar ofícios aguardando compliance

---

### **3. Componentes HITL** ✅

#### **WizardSteps** (`src/components/hitl/WizardSteps.tsx`)
- Navegação visual em 4 etapas
- Indicador de progresso animado
- Permite voltar para etapas anteriores

#### **ConfidenceBadge** (`src/components/hitl/ConfidenceBadge.tsx`)
- Badge de confiança com cores (Verde/Amarelo/Vermelho)
- Barra de progresso visual
- Badge geral de confiança do ofício

#### **DocumentViewer** (`src/components/hitl/DocumentViewer.tsx`)
- Visualizador de PDF embutido
- Alternância PDF ↔ Texto OCR
- Controles de zoom
- Download de documento

#### **ExtractionResults** (`src/components/hitl/ExtractionResults.tsx`)
- Lista de campos extraídos pela IA
- Confiança por campo
- Alertas para campos com baixa confiança
- Visual hierárquico

#### **ComplianceReviewForm** (`src/components/hitl/ComplianceReviewForm.tsx`)
- Formulário de edição completo
- Validação inline
- Contexto jurídico (opcional)
- Referências legais
- Notas internas (privadas)
- Atribuição de responsável
- Botões de ação: Salvar / Aprovar / Rejeitar

---

### **4. Página Principal** ✅
**Arquivo:** `src/app/revisao/[id]/page.tsx`

- Rota dinâmica: `/revisao/[id]`
- Integração completa dos componentes
- Split view: PDF + Dados
- Modal de sucesso após aprovação
- Redirecionamento automático
- Carregamento com skeleton

---

### **5. Integração Dashboard** ✅
**Arquivo:** `src/app/dashboard/page.tsx`

- Seção "Ofícios Aguardando Revisão" (desabilitada por padrão)
- Cards com ofícios pendentes
- Confiança visual
- CTA "REVISAR AGORA"
- Contador de dias restantes

---

## 📋 O QUE FALTA IMPLEMENTAR

### **ETAPA 1: Conectar com Backend Python** 🔴
**Status:** Pendente  
**Prioridade:** CRÍTICA

**Tarefas:**
1. [ ] Configurar variáveis de ambiente:
   ```bash
   NEXT_PUBLIC_PYTHON_BACKEND_URL=https://southamerica-east1-oficio-noficios.cloudfunctions.net
   PYTHON_BACKEND_URL=https://southamerica-east1-oficio-noficios.cloudfunctions.net/webhook-update
   GCP_PROJECT_ID=oficio-noficios
   FIREBASE_ADMIN_TOKEN=<obter do Firebase>
   ```

2. [ ] Implementar autenticação Firebase no frontend:
   - Obter Firebase token do usuário autenticado
   - Substituir `mock-token-for-development` em `python-backend.ts`

3. [ ] Testar chamadas ao W3:
   ```bash
   curl -X POST https://southamerica-east1-oficio-noficios.cloudfunctions.net/webhook-update \
     -H "Authorization: Bearer <firebase-token>" \
     -H "Content-Type: application/json" \
     -d '{
       "org_id": "org_test",
       "oficio_id": "oficio_123",
       "action": "approve_compliance",
       "dados_de_apoio_compliance": "Teste de aprovação"
     }'
   ```

---

### **ETAPA 2: Sincronizar Supabase ↔ Firestore** 🔴
**Status:** Pendente  
**Prioridade:** ALTA

**Problema:**
- Frontend usa Supabase (PostgreSQL)
- Backend Python usa Firestore (NoSQL)
- Dados precisam estar em ambos

**Soluções Possíveis:**

#### **Opção A: Dual Write (Rápido)**
```python
# Na Cloud Function W1 (processamento)
def processar_oficio(email_data):
    # 1. Salvar no Firestore (principal)
    firestore_client.collection('oficios').add(oficio_data)
    
    # 2. Salvar no Supabase (para frontend)
    supabase_client.table('oficios').insert({
        'oficio_id': oficio_data['oficio_id'],
        'numero': oficio_data['dados_extraidos']['numero_oficio'],
        'status': oficio_data['status'],
        # ... outros campos
    }).execute()
```

#### **Opção B: Webhook Sync (Robusto)**
```python
# Criar Cloud Function de sincronização
@functions_framework.http
def sync_to_supabase(request):
    """
    Chamada pelo W1, W3, W4 após cada atualização
    """
    oficio_id = request.json['oficio_id']
    
    # Buscar do Firestore
    doc = firestore.collection('oficios').document(oficio_id).get()
    
    # Sincronizar com Supabase
    supabase.table('oficios').upsert(transform_to_supabase(doc)).execute()
```

#### **Opção C: Migração Total para Supabase (Longo Prazo)**
- Migrar backend Python para usar Supabase como DB principal
- Remover Firestore completamente
- Usar Supabase Realtime para eventos

**Recomendação:** Opção A para MVP, migrar para C depois.

---

### **ETAPA 3: Habilitar Seção HITL no Dashboard** 🟡
**Status:** Código pronto, desabilitado  
**Prioridade:** MÉDIA

**Arquivo:** `src/app/dashboard/page.tsx` linha 92

Alterar:
```typescript
{false && ( // Habilitar quando integrado com backend
```

Para:
```typescript
{oficiosAguardandoRevisao.length > 0 && (
```

E adicionar hook:
```typescript
const [oficiosAguardandoRevisao, setOficiosAguardandoRevisao] = useState([]);

useEffect(() => {
  if (user) {
    // Buscar do backend Python
    fetch('/api/webhook/oficios/list-pending')
      .then(res => res.json())
      .then(data => setOficiosAguardandoRevisao(data.oficios || []));
  }
}, [user]);
```

---

### **ETAPA 4: Implementar Visualizador PDF Real** 🟡
**Status:** Usando iframe placeholder  
**Prioridade:** MÉDIA

**Opções:**

#### **Opção 1: react-pdf (Recomendado)**
```bash
npm install react-pdf
```

```typescript
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';

<Document file={pdfUrl}>
  <Page pageNumber={pageNumber} />
</Document>
```

#### **Opção 2: PDF.js direto**
```bash
npm install pdfjs-dist
```

#### **Opção 3: Manter iframe** (funciona, mas limitado)
Adicionar:
```typescript
sandbox="allow-scripts allow-same-origin"
```

---

### **ETAPA 5: Implementar Lista de Usuários** 🟢
**Status:** Dropdown hardcoded  
**Prioridade:** BAIXA

**Arquivo:** `src/components/hitl/ComplianceReviewForm.tsx` linha 147

Substituir por:
```typescript
const [usuarios, setUsuarios] = useState([]);

useEffect(() => {
  // Buscar usuários da organização
  fetch('/api/usuarios')
    .then(res => res.json())
    .then(data => setUsuarios(data.usuarios));
}, []);

<select>
  <option value="">Nenhum (sem atribuição)</option>
  {usuarios.map(u => (
    <option key={u.id} value={u.id}>{u.nome}</option>
  ))}
</select>
```

---

### **ETAPA 6: Tratamento de Erros** 🟢
**Status:** Básico implementado  
**Prioridade:** BAIXA

**Melhorias:**
- Toast notifications (react-hot-toast)
- Retry automático em falhas de rede
- Offline detection
- Logs estruturados

---

## 🚀 COMO TESTAR (Passo a Passo)

### **Teste 1: Navegação Básica**
```bash
# 1. Rodar frontend
cd oficios-portal-frontend
npm run dev

# 2. Acessar
http://localhost:3000/revisao/mock-1
```

**Esperado:**
- ✅ Wizard aparece com 4 passos
- ✅ Step 1 ativo (azul pulsante)
- ✅ Documento placeholder carrega
- ✅ Botão "CONTINUAR" funciona

---

### **Teste 2: Fluxo Completo Mock**
```bash
# Acessar
http://localhost:3000/revisao/mock-1
```

**Fluxo:**
1. **Step 1:** Ver PDF → Clicar "CONTINUAR"
2. **Step 2:** Ver dados IA → Observar badges de confiança → Clicar "CORRIGIR"
3. **Step 3:** 
   - Editar campo "Autoridade" (adicionar texto)
   - Adicionar referência legal: "Art. 5º Lei 105/2001"
   - Escolher responsável: "João Silva"
   - Clicar "SALVAR RASCUNHO" → ✅ Alert "Salvo"
   - Clicar "APROVAR" → ✅ Modal de sucesso
4. **Step 4:** Redireciona para `/dashboard`

---

### **Teste 3: Integração Backend (Quando pronto)**
```typescript
// Substituir mock em src/app/revisao/[id]/page.tsx linha 59

// ANTES (mock):
const mockData: OficioData = { ... };
setOficio(mockData);

// DEPOIS (real):
const response = await fetch(
  `/api/webhook/oficios?org_id=org_001&oficio_id=${oficioId}`
);
const data = await response.json();
setOficio(data.oficio);
```

---

## 🎨 DESIGN TOKENS

### **Cores por Confiança**
```css
Alta (>88%):   #10B981 (green-500)
Média (70-88%): #F59E0B (yellow-500)
Baixa (<70%):  #EF4444 (red-500)
```

### **Animações**
```css
Wizard Pulse:   animate-pulse (Tailwind)
Loading:        animate-spin
Success:        animate-bounce
```

### **Tipografia**
```css
Headings: font-bold text-white
Body:     text-gray-300
Labels:   text-sm text-gray-400
```

---

## 📊 FLUXO DE DADOS

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend (Next.js)
    participant AG as API Gateway (/api/webhook)
    participant W3 as Backend Python (W3)
    participant FS as Firestore
    participant SB as Supabase

    U->>F: Acessa /revisao/[id]
    F->>AG: GET /api/webhook/oficios?oficio_id=X
    AG->>W3: GET Cloud Function
    W3->>FS: Busca ofício
    FS-->>W3: Retorna dados + IA
    W3-->>AG: JSON com confiança
    AG-->>F: Renderiza wizard
    F-->>U: Mostra Step 1

    U->>F: Edita campos + Clica "APROVAR"
    F->>AG: POST /api/webhook/oficios {action: approve_compliance}
    AG->>W3: webhook-update
    W3->>FS: Atualiza status → APROVADO_COMPLIANCE
    W3->>W4: Dispara composição de resposta (Pub/Sub)
    W3->>SB: Sincroniza com Supabase (opcional)
    W3-->>AG: { success: true }
    AG-->>F: Success
    F-->>U: Modal sucesso → Redireciona
```

---

## 🔐 SEGURANÇA

### **Autenticação**
- ✅ Supabase Auth no frontend
- 🔴 Firebase Auth para backend Python (pendente)
- ✅ Token JWT em headers

### **RBAC**
- ✅ Backend tem decorador `@rbac_required`
- 🔴 Frontend não valida roles ainda

### **Validação**
- ✅ Campos obrigatórios no formulário
- ✅ Validação de datas
- 🔴 Sanitização de inputs (adicionar)

---

## 📝 PRÓXIMOS PASSOS RECOMENDADOS

### **Sprint 1: MVP Funcional (3-5 dias)** 🎯
1. ✅ Design UX completo
2. ✅ Componentes implementados
3. 🔴 Conectar com W3 (backend Python)
4. 🔴 Dual Write: Firestore + Supabase
5. 🔴 Habilitar seção HITL no dashboard

### **Sprint 2: Produção (3-5 dias)**
1. 🔴 Visualizador PDF real (react-pdf)
2. 🔴 Lista de usuários dinâmica
3. 🔴 Tratamento de erros robusto
4. 🔴 Testes E2E (Playwright)
5. 🔴 Deploy VPS

### **Sprint 3: Otimizações (2-3 dias)**
1. 🔴 Animações suaves (Framer Motion)
2. 🔴 Keyboard shortcuts
3. 🔴 Logs e analytics
4. 🔴 Performance (lazy loading)

---

## 🎓 GUIA PARA O USUÁRIO

### **Como Revisar um Ofício**

#### **1️⃣ ACESSAR REVISÃO**
No dashboard, clique em "REVISAR AGORA" no card do ofício.

#### **2️⃣ STEP 1: VER DOCUMENTO**
- Leia o PDF original
- Use zoom se necessário
- Alterne para "Ver Texto (OCR)" se PDF estiver ruim
- Clique "CONTINUAR"

#### **3️⃣ STEP 2: REVISAR DADOS IA**
- Veja os campos que a IA extraiu
- Observe as barras de confiança:
  - 🟢 Verde (>88%): Alta confiança
  - 🟡 Amarelo (70-88%): Revise com atenção
  - 🔴 Vermelho (<70%): Confira no PDF!
- Clique "CORRIGIR DADOS"

#### **4️⃣ STEP 3: CORRIGIR**
- **Dados Principais:** Corrija campos em amarelo/vermelho
- **Contexto Jurídico (Opcional):**
  - Adicione informações que ajudem a IA
  - Inclua referências legais
  - Escreva notas internas (privadas)
  - Atribua responsável
- Clique "SALVAR RASCUNHO" para pausar
- Clique "APROVAR" quando pronto

#### **5️⃣ APROVAÇÃO**
- ✅ A IA gerará uma resposta automaticamente
- Você receberá notificação quando estiver pronta
- Pode revisar e editar antes de enviar

---

## ❓ FAQ

**P: Como sei se preciso revisar um ofício?**  
R: Aparecerá no dashboard em "Ofícios Aguardando Sua Revisão" (quando habilitado).

**P: O que é "confiança" da IA?**  
R: É o quanto a IA tem certeza de que leu corretamente. <80% = revisar com atenção.

**P: Posso rejeitar um ofício?**  
R: Sim, clique "Rejeitar Ofício" e informe o motivo (ex: PDF ilegível).

**P: As notas internas são privadas?**  
R: Sim, não aparecem na resposta ao ofício. São apenas para sua equipe.

**P: E se eu fechar a aba?**  
R: Use "Salvar Rascunho" antes. Suas alterações serão mantidas.

---

## 🏗️ ARQUITETURA TÉCNICA

### **Frontend Stack**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase Client

### **Backend Stack (Existente)**
- Python 3.12
- Google Cloud Functions
- Firestore
- Groq API (LLM)
- Cloud Vision API (OCR)

### **Integrações**
- API Gateway: Next.js API Routes
- Auth: Supabase + Firebase
- Storage: Supabase Storage + GCS
- DB: Supabase (frontend) + Firestore (backend)

---

## 🎯 MÉTRICAS DE SUCESSO

### **UX**
- ✅ Usuário completa revisão em < 2 minutos
- ✅ Taxa de erro < 5%
- ✅ NPS > 8/10

### **Performance**
- ✅ Carregamento da página < 2s
- ✅ Tempo de resposta API < 500ms
- ✅ FCP < 1.5s

### **Negócio**
- ✅ 100% dos ofícios com confiança <88% revisados
- ✅ Tempo de resposta médio reduzido em 50%
- ✅ Zero prazos perdidos

---

**Portal HITL pronto para integração final! 🚀**

