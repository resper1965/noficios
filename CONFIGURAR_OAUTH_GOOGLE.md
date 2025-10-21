# 🔧 CONFIGURAR OAUTH GOOGLE - Guia Completo

## ❌ **Erro Comum**
```
Acesso bloqueado: erro de autorização
Missing required parameter: redirect_uri
Erro 400: invalid_request
```

## 🎯 **Causa do Problema**
O OAuth do Google não está configurado corretamente no Supabase. O `redirect_uri` está faltando.

## 🔧 **Solução Passo a Passo**

### **1. Configurar OAuth no Supabase**
1. **Acesse**: https://supabase.com/dashboard/project/ghcqywthubgfenqqxoqb/auth/providers
2. **Clique em Google**
3. **Configure**:
   - **Client ID**: [Seu Client ID do Google Cloud]
   - **Client Secret**: [Seu Client Secret do Google Cloud]

### **2. Configurar Redirect URIs no Google Cloud**
1. **Acesse**: https://console.cloud.google.com/apis/credentials
2. **Clique no OAuth Client**: [Seu OAuth Client ID]
3. **Adicione Redirect URIs**:
   - `https://ghcqywthubgfenqqxoqb.supabase.co/auth/v1/callback`
   - `https://oficio.ness.tec.br/auth/callback`
   - `http://localhost:3000/auth/callback`

### **3. Configurar Supabase Auth URLs**
1. **Acesse**: https://supabase.com/dashboard/project/ghcqywthubgfenqqxoqb/auth/url-configuration
2. **Configure**:
   - **Site URL**: `https://oficio.ness.tec.br`
   - **Redirect URLs**:
     - `https://oficio.ness.tec.br/**`
     - `http://localhost:3000/**`

## 🚀 **Teste Após Configuração**

### **1. Limpar Cache**
- Limpe cache do navegador
- Faça logout se estiver logado

### **2. Testar Login**
- Acesse: https://oficio.ness.tec.br
- Clique em "Login com Google"
- Deve funcionar sem erros

### **3. Verificar Dashboard**
- Após login, acesse o dashboard
- Deve carregar sem erros de autenticação

## 📋 **Checklist de Configuração**

- [ ] OAuth Client configurado no Google Cloud
- [ ] Redirect URIs adicionados no Google Cloud
- [ ] Supabase Auth URLs configuradas
- [ ] Site URL: `https://oficio.ness.tec.br`
- [ ] Redirect URLs: `https://oficio.ness.tec.br/**`
- [ ] Teste de login funcionando

## 🔍 **Se Ainda Houver Problemas**

### **Verificar Logs**
```bash
# No VPS
docker compose logs oficios-frontend | grep -i oauth
```

### **Verificar Configuração**
- Confirme se as URLs estão exatamente como especificado
- Verifique se não há espaços extras
- Teste com navegador incógnito

**Configure os redirect URIs e o sistema deve funcionar!**




