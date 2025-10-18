# 🔐 VERIFICAR AUTENTICAÇÃO - Google Workspace

## 🎯 **Entendimento Correto**
- ✅ **Aplicação**: Mantém autenticação Supabase
- ✅ **Integração Gmail**: Usa Google Workspace para ler emails
- ❌ **Problema**: API precisa das credenciais do Google Workspace

## 🔧 **Solução**

### **1. Manter Autenticação Supabase**
- ✅ **Login**: Continua funcionando normalmente
- ✅ **Dashboard**: Usa Supabase para dados
- ✅ **HITL**: Funciona com Supabase

### **2. Integração Gmail com Google Workspace**
- ✅ **Credenciais**: Usar Google Workspace OAuth
- ✅ **Emails**: Acessar `resper@ness.com.br`
- ✅ **Label INGEST**: Processar emails automaticamente

## 🚀 **Processo Correto**

### **1. Configurar Credenciais Google Workspace**
```bash
# No VPS, editar arquivo
nano /opt/oficios/sync-gmail.sh

# Usar credenciais do Google Workspace (resper@ness.com.br)
USER_ID="resper@ness.com.br"
ACCESS_TOKEN="TOKEN_GOOGLE_WORKSPACE"
REFRESH_TOKEN="REFRESH_TOKEN_GOOGLE_WORKSPACE"
```

### **2. Executar Sincronização**
```bash
# No VPS
/opt/oficios/sync-gmail.sh
```

## 📊 **Resultado Esperado**
- ✅ **Aplicação**: Funciona com Supabase
- ✅ **Gmail**: Lê emails do Google Workspace
- ✅ **Integração**: Processa emails INGEST
- ✅ **Dashboard**: Mostra dados processados

## 🎯 **Próximo Passo**
**Configurar as credenciais do Google Workspace para a integração Gmail funcionar!**