# 🚀 EXECUTAR SINCRONIZAÇÃO GMAIL

## 📧 **Processo de Sincronização**

### **1. Executar Sincronização Manual**
```bash
# No VPS
curl -X POST https://oficio.ness.tec.br/api/gmail/sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "SEU_USER_ID_SUPABASE",
    "accessToken": "SEU_ACCESS_TOKEN_GOOGLE", 
    "refreshToken": "SEU_REFRESH_TOKEN_GOOGLE"
  }'
```

### **2. Verificar Resultado**
```json
{
  "total": 5,
  "imported": 3,
  "needsReview": 2,
  "failed": 0,
  "oficios": [...]
}
```

## ⏰ **Recorrência e Critérios**

### **Frequência Recomendada**
- **Manual**: A qualquer momento
- **Automática**: A cada 15 minutos
- **Notificações**: Imediatas para ofícios urgentes

### **Critérios de Funcionamento**
1. **✅ Emails encontrados**: `total > 0`
2. **✅ Parsing funcionando**: `imported > 0` ou `needsReview > 0`
3. **✅ Banco atualizado**: Contadores no dashboard > 0
4. **✅ HITL funcionando**: Seção "Aguardando Revisão" aparece

### **Monitoramento**
- **Logs**: `docker compose logs oficios-frontend`
- **Dashboard**: Verificar contadores
- **Supabase**: Verificar tabela `oficios`
- **Gmail**: Verificar label "n.Oficios/Processado"

## 🔄 **Automação (Cron Job)**
```bash
# Adicionar ao crontab do VPS
*/15 * * * * curl -X POST https://oficio.ness.tec.br/api/gmail/sync -H "Content-Type: application/json" -d '{"userId":"USER_ID","accessToken":"TOKEN","refreshToken":"REFRESH_TOKEN"}' >> /var/log/gmail-sync.log 2>&1
```

## 📊 **Métricas de Sucesso**
- **Taxa de importação**: > 80%
- **Tempo de processamento**: < 30 segundos
- **Erros**: < 5%
- **Dados no dashboard**: Atualizados em tempo real
