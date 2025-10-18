#!/bin/bash

# 🔄 CONFIGURAR AUTOMAÇÃO GMAIL
# Configura cron job para sincronização automática

echo "🔄 Configurando automação Gmail INGEST..."

# Criar script de sincronização
cat > /opt/oficios/sync-gmail.sh << 'EOF'
#!/bin/bash

# Script de sincronização automática
API_URL="https://oficio.ness.tec.br/api/gmail/sync"
LOG_FILE="/var/log/gmail-sync.log"

# Dados OAuth (substitua pelos reais)
USER_ID="SEU_USER_ID_AQUI"
ACCESS_TOKEN="SEU_ACCESS_TOKEN_AQUI"
REFRESH_TOKEN="SEU_REFRESH_TOKEN_AQUI"

# Executar sincronização
echo "$(date): Iniciando sincronização Gmail INGEST..." >> $LOG_FILE

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"accessToken\": \"$ACCESS_TOKEN\",
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

# Log do resultado
echo "$(date): Resultado da sincronização: $RESPONSE" >> $LOG_FILE

# Verificar se houve sucesso
if echo "$RESPONSE" | grep -q '"total"'; then
  echo "$(date): ✅ Sincronização bem-sucedida" >> $LOG_FILE
else
  echo "$(date): ❌ Erro na sincronização: $RESPONSE" >> $LOG_FILE
fi
EOF

# Tornar executável
chmod +x /opt/oficios/sync-gmail.sh

# Adicionar ao crontab (executar a cada 15 minutos)
(crontab -l 2>/dev/null; echo "*/15 * * * * /opt/oficios/sync-gmail.sh") | crontab -

echo "✅ Automação configurada!"
echo "📅 Sincronização executará a cada 15 minutos"
echo "📝 Logs em: /var/log/gmail-sync.log"
echo ""
echo "🔧 Para configurar credenciais OAuth:"
echo "   1. Edite: /opt/oficios/sync-gmail.sh"
echo "   2. Substitua USER_ID, ACCESS_TOKEN, REFRESH_TOKEN"
echo "   3. Teste: /opt/oficios/sync-gmail.sh"
