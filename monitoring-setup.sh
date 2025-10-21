#!/bin/bash
# Setup de Monitoramento Básico para n.Oficios

set -e

echo "════════════════════════════════════════════════════════════"
echo "  🔍 Setup Monitoramento n.Oficios"
echo "════════════════════════════════════════════════════════════"
echo ""

# 1. Verificar espaço em disco
echo "📊 1. Configurando alertas de espaço em disco..."
cat > /usr/local/bin/check-disk-space.sh << 'DISKCHECK'
#!/bin/bash
THRESHOLD=80
USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "⚠️ ALERTA: Disco em $USAGE% (threshold: $THRESHOLD%)"
    # Aqui você pode adicionar envio de email/webhook
fi
DISKCHECK

chmod +x /usr/local/bin/check-disk-space.sh

# 2. Verificar containers rodando
echo "🐳 2. Configurando verificação de containers..."
cat > /usr/local/bin/check-containers.sh << 'CONTAINERCHECK'
#!/bin/bash
cd /var/www/noficios

CONTAINERS=("oficios-frontend" "oficios-backend-python")

for container in "${CONTAINERS[@]}"; do
    STATUS=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null || echo "not_found")
    
    if [ "$STATUS" != "running" ]; then
        echo "⚠️ ALERTA: Container $container está $STATUS"
        # Tentar restart
        docker compose -f docker-compose.vps.yml restart "$container" || true
    fi
done
CONTAINERCHECK

chmod +x /usr/local/bin/check-containers.sh

# 3. Configurar cron jobs
echo "⏰ 3. Configurando cron jobs..."
(crontab -l 2>/dev/null || true; cat << 'CRON'
# n.Oficios Monitoring
*/5 * * * * /usr/local/bin/check-disk-space.sh >> /var/log/noficios-disk-check.log 2>&1
*/2 * * * * /usr/local/bin/check-containers.sh >> /var/log/noficios-container-check.log 2>&1
0 2 * * * find /var/www/noficios/data/logs -name "*.log" -mtime +7 -delete
CRON
) | crontab -

# 4. Criar script de status
echo "📋 4. Criando script de status..."
cat > /usr/local/bin/noficios-status.sh << 'STATUSCHECK'
#!/bin/bash
echo "════════════════════════════════════════════════════════════"
echo "  📊 Status n.Oficios"
echo "════════════════════════════════════════════════════════════"
echo ""

cd /var/www/noficios

echo "🐳 CONTAINERS:"
docker compose -f docker-compose.vps.yml ps

echo ""
echo "💾 DISCO:"
df -h / | grep -E "Filesystem|/$"

echo ""
echo "🔍 HEALTH CHECKS:"
curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || echo "Frontend: ❌"
curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || echo "Backend: ❌"

echo ""
echo "📝 ÚLTIMOS LOGS (Frontend):"
docker logs oficios-frontend --tail 5 2>&1

echo ""
echo "📝 ÚLTIMOS LOGS (Backend):"
docker logs oficios-backend-python --tail 5 2>&1

echo ""
echo "════════════════════════════════════════════════════════════"
STATUSCHECK

chmod +x /usr/local/bin/noficios-status.sh

# 5. Criar script de backup database
echo "💾 5. Configurando script de backup..."
cat > /usr/local/bin/noficios-backup.sh << 'BACKUPSCRIPT'
#!/bin/bash
# Backup do Neon Database (documentação)

echo "════════════════════════════════════════════════════════════"
echo "  💾 Backup n.Oficios Database"
echo "════════════════════════════════════════════════════════════"
echo ""

# Neon faz backup automático diário
# Retenção: 7 dias no Free Tier
# Para restore: usar Neon Console ou API

echo "✅ Neon Database Backups:"
echo "   - Backup automático: ATIVO (diário)"
echo "   - Retenção: 7 dias"
echo "   - Point-in-Time Recovery: Disponível"
echo ""
echo "📖 Para restaurar:"
echo "   1. Acesse: console.neon.tech"
echo "   2. Selecione projeto: noficios"
echo "   3. Aba 'Backups'"
echo "   4. Escolha data/hora"
echo "   5. Clique 'Restore'"
echo ""
echo "════════════════════════════════════════════════════════════"
BACKUPSCRIPT

chmod +x /usr/local/bin/noficios-backup.sh

echo ""
echo "✅ COMPLETO!"
echo ""
echo "📋 Comandos disponíveis:"
echo "   noficios-status.sh    - Ver status completo"
echo "   noficios-backup.sh    - Info sobre backups"
echo ""
echo "📊 Monitoramento:"
echo "   ✅ Disk space check (a cada 5 min)"
echo "   ✅ Container check (a cada 2 min)"
echo "   ✅ Log rotation (diário às 2h)"
echo ""
echo "📝 Logs:"
echo "   /var/log/noficios-disk-check.log"
echo "   /var/log/noficios-container-check.log"
echo ""
echo "════════════════════════════════════════════════════════════"
