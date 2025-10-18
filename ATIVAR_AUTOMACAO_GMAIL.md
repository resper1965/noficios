# 🚀 ATIVAR AUTOMAÇÃO GMAIL - resper@ness.com.br

**Objetivo:** Processar emails reais do Gmail automaticamente

---

## 📋 OPÇÕES DISPONÍVEIS

### **Opção 1: MCP Gmail (Recomendado - Mais Simples)**
Usar MCP Playwright para acessar Gmail via browser

### **Opção 2: Cloud Function Python (Mais Robusto)**
Usar W0_gmail_ingest com Domain-Wide Delegation

---

## 🎯 IMPLEMENTAÇÃO OPÇÃO 1 (MCP - Mais Rápido)

### **Passo 1: Configurar MCP Gmail**
```bash
# Verificar se MCP está disponível
mcp --version

# Ou instalar MCP
npm install -g @modelcontextprotocol/cli
```

### **Passo 2: Criar Script de Sincronização**
Arquivo: `sync-gmail-real.sh`

```bash
#!/bin/bash
# Sincronizar emails INGEST do Gmail

echo "📧 Sincronizando emails de resper@ness.com.br..."

# Usar API do frontend para processar emails
curl -X POST https://oficio.ness.tec.br/api/gmail/sync \
  -H "Content-Type: application/json" \
  -d '{
    "email": "resper@ness.com.br",
    "label": "INGEST"
  }'

echo "✅ Sincronização concluída!"
```

### **Passo 3: Configurar Automação**
```bash
# Executar a cada 15 minutos
*/15 * * * * /home/resper/noficios/sync-gmail-real.sh >> /var/log/gmail-sync.log 2>&1
```

---

## 🎯 IMPLEMENTAÇÃO OPÇÃO 2 (Cloud Function - Mais Robusto)

### **Requisitos:**
1. Service Account com Domain-Wide Delegation
2. Gmail API habilitada
3. Secret Manager configurado

### **Deploy:**
```bash
cd /home/resper/noficios/oficios-automation
gcloud functions deploy W0_gmail_ingest \
  --runtime python312 \
  --trigger-http \
  --env-vars-file .env.yaml \
  --region us-central1
```

### **Configurar .env.yaml:**
```yaml
EMAILS_BUCKET: "officio-emails"
GMAIL_DELEGATED_USER: "resper@ness.com.br"
GMAIL_SA_JSON_SECRET: "GMAIL_SA_JSON"
GMAIL_QUERY: "label:INGEST has:attachment newer_than:7d"
GCP_PROJECT_ID: "seu-project-id"
```

---

## 🔄 FLUXO COMPLETO

```
1. Gmail (resper@ness.com.br)
   └─ Label: INGEST
   
2. Sincronização (a cada 15 min)
   └─ W0_gmail_ingest (Cloud Function)
      └─ Baixa anexos → GCS
      
3. Processamento W1
   └─ OCR (Cloud Vision)
   └─ LLM (Groq)
   └─ Salva em Firestore + Supabase
   
4. Dashboard Frontend
   └─ Mostra ofícios aguardando revisão
   
5. Portal HITL
   └─ Revisão humana
   └─ Aprovação → W4 (RAG Response)
```

---

## ✅ AÇÃO IMEDIATA

**Qual opção você prefere?**

### **Opção 1 - MCP (5 minutos)**
- Mais simples
- Não precisa configurar GCP
- Usa credenciais OAuth simples

### **Opção 2 - Cloud Function (30 minutos)**
- Mais robusto
- Escalável
- Requer configuração GCP

---

## 🎯 RECOMENDAÇÃO

**Começar com Opção 1 (MCP)** para validar o fluxo rapidamente, depois migrar para Opção 2 se necessário.

---

**Próximo passo:** Escolher opção e executar implementação

