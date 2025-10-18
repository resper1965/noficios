# 🔄 Integração Supabase - Backend Python

## 📋 **RESUMO**

Guia para adicionar sincronização Supabase no backend Python/GCP.

**Objetivo:** Dual Write - Firestore (principal) + Supabase (frontend)

---

## 📦 **INSTALAÇÃO**

### **1. Adicionar Dependência**

```bash
cd oficios-automation

# requirements.txt
echo "supabase-py>=2.0.0" >> requirements.txt

# Instalar
pip install -r requirements.txt
```

### **2. Configurar Variáveis de Ambiente**

**Arquivo:** `.env` ou Secrets Manager

```bash
# Supabase (para dual write)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJ...  # Service Role Key (server-side)
```

**Como obter Service Key:**
1. Ir ao [Supabase Dashboard](https://app.supabase.com)
2. Settings → API
3. Copiar "service_role" key (⚠️  NUNCA expor ao cliente!)

---

## 🔧 **INTEGRAÇÃO W1 (Processamento)**

### **Arquivo:** `funcoes/W1_process_email/main.py`

```python
from utils.supabase_sync import sync_oficio_to_supabase

@functions_framework.http
def process_email(request: Request) -> Tuple[Dict[str, Any], int]:
    """
    W1: Ingestão + OCR + LLM Extraction
    """
    try:
        # ... código existente ...
        
        # 1. Extrair dados com OCR + LLM
        oficio_data = extract_oficio_data(pdf_url)
        
        # 2. Salvar no Firestore (principal)
        doc_ref = firestore_client.collection('oficios').add(oficio_data)
        oficio_id = doc_ref[1].id
        oficio_data['oficio_id'] = oficio_id
        
        # 3. 🆕 SINCRONIZAR COM SUPABASE (Dual Write)
        sync_result = sync_oficio_to_supabase(oficio_data)
        
        if sync_result:
            logger.info(f'✅ Ofício {oficio_id} sincronizado com Supabase')
        else:
            logger.warning(f'⚠️  Ofício {oficio_id} NÃO sincronizado com Supabase')
        
        # 4. Continuar processamento normal
        # Pub/Sub para W2 (SLA monitoring)
        # ...
        
        return {'success': True, 'oficio_id': oficio_id}, 200
    
    except Exception as e:
        logger.error(f'Erro em W1: {e}')
        return {'error': str(e)}, 500
```

---

## 🔧 **INTEGRAÇÃO W3 (Webhook Update)**

### **Arquivo:** `funcoes/W3_webhook_update/main.py`

```python
from utils.supabase_sync import sync_oficio_to_supabase

@rbac_required(allowed_roles=[ROLE_ORG_ADMIN, ROLE_USER])
def handle_webhook_update(request: Request, auth_context: AuthContext) -> tuple:
    """
    W3: Webhook Update (Aprovação HITL)
    """
    try:
        data = request.get_json()
        oficio_id = data['oficio_id']
        action = data['action']
        
        # ... validações ...
        
        # 1. Buscar ofício do Firestore
        doc_ref = firestore_client.collection('oficios').document(oficio_id)
        oficio_doc = doc_ref.get()
        
        if not oficio_doc.exists:
            return {'error': 'Ofício não encontrado'}, 404
        
        oficio_data = oficio_doc.to_dict()
        
        # 2. Atualizar status conforme ação
        update_data = {}
        
        if action == 'approve_compliance':
            update_data['status'] = OficioStatus.APROVADO_COMPLIANCE.value
            update_data['approved_by'] = auth_context.user_id
            update_data['approved_at'] = datetime.utcnow().isoformat()
            
            # Adicionar contexto jurídico
            if 'dados_de_apoio_compliance' in data:
                update_data['dados_de_apoio_compliance'] = data['dados_de_apoio_compliance']
            
            if 'referencias_legais' in data:
                update_data['referencias_legais'] = data['referencias_legais']
        
        elif action == 'reject_compliance':
            update_data['status'] = OficioStatus.REPROVADO_COMPLIANCE.value
            update_data['motivo_rejeicao'] = data.get('motivo', '')
        
        # 3. Atualizar Firestore (principal)
        doc_ref.update(update_data)
        
        # 4. 🆕 SINCRONIZAR COM SUPABASE (Dual Write)
        oficio_data.update(update_data)
        sync_result = sync_oficio_to_supabase(oficio_data)
        
        if sync_result:
            logger.info(f'✅ Atualização sincronizada com Supabase')
        else:
            logger.warning(f'⚠️  Atualização NÃO sincronizada com Supabase')
        
        # 5. Se aprovado, disparar W4 (RAG + Resposta)
        if action == 'approve_compliance':
            pubsub_topic = 'oficios-compose-response'
            publisher.publish(pubsub_topic, json.dumps({
                'oficio_id': oficio_id,
                'org_id': oficio_data['org_id']
            }).encode('utf-8'))
            logger.info(f'📤 W4 disparado para ofício {oficio_id}')
        
        return {'success': True, 'oficio_id': oficio_id}, 200
    
    except Exception as e:
        logger.error(f'Erro em W3: {e}')
        return {'error': str(e)}, 500
```

---

## 🔧 **INTEGRAÇÃO W5 (Arquivamento)**

### **Arquivo:** `funcoes/W5_archive/main.py`

```python
from utils.supabase_sync import delete_oficio_from_supabase

def archive_oficio(oficio_id: str, user_id: str):
    """
    W5: Arquivar ofício
    """
    try:
        # 1. Atualizar Firestore
        doc_ref = firestore_client.collection('oficios').document(oficio_id)
        doc_ref.update({'status': 'ARQUIVADO', 'archived_at': datetime.utcnow()})
        
        # 2. 🆕 DELETAR DO SUPABASE (não precisa mais no frontend)
        delete_result = delete_oficio_from_supabase(oficio_id, user_id)
        
        if delete_result:
            logger.info(f'✅ Ofício {oficio_id} removido do Supabase')
        
        return {'success': True}, 200
    
    except Exception as e:
        logger.error(f'Erro ao arquivar: {e}')
        return {'error': str(e)}, 500
```

---

## 🔍 **BATCH SYNC (Migração Inicial)**

Se já tem ofícios no Firestore e precisa popular Supabase:

### **Script de Migração:**

```python
"""
migrate_to_supabase.py - Sincronizar todos ofícios existentes
"""

from google.cloud import firestore
from utils.supabase_sync import batch_sync_oficios_to_supabase
import asyncio

def migrate_all_oficios():
    """Migrar todos ofícios do Firestore para Supabase"""
    
    # 1. Buscar todos ofícios do Firestore
    firestore_client = firestore.Client()
    oficios_ref = firestore_client.collection('oficios')
    
    # Limitar batch (evitar timeout)
    batch_size = 100
    oficios_docs = oficios_ref.limit(batch_size).stream()
    
    firestore_data = []
    for doc in oficios_docs:
        data = doc.to_dict()
        data['oficio_id'] = doc.id
        firestore_data.append(data)
    
    print(f'📋 Encontrados {len(firestore_data)} ofícios para migrar')
    
    # 2. Sincronizar em batch
    result = asyncio.run(batch_sync_oficios_to_supabase(firestore_data))
    
    print(f'✅ Migração completa: {result["success"]} sucesso, {result["failed"]} falhas')
    
    return result

if __name__ == '__main__':
    migrate_all_oficios()
```

**Executar:**
```bash
cd oficios-automation
python migrate_to_supabase.py
```

---

## ⚠️  **IMPORTANTE**

### **1. Service Key - Segurança**
```bash
# ❌ NUNCA expor Service Key no frontend
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=xxx  # ERRADO!

# ✅ Apenas no backend (server-side)
SUPABASE_SERVICE_KEY=xxx  # CORRETO
```

### **2. Tratamento de Erros**

```python
# Sincronização Supabase NÃO deve bloquear processamento principal
try:
    sync_oficio_to_supabase(oficio_data)
except Exception as e:
    # Log mas NÃO falhar toda requisição
    logger.error(f'Erro ao sincronizar Supabase: {e}')
    # Continuar processamento normalmente
```

### **3. Row Level Security (RLS)**

Supabase precisa ter RLS configurado:

```sql
-- Permitir backend Python bypasser RLS (usa Service Key)
-- RLS aplicado apenas para clientes frontend

ALTER TABLE oficios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role bypass"
ON oficios
AS PERMISSIVE
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Users can only see their own oficios"
ON oficios
FOR SELECT
TO authenticated
USING (auth.uid() = "userId");
```

---

## ✅ **CHECKLIST DE INTEGRAÇÃO**

### **Backend Python:**
- [ ] Instalar `supabase-py`
- [ ] Adicionar variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`
- [ ] Copiar `utils/supabase_sync.py` para projeto
- [ ] Modificar W1 (processamento) - adicionar sync após save
- [ ] Modificar W3 (webhook-update) - adicionar sync após update
- [ ] Modificar W5 (arquivamento) - adicionar delete
- [ ] Testar sync em desenvolvimento
- [ ] Deploy em produção (Cloud Functions)

### **Supabase:**
- [ ] RLS habilitado na tabela `oficios`
- [ ] Policy para service_role criada
- [ ] Service Key copiada para backend

### **Teste:**
- [ ] Processar email novo → Aparece no Supabase
- [ ] Aprovar ofício → Status atualizado no Supabase
- [ ] Rejeitar ofício → Status atualizado no Supabase
- [ ] Arquivar ofício → Removido do Supabase

---

## 📊 **MONITORAMENTO**

### **Logs esperados:**

```
✅ Cliente Supabase inicializado
✅ Ofício abc123 sincronizado com Supabase
📊 Batch sync: 95 sucesso, 5 falhas
⚠️  Ofício xyz789 NÃO sincronizado com Supabase
❌ Erro ao sincronizar com Supabase: ConnectionError
```

### **Métricas:**
- Taxa de sucesso de sincronização: > 99%
- Latência adicional por sync: < 100ms
- Erros de sync não bloqueiam processamento principal

---

## 🎯 **RESULTADO ESPERADO**

Após integração completa:

- ✅ **Firestore:** Banco principal (backend Python)
- ✅ **Supabase:** Replica para frontend (Next.js)
- ✅ **Sincronização:** Automática em toda ação
- ✅ **Fallback:** Frontend funciona mesmo se Python offline
- ✅ **Consistência:** Dados sempre atualizados

---

**Dual Write implementado! 🔄**

**Tempo estimado:** 8 horas (incluindo testes)  
**Complexidade:** Alta (mexe em backend produção)  
**Risco:** Médio (adicionar sync não quebra código existente)

