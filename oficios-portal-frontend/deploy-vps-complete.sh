#!/bin/bash

# ============================================
# Deploy Script - n.Oficios VPS
# VPS: root@62.72.8.164
# ============================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOY n.Oficios - VPS Ubuntu"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configurações
VPS_HOST="root@62.72.8.164"
VPS_PASSWORD="Gordinh@2009"
APP_NAME="oficios-frontend"
DOMAIN="oficios.ness.tec.br"

echo "📋 Configurações:"
echo "   VPS: 62.72.8.164"
echo "   App: $APP_NAME"
echo "   Domínio: $DOMAIN"
echo ""

# 1. Verificar conexão SSH
echo "1️⃣ Testando conexão SSH..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_HOST "echo '✅ Conectado ao VPS'" || {
    echo "❌ Erro ao conectar. Instalando sshpass..."
    sudo apt-get install -y sshpass
}

# 2. Preparar VPS
echo ""
echo "2️⃣ Preparando VPS..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_HOST << 'ENDSSH'
    # Atualizar sistema
    apt-get update -qq

    # Instalar Docker se não existir
    if ! command -v docker &> /dev/null; then
        echo "   Instalando Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    fi

    # Instalar Docker Compose se não existir
    if ! command -v docker-compose &> /dev/null; then
        echo "   Instalando Docker Compose..."
        apt-get install -y docker-compose-plugin
    fi

    # Criar diretório para aplicação
    mkdir -p /opt/oficios
    
    echo "✅ VPS preparado!"
ENDSSH

# 3. Criar .env para deploy
echo ""
echo "3️⃣ Preparando variáveis de ambiente..."
cat > .env.deploy << EOF
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCrE-O9tnox14nsbtkWpbbnCs42_3ewo9M
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=officio-474711.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=officio-474711
NEXT_PUBLIC_SUPABASE_URL=https://ghcqywthubgfenqqxoqb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY3F5d3RodWJnZmVucXF4b3FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTkwMjYsImV4cCI6MjA3NjI5NTAyNn0.KJX7au7GZev3uUIkVniMhgvYUQLTCNqn1KwqqTLMz7I
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF

# 4. Copiar arquivos para VPS
echo ""
echo "4️⃣ Copiando arquivos para VPS..."
sshpass -p "$VPS_PASSWORD" scp -r \
    -o StrictHostKeyChecking=no \
    Dockerfile \
    docker-compose.yml \
    .env.deploy \
    package.json \
    package-lock.json \
    next.config.ts \
    tsconfig.json \
    postcss.config.mjs \
    eslint.config.mjs \
    src \
    public \
    $VPS_HOST:/opt/oficios/

# Renomear .env.deploy para .env no servidor
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_HOST \
    "cd /opt/oficios && mv .env.deploy .env"

# 5. Build e deploy no VPS
echo ""
echo "5️⃣ Fazendo build e deploy no VPS..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_HOST << 'ENDSSH'
    cd /opt/oficios
    
    # Build da imagem
    echo "   Building Docker image..."
    docker build -t oficios-frontend:latest .
    
    # Parar containers antigos
    docker-compose down 2>/dev/null || true
    
    # Iniciar aplicação
    echo "   Iniciando aplicação..."
    docker-compose up -d
    
    # Verificar status
    sleep 5
    docker ps | grep oficios-frontend
    
    echo "✅ Deploy completo!"
ENDSSH

# 6. Limpar arquivo temporário
rm -f .env.deploy

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 DEPLOY COMPLETO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Aplicação rodando em:"
echo "   IP: http://62.72.8.164:3000"
echo "   Domínio: https://$DOMAIN (após configurar DNS)"
echo ""
echo "🔧 Comandos úteis no VPS:"
echo "   ssh $VPS_HOST"
echo "   cd /opt/oficios"
echo "   docker-compose logs -f"
echo "   docker-compose restart"
echo ""
echo "✅ Próximo passo: Configurar DNS apontando para 62.72.8.164"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

