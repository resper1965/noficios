# 🚀 ACESSAR SISTEMA MCP - Guia Completo

## ✅ **Sistema MCP Deployado**
O sistema MCP (Managed Cloud Provider) foi deployado com sucesso no VPS!

## 🔗 **Acessar o Sistema**

### **1. Acesse o Dashboard MCP**
- **URL**: https://oficio.ness.tec.br/dashboard/mcp
- **Login**: Use sua conta Google ou email/senha

### **2. Funcionalidades Disponíveis**
- ✅ **Executar Sincronização Gmail**
- ✅ **Histórico de Jobs MCP**
- ✅ **Monitoramento de Status**
- ✅ **Interface User-Friendly**

## 🎯 **Como Usar o Sistema MCP**

### **Passo 1: Executar Sincronização**
1. Acesse: https://oficio.ness.tec.br/dashboard/mcp
2. Digite seu email Gmail (ex: resper@ness.com.br)
3. Clique em "Iniciar Sincronização"
4. O sistema processará emails com label "INGEST"

### **Passo 2: Monitorar Progresso**
- Veja o status do job em tempo real
- Acompanhe quantos emails foram processados
- Verifique se houve erros

### **Passo 3: Verificar Histórico**
- Acesse a seção "Histórico de Sincronizações"
- Veja todos os jobs executados
- Analise estatísticas de processamento

## 🔧 **Configuração Necessária**

### **1. Executar SQL no Supabase**
Execute o script `supabase-mcp-schema.sql` no Supabase SQL Editor:
```sql
-- Criar tabelas MCP
CREATE TABLE organizations (...);
CREATE TABLE users (...);
CREATE TABLE mcp_jobs (...);
```

### **2. Configurar OAuth Google**
Siga o guia `CONFIGURAR_OAUTH_GOOGLE.md` para:
- Configurar OAuth no Google Cloud
- Adicionar redirect URIs
- Configurar Supabase Auth URLs

## 📊 **Status do Sistema**

### **✅ Deployado**
- [x] Tipos TypeScript
- [x] Serviços MCP
- [x] Hooks React
- [x] Componentes UI
- [x] API Routes
- [x] Página Dashboard

### **⏳ Pendente**
- [ ] Executar SQL no Supabase
- [ ] Configurar OAuth Google
- [ ] Testar sincronização

## 🚀 **Próximos Passos**

1. **Execute o SQL** no Supabase
2. **Configure OAuth** Google
3. **Teste o sistema** MCP
4. **Verifique emails** processados

## 🔍 **Troubleshooting**

### **Se não conseguir acessar:**
- Verifique se está logado
- Confirme se o container está rodando
- Verifique logs: `docker compose logs oficios-frontend`

### **Se OAuth não funcionar:**
- Siga o guia `CONFIGURAR_OAUTH_GOOGLE.md`
- Verifique redirect URIs
- Teste com navegador incógnito

**O sistema MCP está pronto para uso!**




