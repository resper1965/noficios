#!/bin/bash

# 🚀 EXECUTAR SINCRONIZAÇÃO MCP - Gmail Google Workspace
# Usa MCP para acessar emails com label INGEST

echo "📧 Iniciando sincronização Gmail via MCP..."

# Verificar se MCP está instalado
if ! command -v mcp &> /dev/null; then
    echo "❌ MCP não encontrado. Instalando..."
    npm install -g @mcp/cli
fi

# Executar sincronização
echo "🔄 Executando sincronização MCP..."
node mcp-gmail-sync.js

# Verificar resultado
if [ $? -eq 0 ]; then
    echo "✅ Sincronização MCP executada com sucesso!"
else
    echo "❌ Erro na sincronização MCP"
fi

echo "🏁 Processo concluído!"




