# 🎯 COMO USAR O PORTAL HITL - Guia Completo

## 📖 ÍNDICE
1. [O que é o Portal HITL?](#o-que-é-o-portal-hitl)
2. [Onde está a Análise Humana?](#onde-está-a-análise-humana)
3. [Como Testar Agora](#como-testar-agora)
4. [Como Fazer Deploy](#como-fazer-deploy)
5. [Como Conectar com Backend](#como-conectar-com-backend)
6. [Fluxo Passo a Passo do Usuário](#fluxo-passo-a-passo-do-usuário)

---

## 🎯 O que é o Portal HITL?

**HITL** = **H**uman **I**n **T**he **L**oop (Humano no Circuito)

É o portal de **revisão e aprovação** onde analistas humanos conferem e corrigem os dados que a IA extraiu dos ofícios antes de gerar a resposta automática.

### **Por que é necessário?**
Quando a IA lê um PDF de ofício, ela pode:
- ✅ Ter alta confiança (>88%) → Aprovação automática
- ⚠️  Ter média confiança (70-88%) → **Requer revisão humana**
- 🚨 Ter baixa confiança (<70%) → **Revisão crítica obrigatória**

O Portal HITL garante que **nenhum dado incorreto** vá para o sistema.

---

## 📍 Onde está a Análise Humana?

### **1. No Backend Python** ✅ **100% Implementado**

**Arquivo:** `oficios-automation/funcoes/W3_webhook_update/main.py`

**Endpoint:** `https://southamerica-east1-oficio-noficios.cloudfunctions.net/webhook-update`

**Ações disponíveis:**
- `approve_compliance` - Aprovar ofício → Dispara geração de resposta (W4)
- `reject_compliance` - Rejeitar ofício → Marca como inválido
- `add_context` - Adicionar contexto jurídico sem aprovar
- `assign_user` - Atribuir responsável

**Exemplo de chamada:**
```bash
curl -X POST https://southamerica-east1-oficio-noficios.cloudfunctions.net/webhook-update \
  -H "Authorization: Bearer <firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "org_001",
    "oficio_id": "oficio_123",
    "action": "approve_compliance",
    "dados_de_apoio_compliance": "Processo já teve decisão favorável em 2023",
    "referencias_legais": ["Art. 5º Lei 105/2001"],
    "assigned_user_id": "user_456"
  }'
```

---

### **2. No Frontend** ✅ **100% Implementado (aguarda integração)**

**Rota:** `/revisao/[id]`

**Componentes:**
- `WizardSteps` - Navegação em 4 passos
- `DocumentViewer` - Visualizador de PDF + OCR
- `ExtractionResults` - Dados extraídos pela IA
- `ComplianceReviewForm` - Formulário de edição
- `ConfidenceBadge` - Indicador de confiança

**API Gateway:**
- `POST /api/webhook/oficios` - Proxy para backend Python

---

## 🧪 Como Testar Agora

### **OPÇÃO 1: Teste Local (Desenvolvimento)**

```bash
# 1. Ir para o frontend
cd oficios-portal-frontend

# 2. Rodar em desenvolvimento
npm run dev

# 3. Acessar o Portal HITL
# Abra o navegador: http://localhost:3000/revisao/mock-1
```

**O que você verá:**
- ✅ Wizard com 4 passos (Ver → Revisar → Corrigir → Aprovar)
- ✅ Documento PDF placeholder
- ✅ Dados mockados com confiança 72%
- ✅ Formulário de edição completo
- ✅ Botões de aprovar/rejeitar

**Fluxo de teste:**
1. **Step 1:** Ver documento → Clicar "CONTINUAR"
2. **Step 2:** Ver dados IA → Observar badges de confiança → Clicar "CORRIGIR"
3. **Step 3:** 
   - Editar campo "Autoridade Emissora"
   - Adicionar referência: "Art. 5º Lei 105/2001"
   - Escolher responsável
   - Clicar "SALVAR RASCUNHO" → ✅ Alert
   - Clicar "APROVAR" → ✅ Modal de sucesso
4. **Redirecionado** para dashboard

---

### **OPÇÃO 2: Teste na VPS (Produção)**

```bash
# 1. Fazer deploy
cd oficios-portal-frontend
./deploy-hitl.sh

# 2. Acessar
# https://oficio.ness.tec.br/revisao/mock-1
```

**Pré-requisitos:**
- ✅ VPS configurada (62.72.8.164)
- ✅ Docker rodando
- ✅ Domínio apontado (oficio.ness.tec.br)

---

## 🚀 Como Fazer Deploy

### **Método Rápido (Script Automático)**

```bash
cd oficios-portal-frontend
./deploy-hitl.sh
```

Este script:
1. ✅ Faz build local
2. ✅ Cria .env para produção
3. ✅ Sincroniza arquivos via rsync
4. ✅ Rebuild containers Docker (sem cache)
5. ✅ Reinicia aplicação
6. ✅ Testa se está respondendo

**Tempo estimado:** 3-5 minutos

---

### **Método Manual (Passo a Passo)**

```bash
# 1. Build local
cd oficios-portal-frontend
npm run build

# 2. Sincronizar com VPS
rsync -avz --exclude 'node_modules' --exclude '.next' \
  ./ root@62.72.8.164:/opt/oficios/

# 3. Copiar .env
scp .env root@62.72.8.164:/opt/oficios/.env

# 4. SSH na VPS
ssh root@62.72.8.164

# 5. Rebuild e restart
cd /opt/oficios
docker-compose down
docker system prune -f --volumes
docker-compose build --no-cache --force-rm
docker-compose up -d --force-recreate

# 6. Verificar logs
docker-compose logs -f
```

---

## 🔌 Como Conectar com Backend Python

### **ETAPA 1: Configurar Variáveis de Ambiente**

**Arquivo:** `oficios-portal-frontend/.env` (ou `.env.deploy`)

```bash
# Backend Python/GCP
NEXT_PUBLIC_PYTHON_BACKEND_URL=https://southamerica-east1-oficio-noficios.cloudfunctions.net
NEXT_PUBLIC_GCP_PROJECT_ID=oficio-noficios

# Server-side only
PYTHON_BACKEND_URL=https://southamerica-east1-oficio-noficios.cloudfunctions.net/webhook-update
GCP_PROJECT_ID=oficio-noficios
FIREBASE_ADMIN_TOKEN=<obter do Firebase Console>
```

**Como obter FIREBASE_ADMIN_TOKEN:**
```bash
# 1. Ir ao Firebase Console
# https://console.firebase.google.com/project/oficio-noficios/settings/serviceaccounts/adminsdk

# 2. Gerar nova chave privada
# Baixar JSON

# 3. Extrair token (ou usar o JSON diretamente)
```

---

### **ETAPA 2: Implementar Autenticação Firebase no Frontend**

**Arquivo:** `src/lib/python-backend.ts` linha 18

**SUBSTITUIR:**
```typescript
private async getFirebaseToken(): Promise<string> {
  // TODO: Implementar quando migrar para Firebase
  // Por enquanto retorna token mock
  return 'mock-token-for-development';
}
```

**POR:**
```typescript
import { getAuth } from 'firebase/auth';

private async getFirebaseToken(): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }
  
  const token = await user.getIdToken();
  return token;
}
```

---

### **ETAPA 3: Sincronizar Supabase ↔ Firestore**

**Problema:** Frontend usa Supabase, Backend usa Firestore

**Solução Rápida (Dual Write):**

Adicionar na Cloud Function W1 (processamento):

```python
# oficios-automation/funcoes/W1_process_email/main.py

from supabase import create_client
import os

supabase = create_client(
    os.environ.get('SUPABASE_URL'),
    os.environ.get('SUPABASE_SERVICE_KEY')
)

def processar_oficio(email_data):
    # 1. Salvar no Firestore (principal)
    firestore_doc = firestore_client.collection('oficios').add(oficio_data)
    
    # 2. Sincronizar com Supabase (para frontend)
    supabase.table('oficios').insert({
        'oficio_id': oficio_data['oficio_id'],
        'numero': oficio_data['dados_extraidos']['numero_oficio'],
        'processo': oficio_data['dados_extraidos']['numero_processo'],
        'autoridade': oficio_data['dados_extraidos']['autoridade_emissora'],
        'prazo': oficio_data['dados_extraidos']['prazo_resposta'],
        'status': oficio_data['status'],
        'confianca_ia': oficio_data['dados_extraidos']['confianca_geral'],
        'userId': oficio_data['user_id'],
        'pdfUrl': oficio_data.get('anexos_urls', [None])[0],
        'ocrText': oficio_data.get('conteudo_bruto'),
    }).execute()
```

---

### **ETAPA 4: Habilitar Seção HITL no Dashboard**

**Arquivo:** `src/app/dashboard/page.tsx` linha 92

**ALTERAR:**
```typescript
{false && ( // Habilitar quando integrado com backend
```

**PARA:**
```typescript
{oficiosAguardandoRevisao.length > 0 && (
```

**E adicionar hook:**
```typescript
const [oficiosAguardandoRevisao, setOficiosAguardandoRevisao] = useState([]);

useEffect(() => {
  if (user) {
    fetch('/api/webhook/oficios/list-pending')
      .then(res => res.json())
      .then(data => setOficiosAguardandoRevisao(data.oficios || []));
  }
}, [user]);
```

---

### **ETAPA 5: Substituir Mock por Dados Reais**

**Arquivo:** `src/app/revisao/[id]/page.tsx` linha 81-115

**SUBSTITUIR:**
```typescript
const mockData: OficioData = { ... };
setOficio(mockData);
```

**POR:**
```typescript
const response = await fetch(
  `/api/webhook/oficios?org_id=org_001&oficio_id=${oficioId}`
);

if (!response.ok) {
  throw new Error('Ofício não encontrado');
}

const data = await response.json();
setOficio(data.oficio);
```

---

## 👨‍💼 Fluxo Passo a Passo do Usuário

### **CONTEXTO:**
Maria é analista jurídica e recebe uma notificação no dashboard: 
**"Você tem 3 ofícios aguardando revisão"**

---

### **PASSO 1: Acessar Dashboard**

1. Maria faz login em `https://oficio.ness.tec.br`
2. No dashboard, vê uma seção amarela em destaque:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Ofícios Aguardando Sua Revisão                           │
│ A IA extraiu dados e precisa da sua aprovação          3    │
│                                                  para revisar│
├─────────────────────────────────────────────────────────────┤
│ [Card] Ofício #12345 - TRF 1ª Região                        │
│ Confiança 72%  |  5 dias restantes                          │
│                                    [REVISAR AGORA →]        │
└─────────────────────────────────────────────────────────────┘
```

3. Clica em **"REVISAR AGORA"**

---

### **PASSO 2: Portal HITL - Step 1 (Ver Documento)**

**URL:** `/revisao/12345`

```
┌─────────────────────────────────────────────────────────────┐
│ Wizard: [1●─────2○─────3○─────4○]                          │
│         Ver    Revisar Corrigir Aprovar                     │
├─────────────────────────────────────────────────────────────┤
│ 📄 PASSO 1: Visualizar Documento Original                   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [PDF VIEWER - Ofício do TRF 1ª Região]                  │ │
│ │                                                         │ │
│ │ TRIBUNAL REGIONAL FEDERAL DA 1ª REGIÃO                  │ │
│ │ Ofício nº 12345                                         │ │
│ │ Processo: 1234567-89.2024.1.00.0000                     │ │
│ │ ...                                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💡 Dica: Leia o ofício para se familiarizar                 │
│                                                             │
│                          [CONTINUAR PARA PASSO 2 →]        │
└─────────────────────────────────────────────────────────────┘
```

Maria lê o PDF e clica **"CONTINUAR"**

---

### **PASSO 3: Step 2 (Revisar Dados IA)**

```
┌─────────────────────────────────────────────────────────────┐
│ Wizard: [1●─────2●─────3○─────4○]                          │
├─────────────────────────────────────────────────────────────┤
│ 🤖 PASSO 2: Revisar o que a IA Extraiu                      │
│                                                             │
│ ⚠️  ATENÇÃO: 2 campos com confiança baixa (<80%)           │
│     Revise com cuidado no próximo passo!                   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Número do Ofício          [████████░░ 82% ✅]           │ │
│ │ 12345                                                   │ │
│ │                                                         │ │
│ │ Número do Processo        [███████░░░ 75% ⚠️]          │ │
│ │ 1234567-89.2024.1.00.0000                               │ │
│ │ → Confira este campo com atenção!                       │ │
│ │                                                         │ │
│ │ Autoridade Emissora       [██████░░░░ 68% ⚠️]          │ │
│ │ TRF 1ª Região                                           │ │
│ │ → Confira este campo com atenção!                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [← VOLTAR]              [CORRIGIR DADOS NO PASSO 3 →]      │
└─────────────────────────────────────────────────────────────┘
```

Maria vê que 2 campos estão amarelos (confiança média). Clica **"CORRIGIR"**

---

### **PASSO 4: Step 3 (Corrigir e Enriquecer)**

```
┌─────────────────────────────────────────────────────────────┐
│ Wizard: [1●─────2●─────3●─────4○]                          │
├─────────────────────────────────────────────────────────────┤
│ ✏️  PASSO 3: Corrigir Dados e Adicionar Contexto            │
│                                                             │
│ ┌─ DADOS PRINCIPAIS ────────────────────────────────────┐   │
│ │ Autoridade Emissora *              ⚠️  Atenção!       │   │
│ │ [Tribunal Regional Federal 1ª Região____________] ▼   │   │
│ │ └→ A IA teve 68% de confiança. Confira o nome!        │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ CONTEXTO JURÍDICO (OPCIONAL) ───────────────────────┐   │
│ │ 📚 Adicione contexto que ajudará a IA:                │   │
│ │ [Este processo já teve decisão favorável em 2023___]  │   │
│ │                                                       │   │
│ │ 🔗 Referências Legais:                               │   │
│ │ • Art. 5º da Lei 105/2001             [x Remover]    │   │
│ │ [+ Adicionar referência]                             │   │
│ │                                                       │   │
│ │ 👤 Atribuir Responsável:                              │   │
│ │ [João Silva ▼]                                       │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ [SALVAR RASCUNHO]  [✅ APROVAR E GERAR RESPOSTA]           │
└─────────────────────────────────────────────────────────────┘
```

Maria:
1. Corrige "TRF 1ª Região" → "Tribunal Regional Federal da 1ª Região"
2. Adiciona contexto: "Este processo já teve decisão favorável em 2023"
3. Adiciona referência: "Art. 5º da Lei 105/2001"
4. Atribui para "João Silva"
5. Clica **"APROVAR"**

---

### **PASSO 5: Aprovação e Redirecionamento**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                  [✅ Ícone Animado]                          │
│                                                             │
│               ✅ Ofício Aprovado!                            │
│                                                             │
│       A IA está gerando a resposta automaticamente.         │
│                                                             │
│   Você será notificado quando estiver pronta para revisão.  │
│                                                             │
│                  [⏳ Carregando...]                          │
│                                                             │
│           Redirecionando para o dashboard...                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Após 3 segundos, Maria volta ao dashboard.

---

### **O QUE ACONTECE POR TRÁS:**

1. **Frontend** → `POST /api/webhook/oficios`
   ```json
   {
     "org_id": "org_001",
     "oficio_id": "12345",
     "action": "approve_compliance",
     "dados_de_apoio_compliance": "Este processo já teve...",
     "referencias_legais": ["Art. 5º Lei 105/2001"],
     "assigned_user_id": "joao_silva"
   }
   ```

2. **API Gateway** → Backend Python W3

3. **W3** atualiza Firestore:
   - Status: `AGUARDANDO_COMPLIANCE` → `APROVADO_COMPLIANCE`
   - Adiciona contexto e referências
   - Atribui responsável

4. **W3** dispara **W4** via Pub/Sub:
   - W4 busca base de conhecimento (RAG)
   - Gera resposta fundamentada usando Groq
   - Salva rascunho para revisão final

5. **Notificação** enviada para Maria:
   - "Ofício #12345 tem resposta pronta para revisão final"

---

## ✅ CHECKLIST DE INTEGRAÇÃO

### **Frontend**
- [x] Componentes HITL criados
- [x] API Gateway implementado
- [x] Rota `/revisao/[id]` funcional
- [ ] Autenticação Firebase integrada
- [ ] Mock substituído por dados reais
- [ ] Seção HITL habilitada no dashboard

### **Backend**
- [x] W3 webhook-update funcionando
- [ ] Dual Write: Firestore + Supabase
- [ ] Endpoint `/list-pending` criado
- [ ] RBAC validado no frontend

### **Deploy**
- [x] Script de deploy criado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy na VPS executado
- [ ] Testes E2E realizados

### **Documentação**
- [x] HITL_UX_DESIGN.md
- [x] PORTAL_HITL_COMPLETO.md
- [x] COMO_USAR_PORTAL_HITL.md

---

## 🎓 DÚVIDAS FREQUENTES

**P: O Portal HITL funciona sem backend Python?**  
R: Sim, com dados mock. Para produção, precisa conectar com W3.

**P: Posso testar agora?**  
R: Sim! Acesse `http://localhost:3000/revisao/mock-1`

**P: Como habilitar em produção?**  
R: Execute `./deploy-hitl.sh` e configure as variáveis de ambiente.

**P: E se eu quiser apenas Supabase (sem Firestore)?**  
R: É possível migrar o backend Python para Supabase. Requer ~5-7 dias de trabalho.

---

**Portal HITL pronto para uso! 🚀**

**Próximos Passos Recomendados:**
1. ✅ Testar localmente (`npm run dev`)
2. ✅ Fazer deploy (`./deploy-hitl.sh`)
3. 🔴 Configurar Firebase Auth
4. 🔴 Conectar com W3
5. 🔴 Habilitar no dashboard

**Tempo estimado para produção completa:** 2-3 dias de trabalho

