# 📧 TESTE COMPLETO - Gmail INGEST

## ✅ **Status Atual**
- ✅ **Credenciais OAuth**: Configuradas no VPS
- ✅ **Gmail Service**: Pronto para buscar label "INGEST"
- ✅ **API Route**: `/api/gmail/sync` funcionando
- ✅ **Container**: Reiniciado com novas variáveis

## 🎯 **Próximos Passos**

### **1. Configurar Gmail (Manual)**
1. **Acesse Gmail**: https://mail.google.com
2. **Criar label "INGEST"**:
   - Lateral esquerda → "Criar novo"
   - Nome: `INGEST`
   - Cor: Vermelho
3. **Criar regra automática**:
   - Configurações → Filtros e endereços bloqueados
   - Criar filtro:
     - **De**: `resper@ness.com.br`
     - **Assunto**: contém `ofício` OU `oficio`
     - **Tem anexo**: ✅
   - Ações:
     - ✅ Aplicar rótulo: `INGEST`
     - ✅ Marcar como importante

### **2. Testar API de Sincronização**
Acesse: https://oficio.ness.tec.br/api/gmail/sync

**Método POST** com body:
```json
{
  "userId": "SEU_USER_ID_SUPABASE",
  "accessToken": "SEU_ACCESS_TOKEN_GOOGLE",
  "refreshToken": "SEU_REFRESH_TOKEN_GOOGLE"
}
```

### **3. Verificar Resultado**
```json
{
  "total": 5,
  "imported": 3,
  "needsReview": 2,
  "failed": 0,
  "oficios": [...]
}
```

## 🔍 **Diagnóstico**

### **Se retornar erro 400/401:**
- Verificar se as credenciais OAuth estão corretas
- Verificar se o usuário está autenticado no Google

### **Se retornar erro 500:**
- Verificar logs do container: `docker compose logs oficios-frontend`
- Verificar se o Supabase está configurado

### **Se retornar total: 0:**
- Verificar se existe label "INGEST" no Gmail
- Verificar se há emails com esse label
- Verificar permissões OAuth

## 📊 **Resultado Esperado**
1. **Emails encontrados** com label "INGEST"
2. **Parsing automático** dos dados
3. **Criação de ofícios** no Supabase
4. **Upload de anexos** para storage
5. **Dashboard atualizado** com contadores

## 🚀 **Teste Rápido**
Execute no **Console do Navegador** (F12):
```javascript
fetch('/api/gmail/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'test',
    accessToken: 'test',
    refreshToken: 'test'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## 🎯 **Próximo Passo**
Após configurar o Gmail, teste a API e me informe o resultado!
