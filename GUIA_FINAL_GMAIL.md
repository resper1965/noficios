# 🎯 GUIA FINAL - Gmail INGEST

## ✅ **Status Atual**
- ✅ **Label INGEST**: Criada no Gmail
- ✅ **Emails**: Com label INGEST disponíveis  
- ✅ **API**: Funcionando no VPS
- ✅ **Automação**: Configurada (cron job a cada 15 min)
- ❌ **Credenciais OAuth**: Precisam ser configuradas

## 🚀 **Como Executar o Processo**

### **1. Configurar Credenciais OAuth**
```bash
# No VPS, editar o arquivo:
nano /opt/oficios/sync-gmail.sh

# Substituir estas linhas:
USER_ID="SEU_USER_ID_AQUI"
ACCESS_TOKEN="SEU_ACCESS_TOKEN_AQUI" 
REFRESH_TOKEN="SEU_REFRESH_TOKEN_AQUI"
```

### **2. Obter Credenciais OAuth**
1. **Acesse**: https://oficio.ness.tec.br
2. **Faça login** com Google
3. **Autorize acesso ao Gmail** (primeira vez)
4. **Copie as credenciais** do console do navegador

### **3. Testar Sincronização**
```bash
# No VPS
/opt/oficios/sync-gmail.sh
```

### **4. Verificar Logs**
```bash
# No VPS
tail -f /var/log/gmail-sync.log
```

## ⏰ **Recorrência e Critérios**

### **Frequência**
- **Manual**: A qualquer momento
- **Automática**: A cada 15 minutos (cron job)
- **Notificações**: Imediatas para ofícios urgentes

### **Critérios de Funcionamento**
1. **✅ API responde**: Status 200
2. **✅ Emails encontrados**: `total > 0`
3. **✅ Parsing funcionando**: `imported > 0` ou `needsReview > 0`
4. **✅ Dashboard atualizado**: Contadores > 0
5. **✅ HITL funcionando**: Seção "Aguardando Revisão" aparece

### **Métricas de Sucesso**
- **Taxa de importação**: > 80%
- **Tempo de processamento**: < 30 segundos
- **Erros**: < 5%
- **Dados no dashboard**: Atualizados em tempo real

## 🔍 **Como Verificar se Está Funcionando**

### **1. Teste Manual**
```bash
# No VPS
curl -X POST https://oficio.ness.tec.br/api/gmail/sync \
  -H "Content-Type: application/json" \
  -d '{"userId":"SEU_USER_ID","accessToken":"SEU_TOKEN","refreshToken":"SEU_REFRESH"}'
```

### **2. Verificar Dashboard**
- Acesse: https://oficio.ness.tec.br
- Verifique contadores preenchidos
- Verifique seção "Ofícios Aguardando Revisão"

### **3. Verificar Logs**
```bash
# No VPS
docker compose logs oficios-frontend | grep -i gmail
tail -f /var/log/gmail-sync.log
```

### **4. Verificar Supabase**
```sql
-- No Supabase SQL Editor
SELECT COUNT(*) as total_oficios FROM oficios;
SELECT status, COUNT(*) FROM oficios GROUP BY status;
```

## 📋 **Checklist de Funcionamento**
- [ ] OAuth configurado no VPS
- [ ] Sincronização manual funciona
- [ ] Dashboard mostra dados
- [ ] HITL aparece
- [ ] Automação configurada
- [ ] Monitoramento ativo

## 🎯 **Próximos Passos**
1. **Configure OAuth** no VPS
2. **Execute sincronização manual**
3. **Verifique resultados** no dashboard
4. **Monitore funcionamento** diariamente
5. **Ajuste frequência** se necessário

## 📞 **Suporte**
- **Logs**: `/var/log/gmail-sync.log`
- **Container**: `docker compose logs oficios-frontend`
- **API**: `https://oficio.ness.tec.br/api/gmail/sync`
