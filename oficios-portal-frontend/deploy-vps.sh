#!/bin/bash

echo "🚀 DEPLOY VPS - n.Oficios"
echo "========================="

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
echo "🔧 CONFIGURAÇÃO FIREBASE:"
echo "1. Acesse: https://console.firebase.google.com/u/1/project/officio-474711/authentication/settings"
echo "2. Vá em: Authentication → Settings → Authorized domains"
echo "3. Adicione APENAS: localhost"
echo "4. NÃO adicione porta (localhost:3000 é erro)"
echo ""
echo "🧪 TESTE FIREBASE:"
echo "1. Abra: test-firebase-simple.html no navegador"
echo "2. Clique em 'Testar Firebase'"
echo "3. Deve mostrar Status: 200 (não 403)"
echo ""
echo "🌐 TESTE APLICAÇÃO:"
echo "1. Acesse: http://localhost:3000"
echo "2. Clique em 'Continuar com Google'"
echo "3. Deve funcionar sem erro 403"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. ✅ Configurar Firebase (localhost)"
echo "2. 🔄 Testar login local"
echo "3. 🚀 Deploy em VPS Ubuntu"
echo "4. 🌐 Configurar domínio e SSL"
echo ""
echo "✅ Após configurar Firebase, o login deve funcionar!"

