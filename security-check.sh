#!/bin/bash
# Verificação de Segurança - n.Oficios

echo "════════════════════════════════════════════════════════════"
echo "  🔒 Verificação de Segurança n.Oficios"
echo "════════════════════════════════════════════════════════════"
echo ""

cd /var/www/noficios

# 1. Verificar permissões de arquivos .env
echo "📋 1. Verificando permissões de .env..."
if [ -f "./oficios-portal-frontend/.env.production" ]; then
    PERMS=$(stat -c "%a" "./oficios-portal-frontend/.env.production")
    if [ "$PERMS" != "600" ]; then
        echo "⚠️ Corrigindo permissões .env.production (era: $PERMS)"
        chmod 600 ./oficios-portal-frontend/.env.production
    fi
    echo "✅ .env.production: 600"
else
    echo "⚠️ .env.production não encontrado"
fi

if [ -f "./backend-simple/.env" ]; then
    PERMS=$(stat -c "%a" "./backend-simple/.env")
    if [ "$PERMS" != "600" ]; then
        echo "⚠️ Corrigindo permissões backend .env (era: $PERMS)"
        chmod 600 ./backend-simple/.env
    fi
    echo "✅ backend .env: 600"
else
    echo "ℹ️ backend .env não encontrado (opcional)"
fi

# 2. Verificar se secrets não estão no git
echo ""
echo "🔍 2. Verificando vazamento de secrets no git..."
LEAKED=$(git log --all --full-history --source --find-object=$(git hash-object oficios-portal-frontend/.env.production 2>/dev/null || echo "none") 2>/dev/null | wc -l)
if [ "$LEAKED" -gt "0" ]; then
    echo "⚠️ ALERTA: .env.production pode ter sido commitado no passado!"
    echo "   Considere rotacionar todas as keys"
else
    echo "✅ Nenhum .env commitado no git"
fi

# 3. Verificar .gitignore
echo ""
echo "📝 3. Verificando .gitignore..."
if grep -q "\.env" .gitignore; then
    echo "✅ .env presente no .gitignore"
else
    echo "⚠️ Adicionando .env ao .gitignore"
    echo ".env" >> .gitignore
    echo ".env.local" >> .gitignore
    echo ".env.production" >> .gitignore
fi

# 4. Verificar variáveis sensíveis
echo ""
echo "🔑 4. Verificando variáveis de ambiente..."
VARS_OK=0
VARS_MISSING=0

# Frontend
if [ -f "./oficios-portal-frontend/.env.production" ]; then
    for var in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_KEY; do
        if grep -q "^$var=" ./oficios-portal-frontend/.env.production; then
            echo "✅ $var definido"
            ((VARS_OK++))
        else
            echo "⚠️ $var FALTANDO"
            ((VARS_MISSING++))
        fi
    done
fi

echo ""
echo "📊 Resumo: $VARS_OK variáveis OK, $VARS_MISSING faltando"

# 5. Verificar Service Account Google
echo ""
echo "🔐 5. Verificando Service Account Google..."
if [ -f "./gmail-sa-key.json" ]; then
    PERMS=$(stat -c "%a" "./gmail-sa-key.json")
    if [ "$PERMS" != "600" ]; then
        echo "⚠️ Corrigindo permissões gmail-sa-key.json"
        chmod 600 ./gmail-sa-key.json
    fi
    echo "✅ gmail-sa-key.json: 600"
else
    echo "ℹ️ gmail-sa-key.json não configurado (opcional)"
fi

# 6. Verificar portas expostas
echo ""
echo "🌐 6. Verificando portas expostas..."
EXPOSED=$(docker compose -f docker-compose.vps.yml ps --format json 2>/dev/null | python3 -c "
import json, sys
for line in sys.stdin:
    try:
        data = json.loads(line)
        if data.get('Publishers'):
            for pub in data['Publishers']:
                print(f\"   {data['Service']}: {pub['PublishedPort']} -> {pub['TargetPort']}\")
    except: pass
" 2>/dev/null)

if [ -n "$EXPOSED" ]; then
    echo "$EXPOSED"
else
    echo "✅ Apenas portas necessárias expostas"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ Verificação Completa!"
echo "════════════════════════════════════════════════════════════"
