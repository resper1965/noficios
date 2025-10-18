#!/bin/bash

# 🚀 SCRIPT DE SINCRONIZAÇÃO GMAIL
# Executa o processo de sincronização com emails INGEST

echo "📧 Iniciando sincronização Gmail INGEST..."

# URL da API
API_URL="https://oficio.ness.tec.br/api/gmail/sync"

# Dados de teste (substitua pelos reais)
USER_ID="test-user-id"
ACCESS_TOKEN="test-access-token"
REFRESH_TOKEN="test-refresh-token"

# Executar sincronização
echo "🔄 Executando sincronização..."
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"accessToken\": \"$ACCESS_TOKEN\",
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

# Verificar resultado
if [ $? -eq 0 ]; then
  echo "✅ Sincronização executada com sucesso!"
  echo "📊 Resultado:"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo "❌ Erro na sincronização"
  echo "$RESPONSE"
fi

echo "🏁 Processo concluído!"
