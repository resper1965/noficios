#!/bin/bash

echo "🔍 TESTE RÁPIDO FIREBASE"
echo "========================"
echo ""

# Verificar se a aplicação está rodando
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️ Aplicação não está rodando"
    echo "Inicie com: npm run dev"
    exit 1
fi

echo "✅ Aplicação rodando"
echo ""

# Abrir arquivo de diagnóstico
echo "🧪 Abrindo diagnóstico no navegador..."
echo ""

if command -v xdg-open > /dev/null; then
    xdg-open check-firebase-config.html
elif command -v open > /dev/null; then
    open check-firebase-config.html
elif command -v start > /dev/null; then
    start check-firebase-config.html
else
    echo "❌ Não foi possível abrir automaticamente"
    echo "📋 Abra manualmente: check-firebase-config.html"
fi

echo ""
echo "📋 INSTRUÇÕES:"
echo "1. Clique em 'Executar Diagnóstico Completo'"
echo "2. Verifique se o Status HTTP é 200 ou 403"
echo "3. Se 403, siga as soluções mostradas na página"
echo ""
echo "📁 Arquivos de ajuda criados:"
echo "   - check-firebase-config.html (diagnóstico interativo)"
echo "   - SOLUCAO_AVANCADA.md (guia completo)"
echo "   - FIREBASE_FIX_AGORA.md (guia rápido)"

