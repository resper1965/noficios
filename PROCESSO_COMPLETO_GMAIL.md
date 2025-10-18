# 🔄 PROCESSO COMPLETO - Gmail INGEST

## 🎯 **Status Atual**
- ✅ **Label INGEST**: Criada no Gmail
- ✅ **Emails**: Com label INGEST disponíveis
- ✅ **API**: Funcionando no VPS
- ❌ **Credenciais OAuth**: Precisam ser configuradas

## 🚀 **Processo de Sincronização**

### **1. Configuração OAuth (Manual)**
Para funcionar, você precisa:

1. **Acessar o dashboard**: https://oficio.ness.tec.br
2. **Fazer login** com Google
3. **Autorizar acesso ao Gmail** (primeira vez)
4. **Copiar as credenciais** geradas

### **2. Executar Sincronização**
```bash
# No VPS
curl -X POST https://oficio.ness.tec.br/api/gmail/sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "SEU_USER_ID_REAL",
    "accessToken": "SEU_ACCESS_TOKEN_REAL",
    "refreshToken": "SEU_REFRESH_TOKEN_REAL"
  }'
```

## ⏰ **Recorrência e Automação**

### **Frequência Recomendada**
- **Manual**: A qualquer momento via dashboard
- **Automática**: A cada 15 minutos via cron
- **Notificações**: Imediatas para ofícios urgentes

### **Configurar Cron Job**
```bash
# Adicionar ao crontab do VPS
*/15 * * * * curl -X POST https://oficio.ness.tec.br/api/gmail/sync -H "Content-Type: application/json" -d '{"userId":"USER_ID","accessToken":"TOKEN","refreshToken":"REFRESH_TOKEN"}' >> /var/log/gmail-sync.log 2>&1
```

## 📊 **Critérios de Funcionamento**

### **✅ Indicadores de Sucesso**
1. **API responde**: Status 200
2. **Emails encontrados**: `total > 0`
3. **Parsing funcionando**: `imported > 0` ou `needsReview > 0`
4. **Dashboard atualizado**: Contadores > 0
5. **HITL funcionando**: Seção "Aguardando Revisão" aparece

### **📈 Métricas de Monitoramento**
- **Taxa de importação**: > 80%
- **Tempo de processamento**: < 30 segundos
- **Erros**: < 5%
- **Dados no dashboard**: Atualizados em tempo real

## 🔍 **Como Verificar se Está Funcionando**

### **1. Teste Manual**
```bash
# Executar no VPS
curl -X POST https://oficio.ness.tec.br/api/gmail/sync \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","accessToken":"test","refreshToken":"test"}'
```

### **2. Verificar Logs**
```bash
# No VPS
docker compose logs oficios-frontend | grep -i gmail
```

### **3. Verificar Dashboard**
- Acesse: https://oficio.ness.tec.br
- Verifique se os contadores estão preenchidos
- Verifique se aparece "Ofícios Aguardando Revisão"

### **4. Verificar Supabase**
```sql
-- No Supabase SQL Editor
SELECT COUNT(*) as total_oficios FROM oficios;
SELECT status, COUNT(*) FROM oficios GROUP BY status;
```

## 🎯 **Próximos Passos**

1. **Configure OAuth** no dashboard
2. **Execute sincronização manual**
3. **Verifique resultados** no dashboard
4. **Configure automação** (cron job)
5. **Monitore funcionamento** diariamente

## 📋 **Checklist de Funcionamento**
- [ ] OAuth configurado
- [ ] Sincronização manual funciona
- [ ] Dashboard mostra dados
- [ ] HITL aparece
- [ ] Automação configurada
- [ ] Monitoramento ativo
