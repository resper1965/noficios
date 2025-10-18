# 🎯 PLANO DE FINALIZAÇÃO - n.Oficios

**BMad Master - Planejamento Executivo**  
**Data:** 18 de outubro de 2025  
**Objetivo:** Completar integração Frontend ↔ Backend e entregar aplicação funcional

---

## 📊 SITUAÇÃO ATUAL

### ✅ **COMPLETO**
1. **Backend Python/GCP** - 100% implementado
   - 15 Cloud Functions deployadas
   - OCR + LLM + RAG funcionando
   - W3 webhook-update pronto
   
2. **Frontend Next.js** - 100% implementado
   - Portal HITL com UX guiada (4 passos)
   - Dashboard funcional
   - Supabase integrado
   - Deploy VPS automatizado

### ❌ **PENDENTE**
1. Integração Frontend → Backend Python
2. Sincronização Supabase ↔ Firestore
3. Ativação do fluxo HITL completo
4. Testes end-to-end

---

## 🏗️ ARQUITETURA FINAL (HÍBRIDA)

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (Next.js + Supabase)                               │
│ - Auth: Supabase                                            │
│ - DB: PostgreSQL (dados básicos)                            │
│ - UI: Portal HITL completo                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │ API Gateway (Next.js API Routes)
                   │
┌──────────────────▼──────────────────────────────────────────┐
│ BACKEND (Python/GCP)                                        │
│ - OCR: Cloud Vision                                         │
│ - LLM: Groq API                                             │
│ - RAG: Vector DB                                            │
│ - DB: Firestore (processamento IA)                          │
└─────────────────────────────────────────────────────────────┘
```

**Vantagens:**
- ✅ Melhor dos dois mundos
- ✅ Frontend bonito + Backend inteligente
- ✅ Aproveita 100% do código atual
- ✅ Escalável para futuro

---

## 📋 TAREFAS DE FINALIZAÇÃO

### **SPRINT 1: Integração Backend (2-3 dias)** 🔴 CRÍTICO

#### **Tarefa 1.1: Configurar Autenticação Cross-Platform**
**Responsável:** Architect  
**Tempo:** 4 horas  
**Prioridade:** CRÍTICA

**Ações:**
- [ ] Instalar Firebase SDK no frontend
- [ ] Configurar dual auth (Supabase + Firebase)
- [ ] Implementar `getFirebaseToken()` real
- [ ] Testar token válido para backend Python

**Arquivos:**
- `src/lib/python-backend.ts` (linha 18)
- `package.json` (adicionar firebase)

**Comando:**
```bash
npm install firebase
```

---

#### **Tarefa 1.2: Criar API Gateway Completo**
**Responsável:** Architect  
**Tempo:** 6 horas  
**Prioridade:** CRÍTICA

**Ações:**
- [ ] Endpoint `/api/webhook/oficios/list-pending`
- [ ] Endpoint `/api/webhook/oficios/get`
- [ ] Proxy para todos endpoints W3
- [ ] Tratamento de erros robusto
- [ ] Logs estruturados

**Arquivos:**
- `src/app/api/webhook/oficios/route.ts` (expandir)
- Novo: `src/app/api/webhook/oficios/list-pending/route.ts`

---

#### **Tarefa 1.3: Sincronizar Supabase ↔ Firestore**
**Responsável:** Architect  
**Tempo:** 8 horas  
**Prioridade:** ALTA

**Ações:**
- [ ] Dual Write na W1 (processamento)
- [ ] Dual Write na W3 (webhook-update)
- [ ] Sincronização bidirecional
- [ ] Tratamento de conflitos
- [ ] Validação de consistência

**Arquivos Backend Python:**
- `oficios-automation/funcoes/W1_process_email/main.py`
- `oficios-automation/funcoes/W3_webhook_update/main.py`
- Novo: `oficios-automation/utils/supabase_sync.py`

**Código exemplo:**
```python
# utils/supabase_sync.py
from supabase import create_client
import os

supabase = create_client(
    os.environ.get('SUPABASE_URL'),
    os.environ.get('SUPABASE_SERVICE_KEY')
)

