#!/bin/bash

# 🔍 VERIFICAR CONFIGURAÇÃO OAUTH
# Script para verificar configuração atual

echo "🔍 Verificando configuração OAuth..."

# 1. Verificar variáveis de ambiente no VPS
echo "1️⃣ Verificando variáveis de ambiente no VPS..."
sshpass -p '[SENHA_VPS]' ssh -o StrictHostKeyChecking=no root@oficio.ness.tec.br "cd /opt/oficios && cat .env | grep -E 'GOOGLE|SUPABASE'"

# 2. Verificar logs do container
echo "2️⃣ Verificando logs do container..."
sshpass -p '[SENHA_VPS]' ssh -o StrictHostKeyChecking=no root@oficio.ness.tec.br "cd /opt/oficios && docker compose logs oficios-frontend | grep -i oauth | tail -10"

# 3. Verificar status do container
echo "3️⃣ Verificando status do container..."
sshpass -p '[SENHA_VPS]' ssh -o StrictHostKeyChecking=no root@oficio.ness.tec.br "cd /opt/oficios && docker compose ps"

echo "✅ Verificação concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure OAuth no Google Cloud Console"
echo "2. Adicione redirect URIs"
echo "3. Configure Supabase Auth URLs"
echo "4. Teste o login"
