#!/bin/bash

echo "🚀 DEPLOY DE TESTE - n.Oficios"
echo "================================"

# Verificar se a aplicação está rodando
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Aplicação rodando em http://localhost:3000"
else
    echo "❌ Aplicação não está rodando"
    echo "🔧 Iniciando aplicação..."
    cd oficios-portal-frontend && npm run dev &
    sleep 10
fi

echo ""
echo "🔧 TESTE FIREBASE AUTH:"
echo "1. Acesse: http://localhost:3000"
echo "2. Clique em 'Continuar com Google'"
echo "3. Se der erro 403, adicione localhost:3000 no Firebase Console"
echo "4. URL Firebase: https://console.firebase.google.com/u/1/project/officio-474711/authentication/settings"
echo ""
echo "🧪 TESTE ALTERNATIVO:"
echo "1. Abra: test-firebase-auth.html no navegador"
echo "2. Clique em 'Testar Configuração'"
echo "3. Clique em 'Testar Login Google'"
echo ""
echo "📋 DOMÍNIOS PARA ADICIONAR NO FIREBASE:"
echo "- localhost:3000"
echo "- localhost:3001"
echo "- localhost:3002"
echo "- localhost:3003"
echo "- 127.0.0.1:3000"
echo "- 127.0.0.1:3001"
echo "- 127.0.0.1:3002"
echo "- 127.0.0.1:3003"
echo ""
echo "✅ Após adicionar os domínios, o login deve funcionar!"