def sync_oficio_to_supabase(firestore_doc):
    """Sincroniza ofício do Firestore para Supabase"""
    return supabase.table('oficios').upsert({
        'oficio_id': firestore_doc['oficio_id'],
        'numero': firestore_doc['dados_extraidos']['numero_oficio'],
        'processo': firestore_doc['dados_extraidos']['numero_processo'],
        'autoridade': firestore_doc['dados_extraidos']['autoridade_emissora'],
        'prazo': firestore_doc['dados_extraidos']['prazo_resposta'],
        'status': firestore_doc['status'],
        'confianca_ia': firestore_doc['dados_extraidos']['confianca_geral'],
        'userId': firestore_doc['user_id'],
        'pdfUrl': firestore_doc.get('anexos_urls', [None])[0],
        'ocrText': firestore_doc.get('conteudo_bruto'),
        'dados_ia': firestore_doc['dados_extraidos'],
    }).execute()
```

---

### **SPRINT 2: Ativação HITL (1 dia)** 🟡 ALTA

#### **Tarefa 2.1: Substituir Mock por Dados Reais**
**Responsável:** Desenvolvedor  
**Tempo:** 2 horas  
**Prioridade:** ALTA

**Ações:**
- [ ] Remover mock data em `/revisao/[id]`
- [ ] Buscar dados via API Gateway
- [ ] Exibir PDF real do Supabase Storage
- [ ] Mostrar confiança real da IA

**Arquivos:**
- `src/app/revisao/[id]/page.tsx` (linha 81-115)

**Código:**
```typescript
const loadOficioData = async () => {
  const response = await fetch(
    `/api/webhook/oficios?org_id=org_001&oficio_id=${oficioId}`
  );
  const data = await response.json();
  setOficio(data.oficio);
};
```

---

#### **Tarefa 2.2: Habilitar Seção HITL no Dashboard**
**Responsável:** Desenvolvedor  
**Tempo:** 1 hora  
**Prioridade:** ALTA

**Ações:**
- [ ] Criar hook `useOficiosAguardandoRevisao`
- [ ] Alterar linha 92: `{false &&` → `{oficios.length > 0 &&`
- [ ] Buscar de `/api/webhook/oficios/list-pending`
- [ ] Testar cards de revisão

**Arquivos:**
- `src/app/dashboard/page.tsx` (linha 92)

---

#### **Tarefa 2.3: Implementar Fluxo Completo de Aprovação**
**Responsável:** Desenvolvedor  
**Tempo:** 3 horas  
**Prioridade:** ALTA

**Ações:**
- [ ] Conectar botão "APROVAR" → API Gateway
- [ ] Enviar dados para W3 webhook-update
- [ ] Atualizar Supabase após aprovação
- [ ] Mostrar notificação de sucesso
- [ ] Disparar W4 (geração de resposta)

**Arquivos:**
- `src/app/revisao/[id]/page.tsx` (linha 126-143)

---

### **SPRINT 3: Features Críticas (2-3 dias)** 🟢 MÉDIA

#### **Tarefa 3.1: Viewer PDF Real (react-pdf)**
**Responsável:** UX Expert  
**Tempo:** 4 horas  
**Prioridade:** MÉDIA

**Ações:**
- [ ] Instalar `react-pdf`
- [ ] Substituir iframe por componente React
- [ ] Adicionar navegação de páginas
- [ ] Zoom funcional
- [ ] Loading states

**Comando:**
```bash
npm install react-pdf pdfjs-dist
```

---

#### **Tarefa 3.2: Lista de Usuários Dinâmica**
**Responsável:** Desenvolvedor  
**Tempo:** 2 horas  
**Prioridade:** BAIXA

**Ações:**
- [ ] Criar tabela `usuarios` no Supabase
- [ ] API `/api/usuarios`
- [ ] Dropdown dinâmico no formulário HITL

---

#### **Tarefa 3.3: Toast Notifications**
**Responsável:** UX Expert  
**Tempo:** 2 horas  
**Prioridade:** BAIXA

**Ações:**
- [ ] Instalar `react-hot-toast`
- [ ] Substituir `alert()` por toasts
- [ ] Design consistente

---

### **SPRINT 4: Testes & Deploy (1 dia)** 🟣 CRÍTICO

#### **Tarefa 4.1: Testes End-to-End**
**Responsável:** QA  
**Tempo:** 4 horas  
**Prioridade:** CRÍTICA

**Ações:**
- [ ] Testar fluxo completo: Email → W1 → Dashboard → HITL → W3 → W4
- [ ] Validar sincronização Supabase ↔ Firestore
- [ ] Testar aprovação e rejeição
- [ ] Validar notificações

---

#### **Tarefa 4.2: Deploy Final**
**Responsável:** DevOps  
**Tempo:** 2 horas  
**Prioridade:** CRÍTICA

**Ações:**
- [ ] Deploy backend Python (se houver mudanças)
- [ ] Deploy frontend VPS
- [ ] Configurar variáveis de ambiente produção
- [ ] Smoke tests

**Comando:**
```bash
cd oficios-portal-frontend
./deploy-hitl.sh
```

---

## 📊 CRONOGRAMA

| Sprint | Tarefas | Tempo | Prioridade | Status |
|--------|---------|-------|------------|--------|
| **Sprint 1** | Integração Backend | 2-3 dias | 🔴 CRÍTICA | 🔴 Pendente |
| **Sprint 2** | Ativação HITL | 1 dia | 🟡 ALTA | 🔴 Pendente |
| **Sprint 3** | Features Críticas | 2-3 dias | 🟢 MÉDIA | 🔴 Pendente |
| **Sprint 4** | Testes & Deploy | 1 dia | 🟣 CRÍTICA | 🔴 Pendente |
| **TOTAL** | - | **6-8 dias** | - | - |

---

## 🎯 ENTREGAS FINAIS

### **MVP Funcional** (Após Sprint 1 + 2)
- ✅ Portal HITL conectado ao backend Python
- ✅ OCR + LLM extraction automático
- ✅ Fluxo de aprovação humana funcionando
- ✅ Sincronização Supabase ↔ Firestore

### **Produto Completo** (Após Sprint 4)
- ✅ PDF Viewer profissional
- ✅ Notificações elegantes
- ✅ Testes E2E passando
- ✅ Deploy em produção
- ✅ Documentação atualizada

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

### **Agora (Hoje):**
1. ✅ Criar este plano (FEITO)
2. 🔴 Iniciar Sprint 1 - Tarefa 1.1 (Autenticação)
3. 🔴 Configurar Firebase SDK

### **Amanhã:**
4. 🔴 API Gateway completo
5. 🔴 Sincronização Supabase ↔ Firestore

### **Esta Semana:**
6. 🔴 Testar fluxo HITL end-to-end
7. 🔴 Deploy MVP

---

## 📞 AGENTES NECESSÁRIOS

| Tarefa | Agente | Comando |
|--------|--------|---------|
| Arquitetura híbrida | Winston (Architect) | `@architect.md` |
| UX do Portal HITL | Sally (UX Expert) | `@ux-expert.md` |
| Código Python | Desenvolvedor | Manual |
| Testes E2E | QA | Playwright |

---

## ✅ CRITÉRIOS DE CONCLUSÃO

A aplicação estará **COMPLETA** quando:
- [ ] Portal HITL funciona com dados reais (não mock)
- [ ] Backend Python processa PDFs via OCR + LLM
- [ ] Aprovação humana dispara W4 (gera resposta)
- [ ] Sincronização Supabase ↔ Firestore funciona
- [ ] Deploy em produção funcionando
- [ ] Testes E2E passando

---

**Tempo estimado:** 6-8 dias úteis  
**Complexidade:** Média  
**Risco:** Baixo (código já existe, só integrar)

---

**🎯 VAMOS COMEÇAR?**

**Próximo comando:** Iniciar Sprint 1 - Tarefa 1.1 (Autenticação Cross-Platform)

