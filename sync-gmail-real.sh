#!/bin/bash

# 📧 Sincronização Gmail Real - resper@ness.com.br
# Processa emails com label INGEST automaticamente

set -e

# Configuração
EMAIL="resper@ness.com.br"
LABEL="INGEST"
API_URL="http://62.72.8.164:3000/api/gmail/sync"
LOG_FILE="/var/log/gmail-sync.log"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "════════════════════════════════════════════════════════════"
echo "  📧 SINCRONIZAÇÃO GMAIL - $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Email: $EMAIL"
echo "Label: $LABEL"
echo "API: $API_URL"
echo ""

# Executar sincronização
echo "🔄 Iniciando sincronização..."

response=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"label\":\"$LABEL\"}" \
  -w "\n%{http_code}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo ""
echo "────────────────────────────────────────────────────────────"

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Sincronização concluída com sucesso!${NC}"
    echo ""
    echo "Resposta:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    
    # Extrair métricas se disponíveis
    total=$(echo "$body" | grep -o '"total":[0-9]*' | cut -d':' -f2 || echo "0")
    imported=$(echo "$body" | grep -o '"imported":[0-9]*' | cut -d':' -f2 || echo "0")
    
    echo ""
    echo "📊 Métricas:"
    echo "   Total processados: $total"
    echo "   Importados: $imported"
else
    echo -e "${RED}❌ Erro na sincronização (HTTP $http_code)${NC}"
    echo ""
    echo "Resposta:"
    echo "$body"
fi

echo ""
echo "════════════════════════════════════════════════════════════"

# Log para arquivo
echo "[$(date '+%Y-%m-%d %H:%M:%S')] HTTP $http_code | Processados: $total | Importados: $imported" >> "$LOG_FILE"

exit 0

