# 📧 TESTE GMAIL - Label INGEST

## 🎯 **Objetivo**
Verificar se conseguimos ler emails com label "INGEST" da conta `resper@ness.com.br`

## 🔧 **Configuração Atual**
- ✅ **Gmail Service**: Configurado para buscar por label "INGEST"
- ✅ **API Route**: `/api/gmail/sync` pronta
- ✅ **OAuth**: Configurado para `resper@ness.com.br`

## 🚀 **Teste Manual**

### **1. Verificar Labels no Gmail**
1. Acesse Gmail: https://mail.google.com
2. Verifique se existe o label "INGEST"
3. Se não existir, crie manualmente:
   - Clique em "Criar novo" (lateral esquerda)
   - Nome: `INGEST`
   - Cor: Vermelho (para destaque)

### **2. Configurar Regra Automática**
1. No Gmail, vá em **Configurações** (⚙️) → **Ver todas as configurações**
2. Aba **Filtros e endereços bloqueados**
3. Clique **Criar um filtro**
4. Configure:
   - **De**: `resper@ness.com.br`
   - **Assunto contém**: `ofício` OU `oficio`
   - **Tem anexo**: ✅
5. Clique **Criar filtro**
6. Marque **Aplicar o rótulo**: `INGEST`
7. Marque **Marcar como importante**
8. Clique **Criar filtro**

### **3. Testar API Diretamente**
Execute no **Console do Navegador** (F12):

```javascript
// Testar busca por label INGEST
fetch('/api/gmail/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'SEU_USER_ID_AQUI',
    accessToken: 'SEU_ACCESS_TOKEN_AQUI',
    refreshToken: 'SEU_REFRESH_TOKEN_AQUI'
  })
})
.then(response => response.json())
.then(data => {
  console.log('📧 Emails encontrados:', data);
  console.log('Total:', data.total);
  console.log('Importados:', data.imported);
  console.log('Precisam revisão:', data.needsReview);
})
.catch(error => {
  console.error('❌ Erro:', error);
});
```

## 🔍 **Diagnóstico**

### **Se não encontrar emails:**
1. **Verificar se o label existe**: `INGEST`
2. **Verificar se há emails com o label**
3. **Verificar permissões OAuth**
4. **Verificar logs do servidor**

### **Se encontrar emails:**
1. **Verificar parsing dos dados**
2. **Verificar criação no Supabase**
3. **Verificar upload de anexos**

## 📊 **Resultado Esperado**
```json
{
  "total": 5,
  "imported": 3,
  "needsReview": 2,
  "failed": 0,
  "oficios": [
    {
      "email": "Ofício 001/2024 - Tribunal",
      "parsed": { ... },
      "oficio": { ... },
      "needsReview": false
    }
  ]
}
```

## 🎯 **Próximos Passos**
1. **Configurar regra automática no Gmail**
2. **Testar API de sincronização**
3. **Verificar criação de ofícios no Supabase**
4. **Testar fluxo HITL completo**
