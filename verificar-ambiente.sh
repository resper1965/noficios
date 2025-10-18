#!/bin/bash

# 🔍 Script de Verificação Completa do Ambiente
# n.Oficios - Verificação Final

echo "════════════════════════════════════════════════════════════"
echo "  🔍 VERIFICAÇÃO COMPLETA DO AMBIENTE - n.Oficios"
echo "════════════════════════════════════════════════════════════"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Contador de verificações
TOTAL=0
PASSED=0
FAILED=0

# Função de verificação
check() {
    TOTAL=$((TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $2"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌${NC} $2"
        FAILED=$((FAILED + 1))
    fi
}

echo "📦 VERIFICANDO DEPENDÊNCIAS..."
echo "────────────────────────────────────────────────────────────"

cd /home/resper/noficios/oficios-portal-frontend

# Node.js
node --version &> /dev/null
check $? "Node.js instalado: $(node --version 2>/dev/null || echo 'não encontrado')"

# npm
npm --version &> /dev/null
check $? "npm instalado: $(npm --version 2>/dev/null || echo 'não encontrado')"

# Dependências críticas
npm list firebase --depth=0 &> /dev/null
check $? "Firebase instalado: $(npm list firebase --depth=0 2>/dev/null | grep firebase | awk '{print $2}' || echo 'não')"

npm list react-pdf --depth=0 &> /dev/null
check $? "react-pdf instalado: $(npm list react-pdf --depth=0 2>/dev/null | grep react-pdf | awk '{print $2}' || echo 'não')"

npm list react-hot-toast --depth=0 &> /dev/null
check $? "react-hot-toast instalado: $(npm list react-hot-toast --depth=0 2>/dev/null | grep react-hot-toast | awk '{print $2}' || echo 'não')"

npm list next --depth=0 &> /dev/null
check $? "Next.js instalado: $(npm list next --depth=0 2>/dev/null | grep next | awk '{print $2}' || echo 'não')"

echo ""
echo "🔧 VERIFICANDO ARQUIVOS DE CONFIGURAÇÃO..."
echo "────────────────────────────────────────────────────────────"

# Arquivos .env
[ -f .env.local ]
check $? ".env.local existe"

[ -f .env.production ]
check $? ".env.production existe"

[ -f package.json ]
check $? "package.json existe"

[ -f next.config.ts ]
check $? "next.config.ts existe"

[ -f tsconfig.json ]
check $? "tsconfig.json existe"

echo ""
echo "📁 VERIFICANDO ESTRUTURA DO PROJETO..."
echo "────────────────────────────────────────────────────────────"

# Diretórios críticos
[ -d src/app ]
check $? "src/app/ existe"

[ -d src/components ]
check $? "src/components/ existe"

[ -d src/lib ]
check $? "src/lib/ existe"

[ -d src/hooks ]
check $? "src/hooks/ existe"

[ -d src/app/api ]
check $? "src/app/api/ existe"

echo ""
echo "🔐 VERIFICANDO ARQUIVOS CRÍTICOS..."
echo "────────────────────────────────────────────────────────────"

# Arquivos críticos do projeto
[ -f src/lib/firebase-auth.ts ]
check $? "src/lib/firebase-auth.ts existe"

[ -f src/lib/python-backend.ts ]
check $? "src/lib/python-backend.ts existe"

[ -f src/lib/api-client.ts ]
check $? "src/lib/api-client.ts existe"

[ -f src/hooks/useAuth.tsx ]
check $? "src/hooks/useAuth.tsx existe"

[ -f src/app/dashboard/page.tsx ]
check $? "src/app/dashboard/page.tsx existe"

[ -f src/app/api/webhook/oficios/route.ts ]
check $? "src/app/api/webhook/oficios/route.ts existe"

echo ""
echo "🌐 VERIFICANDO VARIÁVEIS DE AMBIENTE..."
echo "────────────────────────────────────────────────────────────"

# Verificar .env.local
if [ -f .env.local ]; then
    grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local
    check $? "NEXT_PUBLIC_SUPABASE_URL configurada"
    
    grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local
    check $? "NEXT_PUBLIC_SUPABASE_ANON_KEY configurada"
else
    echo -e "${RED}❌${NC} Arquivo .env.local não encontrado"
    FAILED=$((FAILED + 2))
    TOTAL=$((TOTAL + 2))
fi

echo ""
echo "🐍 VERIFICANDO BACKEND PYTHON..."
echo "────────────────────────────────────────────────────────────"

cd /home/resper/noficios

[ -d oficios-automation ]
check $? "oficios-automation/ existe"

[ -f oficios-automation/deploy.sh ]
check $? "deploy.sh existe"

[ -d oficios-automation/funcoes ]
check $? "funcoes/ existe"

[ -d oficios-automation/utils ]
check $? "utils/ existe"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  📊 RESULTADO FINAL"
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "Total de verificações: ${YELLOW}${TOTAL}${NC}"
echo -e "Aprovadas: ${GREEN}${PASSED}${NC}"
echo -e "Falharam: ${RED}${FAILED}${NC}"
echo ""

# Calcular porcentagem
PERCENT=$((PASSED * 100 / TOTAL))

if [ $PERCENT -eq 100 ]; then
    echo -e "${GREEN}✅ AMBIENTE 100% CONFIGURADO!${NC}"
    echo ""
    echo "🚀 PRONTO PARA:"
    echo "   • npm run dev (desenvolvimento)"
    echo "   • npm run build (produção)"
    echo "   • Deploy no VPS"
elif [ $PERCENT -ge 90 ]; then
    echo -e "${YELLOW}⚠️  Ambiente ${PERCENT}% configurado${NC}"
    echo "Algumas configurações podem estar faltando."
else
    echo -e "${RED}❌ Ambiente ${PERCENT}% configurado${NC}"
    echo "Várias configurações estão faltando."
fi

echo ""
echo "════════════════════════════════════════════════════════════"

