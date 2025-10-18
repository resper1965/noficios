# 🔑 OBTER CREDENCIAIS OAuth - Gmail INGEST

## 📧 **Status Atual**
- ✅ **3 emails** com marcação INGEST em `resper@ness.com.br`
- ✅ **API funcionando** no VPS
- ❌ **Credenciais OAuth** necessárias para acessar Gmail

## 🚀 **Processo para Obter Credenciais**

### **1. Acessar Dashboard**
1. **Abra**: https://oficio.ness.tec.br
2. **Faça login** com Google (resper@ness.com.br)
3. **Autorize acesso ao Gmail** (primeira vez)

### **2. Obter Credenciais via Console**
1. **Abra Console do Navegador** (F12)
2. **Execute este código**:
```javascript
// Obter credenciais OAuth do Supabase
const supabase = window.supabase;
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  console.log('🔑 Credenciais encontradas:');
  console.log('User ID:', session.user.id);
  console.log('Access Token:', session.access_token);
  console.log('Refresh Token:', session.refresh_token);
  
  // Copie estes valores para o VPS
} else {
  console.log('❌ Usuário não autenticado');
}
```

### **3. Configurar no VPS**
```bash
# No VPS, editar arquivo
nano /opt/oficios/sync-gmail.sh

# Substituir estas linhas com os valores reais:
USER_ID="SEU_USER_ID_REAL"
ACCESS_TOKEN="SEU_ACCESS_TOKEN_REAL"
REFRESH_TOKEN="SEU_REFRESH_TOKEN_REAL"
```

### **4. Executar Sincronização**
```bash
# No VPS
/opt/oficios/sync-gmail.sh
```

## 📊 **Resultado Esperado**
```json
{
  "total": 3,
  "imported": 2,
  "needsReview": 1,
  "failed": 0,
  "oficios": [
    {
      "email": "Assunto do Email 1",
      "parsed": {...},
      "oficio": {...},
      "needsReview": false
    }
  ]
}
```

## 🔍 **Verificar Funcionamento**
1. **Dashboard**: Contadores preenchidos
2. **HITL**: Seção "Ofícios Aguardando Revisão"
3. **Supabase**: Tabela `oficios` com dados
4. **Logs**: `/var/log/gmail-sync.log`

## 🎯 **Próximo Passo**
**Execute o processo acima para obter as credenciais OAuth e processar os 3 emails com marcação INGEST!**
